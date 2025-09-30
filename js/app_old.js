'use strict';

// App State
const AppState = {
    currentTab: 'dashboard',
    expenses: [],
    categories: {
        makanan: { name: 'Makanan & Minuman', icon: '🍽️', color: '#FF5722' },
        transportasi: { name: 'Transportasi', icon: '🚗', color: '#2196F3' },
        belanja: { name: 'Belanja', icon: '🛒', color: '#4CAF50' },
        hiburan: { name: 'Hiburan', icon: '🎬', color: '#9C27B0' },
        kesehatan: { name: 'Kesehatan', icon: '🏥', color: '#F44336' },
        pendidikan: { name: 'Pendidikan', icon: '📚', color: '#FF9800' },
        tagihan: { name: 'Tagihan', icon: '💳', color: '#607D8B' },
        lainnya: { name: 'Lainnya', icon: '📝', color: '#795548' }
    },
    filters: {
        month: '',
        category: ''
    },
    editingExpense: null
};

// DOM Elements
const Elements = {
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    expenseForm: document.getElementById('expenseForm'),
    editForm: document.getElementById('editForm'),
    editModal: document.getElementById('editModal'),
    toast: document.getElementById('toast'),
    
    // Dashboard elements
    todayAmount: document.getElementById('todayAmount'),
    weekAmount: document.getElementById('weekAmount'),
    monthAmount: document.getElementById('monthAmount'),
    recentExpenses: document.getElementById('recentExpenses'),
    
    // History elements
    expenseList: document.getElementById('expenseList'),
    filterMonth: document.getElementById('filterMonth'),
    filterCategory: document.getElementById('filterCategory'),
    clearFilters: document.getElementById('clearFilters'),
    totalFiltered: document.getElementById('totalFiltered'),
    
    // Analytics elements
    chartPeriod: document.getElementById('chartPeriod'),
    dailyAverage: document.getElementById('dailyAverage'),
    topCategory: document.getElementById('topCategory'),
    totalTransactions: document.getElementById('totalTransactions')
};

// Utility Functions
const Utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    },
    
    formatDate: (date) => {
        return new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    },
    
    formatTime: (time) => {
        return new Intl.DateTimeFormat('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(`2000-01-01T${time}`));
    },
    
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    getDateRange: (period) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (period) {
            case 'today':
                return {
                    start: today,
                    end: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                };
            case 'week':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 7);
                return { start: startOfWeek, end: endOfWeek };
            case 'month':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                return { start: startOfMonth, end: endOfMonth };
            case 'year':
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                const endOfYear = new Date(today.getFullYear() + 1, 0, 1);
                return { start: startOfYear, end: endOfYear };
            default:
                return { start: new Date(0), end: new Date() };
        }
    }
};

// Event Listeners
function initializeEventListeners() {
    // Navigation
    Elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Forms
    Elements.expenseForm.addEventListener('submit', handleExpenseSubmit);
    Elements.editForm.addEventListener('submit', handleEditSubmit);
    
    // Modal
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    Elements.editModal.addEventListener('click', (e) => {
        if (e.target === Elements.editModal) {
            closeModal();
        }
    });
    
    // Delete button
    document.getElementById('deleteBtn').addEventListener('click', handleDelete);
    
    // Filters
    Elements.filterMonth.addEventListener('change', applyFilters);
    Elements.filterCategory.addEventListener('change', applyFilters);
    Elements.clearFilters.addEventListener('click', clearFilters);
    
    // Chart period
    Elements.chartPeriod.addEventListener('change', updateCharts);
    
    // Sync and settings (placeholder)
    document.getElementById('syncBtn').addEventListener('click', () => {
        showToast('Fitur sinkronisasi akan segera hadir', 'info');
    });
    
    document.getElementById('settingsBtn').addEventListener('click', () => {
        showToast('Fitur pengaturan akan segera hadir', 'info');
    });
}

// Tab Management
function switchTab(tabName) {
    // Update nav tabs
    Elements.navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    Elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
    
    AppState.currentTab = tabName;
    
    // Update content based on tab
    switch (tabName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'history':
            updateHistory();
            break;
        case 'analytics':
            updateAnalytics();
            break;
        case 'add-expense':
            resetExpenseForm();
            break;
    }
}

// Form Handling
function handleExpenseSubmit(e) {
    e.preventDefault();
    
    // Validate form first
    if (!UI.validateForm(e.target)) {
        showToast('Mohon perbaiki kesalahan pada form', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    
    // Additional amount validation
    if (isNaN(amount) || amount <= 0) {
        showToast('Jumlah harus berupa angka positif', 'error');
        return;
    }
    
    const expense = {
        id: Utils.generateId(),
        amount: Math.round(amount), // Ensure integer
        category: formData.get('category'),
        description: formData.get('description') || '',
        date: formData.get('date'),
        time: formData.get('time'),
        timestamp: new Date(`${formData.get('date')}T${formData.get('time')}`).getTime()
    };
    
    // Add to expenses
    AppState.expenses.push(expense);
    Storage.saveExpenses(AppState.expenses);
    
    // Show success message
    showToast('Pengeluaran berhasil ditambahkan', 'success');
    
    // Reset form and switch to dashboard
    resetExpenseForm();
    switchTab('dashboard');
}

function handleEditSubmit(e) {
    e.preventDefault();
    
    if (!AppState.editingExpense) return;
    
    // Validate form first
    if (!UI.validateForm(e.target)) {
        showToast('Mohon perbaiki kesalahan pada form', 'error');
        return;
    }
    
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount'));
    
    // Additional amount validation
    if (isNaN(amount) || amount <= 0) {
        showToast('Jumlah harus berupa angka positif', 'error');
        return;
    }
    
    const updatedExpense = {
        ...AppState.editingExpense,
        amount: Math.round(amount), // Ensure integer
        category: formData.get('category'),
        description: formData.get('description') || '',
        date: formData.get('date'),
        time: formData.get('time'),
        timestamp: new Date(`${formData.get('date')}T${formData.get('time')}`).getTime()
    };
    
    // Update expense
    const index = AppState.expenses.findIndex(exp => exp.id === AppState.editingExpense.id);
    if (index !== -1) {
        AppState.expenses[index] = updatedExpense;
        Storage.saveExpenses(AppState.expenses);
        
        showToast('Pengeluaran berhasil diperbarui', 'success');
        closeModal();
        updateCurrentView();
    }
}

function handleDelete() {
    if (!AppState.editingExpense) return;
    
    if (confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
        AppState.expenses = AppState.expenses.filter(exp => exp.id !== AppState.editingExpense.id);
        Storage.saveExpenses(AppState.expenses);
        
        showToast('Pengeluaran berhasil dihapus', 'success');
        closeModal();
        updateCurrentView();
    }
}

function resetExpenseForm() {
    Elements.expenseForm.reset();
    
    // Set current date and time
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    
    document.getElementById('date').value = dateStr;
    document.getElementById('time').value = timeStr;
}

// Modal Management
function openEditModal(expense) {
    AppState.editingExpense = expense;
    
    // Populate form
    document.getElementById('editAmount').value = expense.amount;
    document.getElementById('editCategory').value = expense.category;
    document.getElementById('editDescription').value = expense.description;
    document.getElementById('editDate').value = expense.date;
    document.getElementById('editTime').value = expense.time;
    
    Elements.editModal.classList.add('show');
}

function closeModal() {
    Elements.editModal.classList.remove('show');
    AppState.editingExpense = null;
}

// Toast Notifications
function showToast(message, type = 'info') {
    Elements.toast.textContent = message;
    Elements.toast.className = `toast ${type}`;
    Elements.toast.classList.add('show');
    
    setTimeout(() => {
        Elements.toast.classList.remove('show');
    }, 3000);
}

// Dashboard Updates
function updateDashboard() {
    updateSummaryCards();
    updateRecentExpenses();
}

function updateSummaryCards() {
    const todayRange = Utils.getDateRange('today');
    const weekRange = Utils.getDateRange('week');
    const monthRange = Utils.getDateRange('month');
    
    const todayTotal = calculateTotal(AppState.expenses, todayRange.start, todayRange.end);
    const weekTotal = calculateTotal(AppState.expenses, weekRange.start, weekRange.end);
    const monthTotal = calculateTotal(AppState.expenses, monthRange.start, monthRange.end);
    
    Elements.todayAmount.textContent = Utils.formatCurrency(todayTotal);
    Elements.weekAmount.textContent = Utils.formatCurrency(weekTotal);
    Elements.monthAmount.textContent = Utils.formatCurrency(monthTotal);
}

function updateRecentExpenses() {
    const todayRange = Utils.getDateRange('today');
    const todayExpenses = AppState.expenses
        .filter(expense => {
            const expenseDate = new Date(expense.timestamp);
            return expenseDate >= todayRange.start && expenseDate < todayRange.end;
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
    
    if (todayExpenses.length === 0) {
        Elements.recentExpenses.innerHTML = `
            <div class="empty-state">
                <i class="icon-empty"></i>
                <p>Belum ada pengeluaran hari ini</p>
            </div>
        `;
        return;
    }
    
    Elements.recentExpenses.innerHTML = todayExpenses
        .map(expense => createExpenseItemHTML(expense))
        .join('');
}

// History Updates
function updateHistory() {
    populateMonthFilter();
    applyFilters();
}

function populateMonthFilter() {
    const months = [...new Set(AppState.expenses.map(expense => {
        const date = new Date(expense.timestamp);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }))].sort().reverse();
    
    Elements.filterMonth.innerHTML = '<option value="">Semua Bulan</option>' +
        months.map(month => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(year, monthNum - 1).toLocaleDateString('id-ID', { 
                year: 'numeric', 
                month: 'long' 
            });
            return `<option value="${month}">${monthName}</option>`;
        }).join('');
}

function applyFilters() {
    const monthFilter = Elements.filterMonth.value;
    const categoryFilter = Elements.filterCategory.value;
    
    let filteredExpenses = AppState.expenses;
    
    if (monthFilter) {
        filteredExpenses = filteredExpenses.filter(expense => {
            const date = new Date(expense.timestamp);
            const expenseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return expenseMonth === monthFilter;
        });
    }
    
    if (categoryFilter) {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === categoryFilter);
    }
    
    // Update total
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    Elements.totalFiltered.textContent = Utils.formatCurrency(total);
    
    // Update expense list
    displayExpenseList(filteredExpenses);
}

function clearFilters() {
    Elements.filterMonth.value = '';
    Elements.filterCategory.value = '';
    applyFilters();
}

function displayExpenseList(expenses) {
    if (expenses.length === 0) {
        Elements.expenseList.innerHTML = `
            <div class="empty-state">
                <i class="icon-empty"></i>
                <p>Tidak ada data pengeluaran</p>
            </div>
        `;
        return;
    }
    
    const sortedExpenses = expenses.sort((a, b) => b.timestamp - a.timestamp);
    Elements.expenseList.innerHTML = sortedExpenses
        .map(expense => createExpenseItemHTML(expense))
        .join('');
}

function createExpenseItemHTML(expense) {
    const category = AppState.categories[expense.category];
    const date = new Date(expense.timestamp);
    
    return `
        <div class="expense-item" onclick="openEditModal(${JSON.stringify(expense).replace(/"/g, '&quot;')})">
            <div class="expense-info">
                <div class="expense-category">
                    ${category.icon} ${category.name}
                </div>
                <div class="expense-description">${expense.description || 'Tidak ada deskripsi'}</div>
                <div class="expense-date">
                    ${Utils.formatDate(date)} • ${Utils.formatTime(expense.time)}
                </div>
            </div>
            <div class="expense-amount">
                ${Utils.formatCurrency(expense.amount)}
            </div>
        </div>
    `;
}

// Analytics Updates
function updateAnalytics() {
    const period = Elements.chartPeriod.value;
    updateCharts();
    updateStatistics(period);
}

function updateStatistics(period = 'month') {
    const range = Utils.getDateRange(period);
    const periodExpenses = AppState.expenses.filter(expense => {
        const expenseDate = new Date(expense.timestamp);
        return expenseDate >= range.start && expenseDate < range.end;
    });
    
    // Daily average
    const days = Math.ceil((range.end - range.start) / (24 * 60 * 60 * 1000));
    const total = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const dailyAverage = days > 0 ? total / days : 0;
    Elements.dailyAverage.textContent = Utils.formatCurrency(dailyAverage);
    
    // Top category
    const categoryTotals = {};
    periodExpenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
        categoryTotals[a] > categoryTotals[b] ? a : b, Object.keys(categoryTotals)[0]);
    
    Elements.topCategory.textContent = topCategory ? 
        AppState.categories[topCategory].name : '-';
    
    // Total transactions
    Elements.totalTransactions.textContent = periodExpenses.length.toString();
}

// Helper Functions
function calculateTotal(expenses, startDate, endDate) {
    return expenses
        .filter(expense => {
            const expenseDate = new Date(expense.timestamp);
            return expenseDate >= startDate && expenseDate < endDate;
        })
        .reduce((total, expense) => total + expense.amount, 0);
}

function updateCurrentView() {
    switch (AppState.currentTab) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'history':
            updateHistory();
            break;
        case 'analytics':
            updateAnalytics();
            break;
    }
}

// Initialize App
function initializeApp() {
    // Load data
    AppState.expenses = Storage.loadExpenses();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Set up initial form values
    resetExpenseForm();
    
    // Update initial view
    updateDashboard();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully');
            })
            .catch(error => {
                console.log('Service Worker registration failed');
            });
    }
}

// Global functions for onclick handlers
window.switchTab = switchTab;
window.openEditModal = openEditModal;
window.closeModal = closeModal;

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);