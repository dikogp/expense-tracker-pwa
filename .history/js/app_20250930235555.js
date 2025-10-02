"use strict";

// Utility functions - make it globally available
window.Utils = {
  formatCurrency: (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  },

  formatDate: (date) => {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  },

  formatTime: (time) => {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(`2000-01-01T${time}`));
  },

  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  getDateRange: (period) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case "today":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      case "week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return { start: startOfWeek, end: endOfWeek };
      case "month":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          1
        );
        return { start: startOfMonth, end: endOfMonth };
      case "year":
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear() + 1, 0, 1);
        return { start: startOfYear, end: endOfYear };
      default:
        return { start: new Date(0), end: new Date() };
    }
  },
};

const ExpenseTracker = {
  transactions: [],
  categories: {},
  budget: {},
  currentUser: null,
  currentView: "dashboard",
  chart: null,
  tipsShown: false,

  init() {
    this.bindEvents();
    this.updateBudgetStatus();
    this.setDefaultDate();

    // Initial check for current user
    this.checkAuthState();
  },

  bindEvents() {
    // Navigation events
    document.addEventListener("click", (e) => {
      const target = e.target;

      if (target.matches("[data-tab]")) {
        this.showSection(target.dataset.tab);
      }

      if (target.matches(".quick-action-btn")) {
        const type = target.dataset.type;
        const action = target.dataset.action;

        if (action === "quick-add") {
          this.showQuickAddModal(type);
        } else {
          this.showSection("add-transaction");
          this.setTransactionType(type);
        }
      }

      if (e.target.matches(".transaction-item")) {
        this.showTransactionDetails(e.target.dataset.id);
      }

      if (e.target.matches(".btn-logout")) {
        this.logout();
      }
    });

    // Form submissions
    const transactionForm = document.getElementById("transactionForm");
    if (transactionForm) {
      transactionForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.addTransaction();
      });
    }

    const budgetForm = document.getElementById("budgetForm");
    if (budgetForm) {
      budgetForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.setBudget();
      });
    }

    // Transaction type tabs
    document.querySelectorAll(".type-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.setTransactionType(tab.dataset.type);
      });
    });

    // Profile modal
    const profileBtn = document.querySelector(".btn-profile");
    if (profileBtn) {
      profileBtn.addEventListener("click", () => {
        this.showProfile();
      });
    }

    // Quick add form
    const quickAddForm = document.getElementById("quickAddForm");
    if (quickAddForm) {
      quickAddForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleQuickAdd();
      });
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById("clearFilters");
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        this.clearFilters();
      });
    }

    // Filter dropdowns
    const filterElements = ["filterMonth", "filterType", "filterCategory"];
    filterElements.forEach((filterId) => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener("change", () => {
          this.applyFilters();
        });
      }
    });
  },

  checkAuthState() {
    this.currentUser = Auth.getCurrentUser();

    if (this.currentUser) {
      document.querySelector(".auth-screen").classList.remove("active");
      document.querySelector(".main-app").classList.add("active");
      this.loadUserData();
      this.updateUI();

      // Show welcome tips for new users - only once after successful authentication
      setTimeout(() => {
        this.showWelcomeTips();
      }, 500);
    } else {
      document.querySelector(".auth-screen").classList.add("active");
      document.querySelector(".main-app").classList.remove("active");
      // Reset tips when logged out
      this.tipsShown = false;
    }
  },

  loadUserData() {
    if (!this.currentUser) return;

    const userId = this.currentUser.id;
    this.transactions =
      JSON.parse(localStorage.getItem(`transactions_${userId}`)) || [];

    // Load categories from user settings or default
    if (this.currentUser.settings && this.currentUser.settings.categories) {
      this.categories = this.currentUser.settings.categories;
    } else if (typeof Auth !== "undefined" && Auth.getDefaultCategories) {
      this.categories = Auth.getDefaultCategories();
    } else {
      // Fallback default categories
      this.categories = {
        expense: this.getDefaultExpenseCategories(),
        income: this.getDefaultIncomeCategories(),
      };
    }

    this.budget = JSON.parse(localStorage.getItem(`budget_${userId}`)) || {};

    // Update UI after loading
    this.updateUI();
  },

  saveUserData() {
    if (!this.currentUser) return;

    const userId = this.currentUser.id;
    localStorage.setItem(
      `transactions_${userId}`,
      JSON.stringify(this.transactions)
    );
    localStorage.setItem(
      `categories_${userId}`,
      JSON.stringify(this.categories)
    );
    localStorage.setItem(`budget_${userId}`, JSON.stringify(this.budget));
  },

  showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll(".tab-content").forEach((section) => {
      section.classList.remove("active");
    });

    // Remove active class from nav tabs
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add("active");
    }

    // Set active nav tab
    const navTab = document.querySelector(`[data-tab="${sectionId}"]`);
    if (navTab) {
      navTab.classList.add("active");
    }

    this.currentView = sectionId;

    // Dispatch tab change event for enhanced features
    document.dispatchEvent(
      new CustomEvent("tab-changed", {
        detail: { tab: sectionId, previousTab: this.currentView },
      })
    );

    // Update section content
    switch (sectionId) {
      case "dashboard":
        this.updateDashboard();
        this.updateBudget(); // Budget integrated into dashboard (F6)
        this.updateCategoryChart(); // Category chart (F4)
        this.showQuickAddButton(true); // FR-002: Show quick add button
        break;
      case "history":
        this.updateHistory();
        this.showQuickAddButton(false);
        break;
      case "add-transaction":
        this.showQuickAddButton(false);
        // FR-002: Focus on amount input for quick entry
        setTimeout(() => {
          const amountInput = document.getElementById("amount");
          if (amountInput) amountInput.focus();

          // Set default date and time
          this.setDefaultDate();
        }, 100);
        break;
      case "analytics":
        this.showQuickAddButton(false);
        // Analytics will be handled by EnhancedFeatures module via tab-changed event
        break;
    }
  },

  setTransactionType(type) {
    // Update type tabs
    document.querySelectorAll(".type-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.type === type);
    });

    // Update category options
    this.updateCategoryOptions(type);

    // Update form
    const form = document.getElementById("transactionForm");
    if (form) {
      form.dataset.type = type;
    }
  }

  updateCategoryOptions(type) {
    const categorySelect = document.getElementById("category");
    const quickCategorySelect = document.getElementById("quickAddCategory");

    if (!categorySelect && !quickCategorySelect) return;

    // Get categories from current user settings
    const user = Auth.getCurrentUser();
    let categories = {};

    if (user && user.settings && user.settings.categories) {
      categories =
        type === "income"
          ? user.settings.categories.income
          : user.settings.categories.expense;
    } else {
      // Fallback to default categories
      categories =
        type === "income"
          ? this.getDefaultIncomeCategories()
          : this.getDefaultExpenseCategories();
    }

    // Update main category select
    if (categorySelect) {
      categorySelect.innerHTML = "";
      Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${category.icon || ""} ${category.name}`;
        categorySelect.appendChild(option);
      });
    }

    // Update quick add category select
    if (quickCategorySelect) {
      quickCategorySelect.innerHTML = "";
      Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${category.icon || ""} ${category.name}`;
        quickCategorySelect.appendChild(option);
      });
    }
  },,,

  getDefaultExpenseCategories() {
    return {
      makanan: { name: "Makanan & Minuman", icon: "🍽️", color: "#FF5722" },
      transportasi: { name: "Transportasi", icon: "🚗", color: "#2196F3" },
      belanja: { name: "Belanja", icon: "🛒", color: "#4CAF50" },
      hiburan: { name: "Hiburan", icon: "🎬", color: "#9C27B0" },
      kesehatan: { name: "Kesehatan", icon: "🏥", color: "#F44336" },
      pendidikan: { name: "Pendidikan", icon: "📚", color: "#FF9800" },
      tagihan: { name: "Tagihan", icon: "💳", color: "#607D8B" },
      lainnya: { name: "Lainnya", icon: "📝", color: "#795548" },
    };
  },

  getDefaultIncomeCategories() {
    return {
      gaji: { name: "Gaji", icon: "💰", color: "#4CAF50" },
      freelance: { name: "Freelance", icon: "💻", color: "#2196F3" },
      bisnis: { name: "Bisnis", icon: "🏢", color: "#FF9800" },
      investasi: { name: "Investasi", icon: "📈", color: "#9C27B0" },
      hadiah: { name: "Hadiah", icon: "🎁", color: "#E91E63" },
      lainnya: { name: "Lainnya", icon: "💵", color: "#795548" },
    };
  },

  updateAllCategoryDropdowns() {
    // Preserve current selection instead of forcing expense
    const form = document.getElementById("transactionForm");
    const currentType = form?.dataset.type || "expense";
    this.updateCategoryOptions(currentType);

    // Update filter category dropdown
    this.populateCategoryFilter();

    // Update other category dropdowns if they exist
    this.updateEditCategoryOptions(currentType);
    this.updateQuickAddCategoryOptions(currentType);
  },

  updateFilterCategories() {
    const filterSelect = document.getElementById("filterCategory");
    if (!filterSelect) return;

    filterSelect.innerHTML = '<option value="">Semua Kategori</option>';

    if (this.categories.expense) {
      Object.entries(this.categories.expense).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = category.name;
        filterSelect.appendChild(option);
      });
    }
  },

  updateEditCategoryOptions(type = "expense") {
    const editSelect = document.getElementById("editCategory");
    if (!editSelect) return;

    editSelect.innerHTML = "";

    const categories =
      type === "income" ? this.categories.income : this.categories.expense;

    if (categories) {
      Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = category.name;
        editSelect.appendChild(option);
      });
    }
  },

  updateQuickAddCategoryOptions(type = "expense") {
    const quickSelect = document.getElementById("quickAddCategory");
    if (!quickSelect) return;

    quickSelect.innerHTML = "";

    const categories =
      type === "income" ? this.categories.income : this.categories.expense;

    if (categories) {
      Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = category.name;
        quickSelect.appendChild(option);
      });
    }
  },

  addTransaction: function() {
    const form = document.getElementById("transactionForm");
    const formData = new FormData(form);

    // Validasi input
    const amount = parseFloat(formData.get("amount"));
    const category = formData.get("category");
    const date = formData.get("date");

    if (!amount || amount <= 0) {
      this.showToast("Mohon masukkan jumlah yang valid", "error");
      return;
    }

    if (!category) {
      this.showToast("Mohon pilih kategori", "error");
      return;
    }

    if (!date) {
      this.showToast("Mohon pilih tanggal", "error");
      return;
    }

    const transaction = {
      id: Date.now().toString(),
      type: form.dataset.type || "expense",
      amount: amount,
      category: category,
      description: formData.get("description") || "",
      date: date,
      time:
        formData.get("time") ||
        new Date().toTimeString().split(" ")[0].substring(0, 5),
      timestamp: Date.now(),
    };

    this.transactions.push(transaction);
    this.saveUserData();

    // Reset form
    form.reset();

    // Show success message and add notification
    const typeText =
      transaction.type === "income" ? "pemasukan" : "pengeluaran";
    const notifMessage = `${typeText} ${
      transaction.description ? `(${transaction.description})` : ""
    } berhasil ditambahkan`;

    this.showToast(`${typeText} berhasil ditambahkan!`, "success");
    NotificationSystem.addNotification(
      "transaction",
      notifMessage,
      transaction.amount
    );

    // Update UI
    this.updateUI();

    // Go back to dashboard
    this.showSection("dashboard");
  },

  handleQuickAdd: function() {
    const form = document.getElementById("quickAddForm");
    const formData = new FormData(form);

    // Validasi input
    const amount = parseFloat(formData.get("amount"));
    const category = formData.get("category");
    const type = formData.get("type") || form.dataset.type || "expense";

    if (!amount || amount <= 0) {
      this.showToast("Mohon masukkan jumlah yang valid", "error");
      return;
    }

    if (!category) {
      this.showToast("Mohon pilih kategori", "error");
      return;
    }

    const transaction = {
      id: Date.now().toString(),
      type: type,
      amount: amount,
      category: category,
      description: formData.get("description") || "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0].substring(0, 5),
      timestamp: Date.now(),
    };

    this.transactions.push(transaction);
    this.saveUserData();

    // Reset form and close modal
    form.reset();
    window.closeModal("quickAddModal");

    // Show success message and add notification
    const typeText =
      transaction.type === "income" ? "pemasukan" : "pengeluaran";
    const notifMessage = `${typeText} cepat ${
      transaction.description ? `(${transaction.description})` : ""
    } berhasil ditambahkan`;

    this.showToast(`${typeText} berhasil ditambahkan!`, "success");
    NotificationSystem.addNotification(
      "transaction",
      notifMessage,
      transaction.amount
    );

    // Update UI
    this.updateUI();
  }

  deleteTransaction(id) {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      this.transactions = this.transactions.filter((t) => t.id !== id);
      this.saveUserData();
      this.updateUI();
      this.showToast("Transaksi berhasil dihapus!", "success");
    }
  },

  showBudgetModal: function() {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthInput = document.getElementById("budget-month");
    const budgetInput = document.getElementById("monthlyBudget");

    // Set current month as default if no month is selected
    if (monthInput) {
      monthInput.value = monthInput.value || currentMonth;
    }

    // Get current budget for the selected month
    const currentBudget = this.budget[monthInput.value] || 0;

    // Set the current budget in the input
    if (budgetInput) {
      budgetInput.value = currentBudget;
    }

    // Add event listener for month change to update budget value
    monthInput.addEventListener("change", () => {
      const selectedMonth = monthInput.value;
      const monthBudget = this.budget[selectedMonth] || 0;
      budgetInput.value = monthBudget;
    });

    window.openModal("budgetModal");
  },

  setBudget: function() {
    const form = document.getElementById("budgetForm");
    const formData = new FormData(form);

    const amount = parseFloat(formData.get("budget"));
    const monthInput = document.getElementById("budget-month");
    // Use month from input, or default to current month
    const currentMonth =
      monthInput?.value || new Date().toISOString().substring(0, 7);

    if (amount >= 0) {
      // Allow setting budget to 0
      this.budget[currentMonth] = amount;
      this.saveUserData();

      this.showToast("Anggaran berhasil diatur!", "success");
      window.closeModal("budgetModal");
      this.updateUI(); // Call full UI update
    } else {
      this.showToast("Masukkan jumlah anggaran yang valid", "error");
    }
  },

  updateUI: function() {
    // Core recalculations
    this.updateDashboard();
    this.updateBudget();
    this.updateBudgetStatus();

    // Tab-specific updates
    this.updateHistory();
    this.updateAnalytics();

    // Ancillary UI elements
    this.updateUserInfo();

    // Refresh category dropdowns while preserving current type
    this.updateAllCategoryDropdowns();
  }

  showQuickAddModal(type) {
    // Set the type in the form and hidden input
    const form = document.getElementById("quickAddForm");
    const typeInput = document.getElementById("quickAddType");
    const modalTitle = document.getElementById("quickAddTitle");

    if (form && typeInput) {
      form.dataset.type = type;
      typeInput.value = type;

      // Update modal title based on type
      if (modalTitle) {
        modalTitle.textContent =
          type === "income" ? "➕ Tambah Pemasukan" : "➖ Tambah Pengeluaran";
      }

      // Update category options for the selected type
      this.updateCategoryOptions(type);

      // Show the modal
      window.openModal("quickAddModal");

      // Focus on amount input after a short delay
      setTimeout(() => {
        const amountInput = document.getElementById("quickAddAmount");
        if (amountInput) {
          amountInput.focus();
        }
      }, 100);
    }
  },

  updateUserInfo() {
    const userNameEl = document.getElementById("userName");
    const guestBadgeEl = document.getElementById("guestBadge");
    const statsEl = document.getElementById("profileStats");

    if (this.currentUser) {
      if (userNameEl) {
        userNameEl.textContent = this.currentUser.name || "Pengguna";
      }

      if (guestBadgeEl) {
        if (this.currentUser.isGuest) {
          guestBadgeEl.style.display = "inline";
        } else {
          guestBadgeEl.style.display = "none";
        }
      }

      // Calculate statistics
      const stats = this.calculateUserStats();
      
      // Update profile statistics if element exists
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="stat-item">
            <span class="stat-label">Total Transaksi</span>
            <span class="stat-value">${stats.totalTransactions}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Pemasukan</span>
            <span class="stat-value">${stats.incomeCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Pengeluaran</span>
            <span class="stat-value">${stats.expenseCount}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Pemasukan</span>
            <span class="stat-value income">${Utils.formatCurrency(stats.totalIncome)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Pengeluaran</span>
            <span class="stat-value expense">${Utils.formatCurrency(stats.totalExpense)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Saldo</span>
            <span class="stat-value ${stats.balance >= 0 ? 'income' : 'expense'}">${Utils.formatCurrency(stats.balance)}</span>
          </div>
        `;
      }
    }
  },

  updateBalance() {
    const userBalance = document.querySelector(".user-balance .balance-amount");
    if (userBalance) {
      const balance = this.calculateBalance();
      userBalance.textContent = Utils.formatCurrency(balance);
    }
  },

  updateDashboard: function() {
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.substring(0, 7);

    // Calculate total balance (all time)
    const totalIncome = this.transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = this.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = totalIncome - totalExpense;

    // Calculate this month's amounts
    const monthTransactions = this.transactions.filter((t) =>
      t.date.startsWith(thisMonth)
    );

    const monthIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const monthExpense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Update balance card with total balance
    const currentBalance = document.querySelector(".balance-amount-large");
    const monthIncomeEl = document.querySelector(
      ".balance-item.income .amount"
    );
    const monthExpenseEl = document.querySelector(
      ".balance-item.expense .amount"
    );

    if (currentBalance) {
      currentBalance.textContent = this.formatCurrency(totalBalance);
    }
    if (monthIncomeEl) {
      monthIncomeEl.textContent = this.formatCurrency(monthIncome);
    }
    if (monthExpenseEl) {
      monthExpenseEl.textContent = this.formatCurrency(monthExpense);
    }

    // Keep compact/header balance element in sync with total balance
    const smallBalance = document.querySelector(
      ".user-balance .balance-amount"
    );
    if (smallBalance) {
      smallBalance.textContent = this.formatCurrency(totalBalance);
    }

    // Update recent transactions
    this.updateRecentTransactions();
  }

  // F4: Dashboard category visualization (BRD requirement)
  updateCategoryChart() {
    const canvas = document.getElementById("dashboardCategoryChart");
    const container = document.getElementById("categoryBreakdown");

    if (!canvas || !container) return;

    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.substring(0, 7);

    // Get this month's expense transactions
    const monthExpenses = this.transactions.filter(
      (t) => t.type === "expense" && t.date.startsWith(thisMonth)
    );

    if (monthExpenses.length === 0) {
      // Show empty state
      container.innerHTML = `
        <div class="empty-state">
          📊
          <p>Belum ada pengeluaran bulan ini</p>
          <small>Mulai catat pengeluaran untuk melihat distribusi kategori</small>
        </div>
      `;
      return;
    }

    // Calculate category totals
    const categoryTotals = {};
    monthExpenses.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    // Sort categories by amount
    const sortedCategories = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a
    );

    // Update category breakdown list
    container.innerHTML = sortedCategories
      .map(([category, amount]) => {
        const percentage = (
          (amount / monthExpenses.reduce((sum, t) => sum + t.amount, 0)) *
          100
        ).toFixed(1);
        return `
          <div class="category-item">
            <span class="category-name">${category}</span>
            <div>
              <span class="category-amount">${this.formatCurrency(
                amount
              )}</span>
              <small> (${percentage}%)</small>
            </div>
          </div>
        `;
      })
      .join("");

    // Simple chart implementation (pie chart)
    this.renderSimplePieChart(canvas, sortedCategories);

    // Update category budgets if EnhancedFeatures is available
    if (typeof EnhancedFeatures !== "undefined") {
      EnhancedFeatures.CategoryBudgets.renderBudgetsList();
    }
  },

  // FR-002: Quick add button visibility
  showQuickAddButton(show) {
    const button = document.getElementById("quickAddFloat");
    if (button) {
      button.classList.toggle("show", show);
    }
  }

  calculateUserStats() {
    // Initialize stats object
    const stats = {
      totalTransactions: 0,
      incomeCount: 0,
      expenseCount: 0,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0
    };

    // Calculate stats from transactions
    if (this.transactions && this.transactions.length > 0) {
      this.transactions.forEach(transaction => {
        stats.totalTransactions++;
        
        if (transaction.type === 'income') {
          stats.incomeCount++;
          stats.totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
          stats.expenseCount++;
          stats.totalExpense += transaction.amount;
        }
      });
    }

    // Calculate balance
    stats.balance = stats.totalIncome - stats.totalExpense;

    return stats;
  }

  renderSimplePieChart(canvas, data) {
    const ctx = canvas.getContext("2d");
    const total = data.reduce((sum, [, amount]) => sum + amount, 0);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (total === 0) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Colors for categories
    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
    ];

    let currentAngle = -Math.PI / 2; // Start from top

    data.forEach(([category, amount], index) => {
      const sliceAngle = (amount / total) * 2 * Math.PI;

      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle
      );
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // Draw border
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      currentAngle += sliceAngle;
    });
  }

  updateRecentTransactions() {
    const container = document.querySelector(
      ".recent-transactions .transaction-list"
    );
    if (!container) return;

    const recent = this.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    container.innerHTML = recent
      .map((transaction) => this.createTransactionElement(transaction))
      .join("");
  }

  showWelcomeTips() {
    // Show tips only once per session and only if user is authenticated
    if (this.tipsShown || !this.currentUser) return;

    // Show tips for new users or guests only
    if (this.transactions.length === 0) {
      setTimeout(() => {
        if (this.currentUser && this.currentUser.isGuest) {
          this.showToast("💡 Mode tamu: Data tidak disimpan permanen", "info");
          setTimeout(() => {
            this.showToast(
              "✨ Mulai dengan menambah transaksi pertama!",
              "info"
            );
          }, 2500);
        } else if (this.currentUser) {
          this.showToast(
            "🎉 Selamat datang! Mulai catat keuangan Anda",
            "info"
          );
        }
        this.tipsShown = true;
      }, 1500);
    }
  }

  updateHistory() {
    // This method is now primarily responsible for applying filters
    // when the history tab is active.
    if (this.currentView !== "history") return;

    this.applyFilters();
  },

  applyFilters() {
    if (this.currentView !== "history") return;

    const container = document.querySelector("#history .transaction-list");
    if (!container) return;

    // Get filter values
    const monthFilter = document.getElementById("filterMonth")?.value || "";
    const typeFilter = document.getElementById("filterType")?.value || "";
    const categoryFilter =
      document.getElementById("filterCategory")?.value || "";

    // Filter transactions
    let filteredTransactions = [...this.transactions];

    if (monthFilter) {
      filteredTransactions = filteredTransactions.filter((t) =>
        t.date.startsWith(monthFilter)
      );
    }

    if (typeFilter) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.type === typeFilter
      );
    }

    if (categoryFilter) {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.category === categoryFilter
      );
    }

    // Update filtered summary
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Update summary display
    const incomeEl = document.getElementById("totalIncomeFiltered");
    const expenseEl = document.getElementById("totalExpenseFiltered");

    if (incomeEl) incomeEl.textContent = this.formatCurrency(totalIncome);
    if (expenseEl) expenseEl.textContent = this.formatCurrency(totalExpense);

    // Net amount (income - expense)
    const netEl = document.getElementById("netAmountFiltered");
    if (netEl) {
      netEl.textContent = this.formatCurrency(totalIncome - totalExpense);
    }

    // Update transaction list
    container.innerHTML = filteredTransactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((transaction) => this.createTransactionElement(transaction))
      .join("");

    // Initialize filter dropdowns if empty
    this.populateFilterDropdowns();

    // Show empty state if no transactions match
    const emptyState = container.querySelector(".empty-state");
    if (filteredTransactions.length === 0) {
      if (!emptyState) {
        container.innerHTML = `
          <div class="empty-state">
            📭
            <p>Tidak ada transaksi yang cocok dengan filter Anda.</p>
          </div>
        `;
      }
    } else if (emptyState) {
      emptyState.remove();
    }
  }

  clearFilters() {
    // Reset all filter dropdowns
    const filterElements = ["filterMonth", "filterType", "filterCategory"];
    filterElements.forEach((filterId) => {
      const element = document.getElementById(filterId);
      if (element) {
        element.value = "";
      }
    });

    // Reapply filters (which will now show all transactions)
    this.applyFilters();
    this.showToast("Filter berhasil direset", "success");
  }

  populateFilterDropdowns() {
    this.populateMonthFilter();
    this.populateCategoryFilter();
  },

  populateMonthFilter() {
    const select = document.getElementById("filterMonth");
    if (!select) return;

    const currentVal = select.value;

    // Get unique months from transactions
    const months = [
      ...new Set(this.transactions.map((t) => t.date.substring(0, 7))),
    ];
    months.sort().reverse();

    // Keep first option, rebuild the rest
    const firstOption = select.children[0];
    select.innerHTML = "";
    if (firstOption) {
      select.appendChild(firstOption);
    }

    months.forEach((month) => {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = new Date(month + "-02").toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
      });
      select.appendChild(option);
    });

    // Restore previous selection if it still exists
    if (months.includes(currentVal)) {
      select.value = currentVal;
    }
  }

  populateCategoryFilter() {
    const select = document.getElementById("filterCategory");
    if (!select) return;

    const currentVal = select.value;

    // Keep first option, rebuild the rest
    const firstOption = select.children[0];
    select.innerHTML = "";
    if (firstOption) {
      select.appendChild(firstOption);
    }

    const addOptions = (categories) => {
      if (!categories) return;
      Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${category.icon || ""} ${category.name}`;
        select.appendChild(option);
      });
    };

    addOptions(this.categories.expense);
    addOptions(this.categories.income);

    // Restore previous selection if it still exists
    if (select.querySelector(`option[value="${currentVal}"]`)) {
      select.value = currentVal;
    }
  }

  updateBudget() {
    // Always compute so dashboard budget card stays updated
    const thisMonth = new Date().toISOString().substring(0, 7);
    const budgetAmount = this.budget[thisMonth] || 0;
    const spent = this.transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

    // Update budget card on dashboard
    const budgetCard = document.querySelector(".budget-card");
    if (budgetCard) {
      const progressBar = budgetCard.querySelector("#budgetBar");
      const usedAmountEl = budgetCard.querySelector("#budgetUsed");
      const totalAmountEl = budgetCard.querySelector("#budgetTotal");

      if (progressBar) {
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
        progressBar.style.background =
          percentage > 90 ? "#f44336" : percentage > 70 ? "#ff9800" : "#4caf50";
      }
      if (usedAmountEl) usedAmountEl.textContent = this.formatCurrency(spent);
      if (totalAmountEl)
        totalAmountEl.textContent = this.formatCurrency(budgetAmount);
    }

    // Update circle progress (if it exists on another view)
    this.updateBudgetCircle(percentage);
  }

  updateBudgetCircle(percentage) {
    const circleProgress = document.querySelector(".circle-progress");
    if (!circleProgress) return;

    const percentSpan = circleProgress.querySelector("span");
    if (percentSpan) {
      percentSpan.textContent = `${Math.round(percentage)}%`;
    }

    const color =
      percentage > 90 ? "#f44336" : percentage > 70 ? "#ff9800" : "#4caf50";
    circleProgress.style.background = `conic-gradient(${color} ${
      percentage * 3.6
    }deg, #f5f5f5 0deg)`;
  }

  updateBudgetStatus() {
    const thisMonth = new Date().toISOString().substring(0, 7);
    const budgetAmount = this.budget[thisMonth] || 0;
    const spent = this.transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    if (budgetAmount > 0 && spent > budgetAmount * 0.8) {
      const percentage = (spent / budgetAmount) * 100;
      if (percentage >= 100) {
        this.showToast("⚠️ Budget bulanan sudah terlampaui!", "danger");
      } else if (percentage >= 80) {
        this.showToast("⚠️ Budget bulanan sudah 80% terpakai!", "warning");
      }
    }
  }

  updateAnalytics() {
    if (this.currentView !== "analytics") return;

    // Update chart
    this.updateChart();

    // Calculate stats
    const thisMonth = new Date().toISOString().substring(0, 7);
    const monthTransactions = this.transactions.filter((t) =>
      t.date.startsWith(thisMonth)
    );
    const expenses = monthTransactions.filter((t) => t.type === "expense");

    // Daily average
    const daysInMonth = new Date().getDate();
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const dailyAverage = totalExpense / daysInMonth;

    const dailyAverageEl = document.querySelector(".stat-card .daily-average");
    if (dailyAverageEl) {
      dailyAverageEl.textContent = this.formatCurrency(dailyAverage);
    }

    // Top category
    const categoryTotals = {};
    expenses.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a
    )[0];

    const topCategoryEl = document.querySelector(".stat-card .top-category");
    if (topCategoryEl && topCategory) {
      const categoryName =
        this.categories.expense[topCategory[0]]?.name || topCategory[0];
      topCategoryEl.textContent = categoryName;
    }

    // Total transactions
    const totalTransactionsEl = document.querySelector(
      ".stat-card .total-transactions"
    );
    if (totalTransactionsEl) {
      totalTransactionsEl.textContent = monthTransactions.length;
    }
  }

  updateChart() {
    const canvas = document.getElementById("expenseChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Get data for chart
    const thisMonth = new Date().toISOString().substring(0, 7);
    const expenses = this.transactions.filter(
      (t) => t.type === "expense" && t.date.startsWith(thisMonth)
    );

    const categoryTotals = {};
    expenses.forEach((t) => {
      const categoryName =
        this.categories.expense[t.category]?.name || t.category;
      categoryTotals[categoryName] =
        (categoryTotals[categoryName] || 0) + t.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = [
      "#FF6384",
      "#36A2EB",
      "#FFCE56",
      "#4BC0C0",
      "#9966FF",
      "#FF9F40",
      "#FF6384",
      "#C9CBCF",
    ];

    this.chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = this.formatCurrency(context.parsed);
                return `${label}: ${value}`;
              },
            },
          },
        },
      },
    });
  },

  createTransactionElement(transaction) {
    const category = this.categories[transaction.type]?.[transaction.category];
    const categoryName = category?.name || transaction.category;
    const icon = category?.icon || "💰";

    return `
            <div class="transaction-item ${transaction.type}" data-id="${
      transaction.id
    }">
                <div class="transaction-info">
                    <div class="transaction-category">${icon} ${categoryName}</div>
                    <div class="transaction-description">${
                      transaction.description
                    }</div>
                    <div class="transaction-date">${this.formatDate(
                      transaction.date
                    )}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${
                      transaction.type === "income" ? "+" : "-"
                    }${this.formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
  }

  showTransactionDetails(id) {
    const transaction = this.transactions.find((t) => t.id === id);
    if (!transaction) return;

    // Show transaction details in a simple alert for now
    const typeText =
      transaction.type === "income" ? "Pemasukan" : "Pengeluaran";
    const categoryName =
      this.categories[transaction.type]?.[transaction.category]?.name ||
      transaction.category;

    alert(
      `${typeText}: ${this.formatCurrency(
        transaction.amount
      )}\nKategori: ${categoryName}\nTanggal: ${transaction.date}\nDeskripsi: ${
        transaction.description || "Tidak ada"
      }`
    );
  }

  showProfile() {
    if (!this.currentUser) return;

    // Update profile info
    const profileModal = document.getElementById("profileModal");
    const userName = profileModal?.querySelector(".profile-info h4");
    const userEmail = profileModal?.querySelector(".profile-info p");
    const totalTransactions = profileModal?.querySelector(".stat .number");

    if (userName) userName.textContent = this.currentUser.name;
    if (userEmail) userEmail.textContent = this.currentUser.email;
    if (totalTransactions)
      totalTransactions.textContent = this.transactions.length;

    // Show modal
    if (profileModal) {
      profileModal.style.display = "block";
    }
  }

  logout() {
    // Tutup modal profile jika terbuka
    window.closeModal("profileModal");

    // Peringatan khusus untuk tamu
    if (
      this.currentUser &&
      this.currentUser.isGuest &&
      this.transactions.length > 0
    ) {
      if (
        !confirm(
          "Data Anda akan hilang karena Anda login sebagai tamu. Yakin ingin keluar?\n\nTip: Daftar akun untuk menyimpan data permanen."
        )
      ) {
        return;
      }
    }

    // Clear user data
    Auth.logout();
    this.currentUser = null;
    this.transactions = [];
    this.categories = {};
    this.budget = {};

    // Pastikan semua modal tertutup
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.classList.remove("show");
      modal.style.display = "none";
    });
    document.body.classList.remove("modal-open");

    // Kembali ke halaman login
    this.checkAuthState();

    // Show success message
    this.showToast("👋 Berhasil keluar dari akun", "success");
  }

  // Fungsi untuk upgrade dari tamu ke akun permanen
  upgradeFromGuest() {
    if (this.currentUser && this.currentUser.isGuest) {
      // Simpan data sementara
      const tempData = {
        transactions: this.transactions,
        categories: this.categories,
        budget: this.budget,
      };

      // Redirect ke form registrasi dengan data
      window.tempGuestData = tempData;
      this.showToast("Daftar akun untuk menyimpan data Anda", "info");
      // Show register form
      Auth.showAuthScreen();
      setTimeout(() => {
        document.getElementById("loginForm").classList.remove("active");
        document.getElementById("registerForm").classList.add("active");
      }, 100);
    }
  }

  calculateBalance() {
    const thisMonth = new Date().toISOString().substring(0, 7);
    const monthTransactions = this.transactions.filter((t) =>
      t.date.startsWith(thisMonth)
    );

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return income - expense;
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  formatDate: function(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  },

  setDefaultDate() {
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    const budgetMonthInput = document.getElementById("budget-month");

    if (dateInput) {
      dateInput.value = new Date().toISOString().split("T")[0];
    }

    if (timeInput) {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      timeInput.value = `${hours}:${minutes}`;
    }

    if (budgetMonthInput) {
      budgetMonthInput.value = new Date().toISOString().substring(0, 7);
    }
  },

  showLoading(message = "Memuat...") {
    let loading = document.querySelector(".loading-overlay");
    if (!loading) {
      loading = document.createElement("div");
      loading.className = "loading-overlay";
      loading.innerHTML = `
        <div class="loading-content">
          <div class="spinner"></div>
          <p class="loading-text">${message}</p>
        </div>
      `;
      document.body.appendChild(loading);
    }
    loading.classList.add("show");
  }

  hideLoading() {
    const loading = document.querySelector(".loading-overlay");
    if (loading) {
      loading.classList.remove("show");
    }
  }

  showToast(message, type = "info") {
    // Create toast container if not exists
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      document.body.appendChild(toastContainer);
    }

    // Create new toast element
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add to container
    toastContainer.appendChild(toast);

    // Show toast
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }
};

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = ExpenseTracker;
  window.app.init();

  // Service Worker Registration
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    });
  }
});

// Handle authentication events
document.addEventListener("user-authenticated", () => {
  if (window.app) {
    window.app.checkAuthState();
  }
});

// Add toast styles if not present
if (!document.querySelector("style[data-toast]")) {
  const toastStyles = document.createElement("style");
  toastStyles.setAttribute("data-toast", "true");
  toastStyles.textContent = `
    #toast-container {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .toast {
      padding: 1rem 1.5rem;
      border-radius: 0.5rem;
      color: white;
      font-weight: 500;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      z-index: 10000;
      animation: fadeInOut 4s ease-in-out forwards;
    }
    
    .toast-success { background-color: #22c55e; }
    .toast-error { background-color: #ef4444; }
    .toast-warning { background-color: #f59e0b; }
    .toast-info { background-color: #3b82f6; }
    
    .toast.fade-out {
      animation: fadeOut 0.3s ease-out forwards;
    }
    
    @keyframes fadeInOut {
      0%, 100% {
        opacity: 0;
        transform: translateY(20px);
      }
      10%, 90% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(20px);
      }
    }
  `;
  document.head.appendChild(toastStyles);
}