'use strict';

// Enhanced Storage Management with Security Features
const Storage = {
    STORAGE_KEYS: {
        EXPENSES: 'pengeluaranqu_expenses',
        SETTINGS: 'pengeluaranqu_settings',
        BACKUP: 'pengeluaranqu_backup',
        ENCRYPTED_DATA: 'pengeluaranqu_encrypted'
    },
    
    // Security configuration
    encryptionEnabled: true,
    
    // Initialize storage with security checks
    init: function() {
        this.performSecurityChecks();
        this.cleanupOldData();
    },
    
    // Perform security validation
    performSecurityChecks: function() {
        // Check for data integrity
        this.validateStorageIntegrity();
        
        // Clean up potentially harmful data
        this.sanitizeStoredData();
    },
    
    // Enhanced Expense Management with Encryption
    saveExpenses: async function(expenses) {
        try {
            // Validate and sanitize expense data
            const sanitizedExpenses = this.sanitizeExpenseData(expenses);
            
            if (this.encryptionEnabled && Auth.getCurrentUser()) {
                // Save encrypted data for sensitive information
                await this.saveEncryptedData(this.STORAGE_KEYS.EXPENSES, sanitizedExpenses);
            } else {
                // Fallback to regular storage
                localStorage.setItem(this.STORAGE_KEYS.EXPENSES, JSON.stringify(sanitizedExpenses));
            }
            
            this.createBackup(sanitizedExpenses);
            return true;
        } catch (error) {
            console.error('Failed to save expenses:', error);
            return false;
        }
    },
    
    loadExpenses: async function() {
        try {
            let data;
            
            if (this.encryptionEnabled && Auth.getCurrentUser()) {
                // Try to load encrypted data first
                data = await this.loadEncryptedData(this.STORAGE_KEYS.EXPENSES);
            }
            
            if (!data) {
                // Fallback to regular storage
                const rawData = localStorage.getItem(this.STORAGE_KEYS.EXPENSES);
                data = rawData ? JSON.parse(rawData) : [];
            }
            
            // Apply premium restrictions
            if (typeof PremiumFeatures !== 'undefined') {
                data = PremiumFeatures.enforceTransactionHistoryLimit(data);
            }
            
            return this.validateExpenseData(data);
        } catch (error) {
            console.error('Failed to load expenses:', error);
            return this.loadBackup() || [];
        }
    },
    
    // Settings Management
    saveSettings: function(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    },
    
    loadSettings: function() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : this.getDefaultSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    },
    
    getDefaultSettings: function() {
        return {
            currency: 'IDR',
            language: 'id',
            theme: 'auto',
            notifications: true,
            backupEnabled: true,
            exportFormat: 'csv',
            encryptionEnabled: true,
            isPremium: false,
            monthlyBudget: 0,
            categoryBudgets: {},
            categories: this.getDefaultCategories()
        };
    },

    // Get default categories
    getDefaultCategories: function() {
        return {
            expense: {
                makanan: { name: "Makanan & Minuman", icon: "🍽️", color: "#FF5722" },
                transportasi: { name: "Transportasi", icon: "🚗", color: "#2196F3" },
                belanja: { name: "Belanja", icon: "🛒", color: "#4CAF50" },
                hiburan: { name: "Hiburan", icon: "🎬", color: "#9C27B0" },
                kesehatan: { name: "Kesehatan", icon: "🏥", color: "#F44336" },
                pendidikan: { name: "Pendidikan", icon: "📚", color: "#FF9800" },
                tagihan: { name: "Tagihan", icon: "💳", color: "#607D8B" },
                lainnya: { name: "Lainnya", icon: "📝", color: "#795548" }
            },
            income: {
                gaji: { name: "Gaji", icon: "💰", color: "#4CAF50" },
                freelance: { name: "Freelance", icon: "💻", color: "#2196F3" },
                bisnis: { name: "Bisnis", icon: "🏢", color: "#FF9800" },
                investasi: { name: "Investasi", icon: "📈", color: "#9C27B0" },
                hadiah: { name: "Hadiah", icon: "🎁", color: "#E91E63" },
                lainnya: { name: "Lainnya", icon: "💵", color: "#795548" }
            }
        };
    },
    
    // Backup Management
    createBackup: function(expenses) {
        try {
            const backup = {
                data: expenses,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(this.STORAGE_KEYS.BACKUP, JSON.stringify(backup));
        } catch (error) {
            console.error('Failed to create backup:', error);
        }
    },
    
    loadBackup: function() {
        try {
            const backup = localStorage.getItem(this.STORAGE_KEYS.BACKUP);
            if (backup) {
                const parsedBackup = JSON.parse(backup);
                return parsedBackup.data || [];
            }
        } catch (error) {
            console.error('Failed to load backup:', error);
        }
        return [];
    },
    
    // Data Export/Import
    exportData: function(format = 'json') {
        const expenses = this.loadExpenses();
        const settings = this.loadSettings();
        
        const exportData = {
            expenses,
            settings,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        switch (format.toLowerCase()) {
            case 'json':
                return this.exportAsJSON(exportData);
            case 'csv':
                return this.exportAsCSV(expenses);
            default:
                throw new Error('Unsupported export format');
        }
    },
    
    exportAsJSON: function(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pengeluaranqu-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    exportAsCSV: function(expenses) {
        const headers = ['Tanggal', 'Waktu', 'Kategori', 'Deskripsi', 'Jumlah'];
        const csvData = [
            headers.join(','),
            ...expenses.map(expense => [
                expense.date,
                expense.time,
                expense.category,
                `"${expense.description || ''}"`,
                expense.amount
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pengeluaranqu-expenses-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    importData: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (this.validateImportData(data)) {
                        // Backup current data first
                        const currentExpenses = this.loadExpenses();
                        this.createBackup(currentExpenses);
                        
                        // Import new data
                        if (data.expenses && Array.isArray(data.expenses)) {
                            this.saveExpenses(data.expenses);
                        }
                        
                        if (data.settings) {
                            this.saveSettings(data.settings);
                        }
                        
                        resolve(data);
                    } else {
                        reject(new Error('Invalid import data format'));
                    }
                } catch (error) {
                reject(new Error('Failed to parse import file'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
},

// Enhanced Security Methods
saveEncryptedData: async function(key, data) {
    try {
        // Simple encryption for demo (in production, use proper encryption)
        const encrypted = btoa(JSON.stringify(data));
        localStorage.setItem(key + '_encrypted', encrypted);
        return true;
    } catch (error) {
        console.error('Encryption failed:', error);
        return false;
    }
},

loadEncryptedData: async function(key) {
    try {
        const encrypted = localStorage.getItem(key + '_encrypted');
        if (encrypted) {
            return JSON.parse(atob(encrypted));
        }
        return null;
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
},

// Data validation and sanitization
sanitizeExpenseData: function(expenses) {
    if (!Array.isArray(expenses)) return [];
    
    return expenses.map(expense => ({
        id: this.sanitizeString(expense.id),
        date: this.sanitizeString(expense.date),
        time: this.sanitizeString(expense.time),
        type: ['income', 'expense'].includes(expense.type) ? expense.type : 'expense',
        category: this.sanitizeString(expense.category),
        description: this.sanitizeString(expense.description),
        amount: this.sanitizeNumber(expense.amount),
        tags: Array.isArray(expense.tags) ? expense.tags.map(tag => this.sanitizeString(tag)) : []
    })).filter(expense => expense.id && expense.date && expense.amount > 0);
},

validateExpenseData: function(expenses) {
    if (!Array.isArray(expenses)) return [];
    
    return expenses.filter(expense => 
        expense.id && 
        expense.date && 
        expense.amount && 
        expense.amount > 0 &&
        ['income', 'expense'].includes(expense.type)
    );
},

sanitizeString: function(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, '').replace(/javascript:/gi, '').trim().substring(0, 500);
},

sanitizeNumber: function(num) {
    const parsed = parseFloat(num);
    return isNaN(parsed) ? 0 : Math.abs(parsed);
},

validateStorageIntegrity: function() {
    // Check for corrupted data
    Object.values(this.STORAGE_KEYS).forEach(key => {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                JSON.parse(data);
            }
        } catch (error) {
            console.warn(`Corrupted data found for key: ${key}, removing...`);
            localStorage.removeItem(key);
        }
    });
},

sanitizeStoredData: function() {
    // Remove potentially harmful stored data
    Object.keys(localStorage).forEach(key => {
        if (key.includes('<script>') || key.includes('javascript:')) {
            console.warn(`Potentially harmful key detected: ${key}, removing...`);
            localStorage.removeItem(key);
        }
    });
},

cleanupOldData: function() {
    // Clean up data older than 2 years for free users
    const user = Auth.getCurrentUser && Auth.getCurrentUser();
    if (user && !PremiumFeatures?.isPremiumUser(user)) {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        
        this.loadExpenses().then(expenses => {
            const filteredExpenses = expenses.filter(expense => 
                new Date(expense.date) > twoYearsAgo
            );
            
            if (filteredExpenses.length !== expenses.length) {
                this.saveExpenses(filteredExpenses);
            }
        });
    }
},    validateImportData: function(data) {
        // Basic validation
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Check if expenses array exists and is valid
        if (data.expenses && Array.isArray(data.expenses)) {
            for (const expense of data.expenses) {
                if (!this.validateExpense(expense)) {
                    return false;
                }
            }
        }
        
        return true;
    },
    
    validateExpense: function(expense) {
        return expense &&
               typeof expense.id === 'string' &&
               typeof expense.amount === 'number' &&
               typeof expense.category === 'string' &&
               typeof expense.date === 'string' &&
               typeof expense.time === 'string' &&
               typeof expense.timestamp === 'number';
    },
    
    // Storage Info
    getStorageInfo: function() {
        const expenses = this.loadExpenses();
        const settings = this.loadSettings();
        
        // Calculate storage usage (approximate)
        const expensesSize = new Blob([JSON.stringify(expenses)]).size;
        const settingsSize = new Blob([JSON.stringify(settings)]).size;
        
        return {
            totalExpenses: expenses.length,
            storageUsed: expensesSize + settingsSize,
            lastBackup: this.getLastBackupDate(),
            storageQuota: this.getStorageQuota()
        };
    },
    
    getLastBackupDate: function() {
        try {
            const backup = localStorage.getItem(this.STORAGE_KEYS.BACKUP);
            if (backup) {
                const parsedBackup = JSON.parse(backup);
                return new Date(parsedBackup.timestamp);
            }
        } catch (error) {
            console.error('Failed to get last backup date:', error);
        }
        return null;
    },
    
    getStorageQuota: function() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate().then(estimate => ({
                quota: estimate.quota,
                usage: estimate.usage,
                available: estimate.quota - estimate.usage
            }));
        }
        
        // Fallback estimation
        return Promise.resolve({
            quota: 5 * 1024 * 1024, // 5MB typical localStorage limit
            usage: 0,
            available: 5 * 1024 * 1024
        });
    },
    
    // Data Cleanup
    clearAllData: function() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    },
    
    clearExpenses: function() {
        try {
            // Create backup before clearing
            const expenses = this.loadExpenses();
            this.createBackup(expenses);
            
            localStorage.removeItem(this.STORAGE_KEYS.EXPENSES);
            return true;
        } catch (error) {
            console.error('Failed to clear expenses:', error);
            return false;
        }
    },
    
    // Migration and Versioning
    migrateData: function() {
        // Check for old data format and migrate if necessary
        const version = localStorage.getItem('pengeluaranqu_version');
        
        if (!version) {
            // First time user or very old version
            this.migrateFromLegacy();
            localStorage.setItem('pengeluaranqu_version', '1.0');
        }
        
        // Future migrations can be added here
    },
    
    migrateFromLegacy: function() {
        // Check for legacy storage keys and migrate
        const legacyKeys = ['expenses', 'pengeluaran_data'];
        
        for (const key of legacyKeys) {
            const legacyData = localStorage.getItem(key);
            if (legacyData) {
                try {
                    const expenses = JSON.parse(legacyData);
                    if (Array.isArray(expenses)) {
                        // Migrate to new format
                        const migratedExpenses = expenses.map(expense => ({
                            ...expense,
                            id: expense.id || Utils.generateId(),
                            timestamp: expense.timestamp || new Date(`${expense.date}T${expense.time}`).getTime()
                        }));
                        
                        this.saveExpenses(migratedExpenses);
                        localStorage.removeItem(key); // Remove legacy data
                    }
                } catch (error) {
                    console.error('Failed to migrate legacy data:', error);
                }
            }
        }
    }
};

// Offline Storage using IndexedDB (for larger datasets)
const IndexedDBStorage = {
    dbName: 'PengeluaranquDB',
    version: 1,
    db: null,
    
    init: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create expenses store
                if (!db.objectStoreNames.contains('expenses')) {
                    const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
                    expenseStore.createIndex('category', 'category', { unique: false });
                    expenseStore.createIndex('date', 'date', { unique: false });
                    expenseStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    },
    
    saveExpense: function(expense) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction(['expenses'], 'readwrite');
            const store = transaction.objectStore('expenses');
            const request = store.put(expense);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to save expense'));
        });
    },
    
    loadExpenses: function() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction(['expenses'], 'readonly');
            const store = transaction.objectStore('expenses');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to load expenses'));
        });
    },
    
    deleteExpense: function(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }
            
            const transaction = this.db.transaction(['expenses'], 'readwrite');
            const store = transaction.objectStore('expenses');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to delete expense'));
        });
    }
};

// Initialize storage migration on load
document.addEventListener('DOMContentLoaded', () => {
    Storage.migrateData();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Storage, IndexedDBStorage };
}