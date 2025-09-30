"use strict";

// Utility functions
const Utils = {
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

class ExpenseTracker {
  constructor() {
    this.transactions = [];
    this.categories = {};
    this.budget = {};
    this.currentUser = null;
    this.currentView = "dashboard";
    this.chart = null;
    this.tipsShown = false;

    this.init();
  }

  init() {
    this.bindEvents();
    this.updateBudgetStatus();
    this.setDefaultDate();

    // Initial check for current user
    this.checkAuthState();
  }

  bindEvents() {
    // Navigation events
    document.addEventListener("click", (e) => {
      if (e.target.matches("[data-tab]")) {
        this.showSection(e.target.dataset.tab);
      }

      if (e.target.matches(".quick-action-btn")) {
        const type = e.target.dataset.type;
        this.showSection("add-transaction");
        this.setTransactionType(type);
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
    const filterElements = ['filterMonth', 'filterType', 'filterCategory'];
    filterElements.forEach(filterId => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener('change', () => {
          this.applyFilters();
        });
      }
    });
  }

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
  }

  loadUserData() {
    if (!this.currentUser) return;

    const userId = this.currentUser.id;
    this.transactions =
      JSON.parse(localStorage.getItem(`transactions_${userId}`)) || [];
    this.categories =
      JSON.parse(localStorage.getItem(`categories_${userId}`)) ||
      Auth.getDefaultCategories();
    this.budget = JSON.parse(localStorage.getItem(`budget_${userId}`)) || {};
  }

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
  }

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
        // Set default transaction type to expense if not set
        const activeTab = document.querySelector(".type-tab.active");
        if (!activeTab) {
          this.setTransactionType("expense");
        }
        this.showQuickAddButton(false);
        // FR-002: Focus on amount input for quick entry
        setTimeout(() => {
          const amountInput = document.getElementById("amount");
          if (amountInput) amountInput.focus();
        }, 100);
        break;
      case "analytics":
        this.showQuickAddButton(false);
        // Analytics will be handled by EnhancedFeatures module via tab-changed event
        break;
    }
  }

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
      categories = type === "income" ? 
        user.settings.categories.income : 
        user.settings.categories.expense;
    } else {
      // Fallback to default categories
      categories = type === "income" ? this.getDefaultIncomeCategories() : this.getDefaultExpenseCategories();
    }

    // Update main category select
    if (categorySelect) {
      categorySelect.innerHTML = "";
      Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${category.icon || ''} ${category.name}`;
        categorySelect.appendChild(option);
      });
    }

    // Update quick add category select
    if (quickCategorySelect) {
      quickCategorySelect.innerHTML = "";
      Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  }

  updateAllCategoryDropdowns() {
    // Update main transaction form category dropdown (default to expense)
    this.updateCategoryOptions("expense");

    // Update filter category dropdown
    this.updateFilterCategories();

    // Update other category dropdowns if they exist
    this.updateEditCategoryOptions();
    this.updateQuickAddCategoryOptions();
  }

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
  }

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
  }

  updateQuickAddCategoryOptions() {
    const quickSelect = document.getElementById("quickAddCategory");
    if (!quickSelect) return;

    quickSelect.innerHTML = "";

    if (this.categories.expense) {
      Object.entries(this.categories.expense).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = category.name;
        quickSelect.appendChild(option);
      });
    }
  }

  addTransaction() {
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
      timestamp: Date.now(),
    };

    this.transactions.push(transaction);
    this.saveUserData();

    // Reset form
    form.reset();

    // Show success message
    const typeText =
      transaction.type === "income" ? "pemasukan" : "pengeluaran";
    this.showToast(`${typeText} berhasil ditambahkan!`, "success");

    // Update UI
    this.updateUI();

    // Go back to dashboard
    this.showSection("dashboard");
  }

  handleQuickAdd() {
    const form = document.getElementById("quickAddForm");
    const formData = new FormData(form);

    // Validasi input
    const amount = parseFloat(formData.get("amount"));
    const category = formData.get("category");
    const type = formData.get("type");

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
      type: type || "expense",
      amount: amount,
      category: category,
      description: formData.get("description") || "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      timestamp: Date.now(),
    };

    this.transactions.push(transaction);
    this.saveUserData();

    // Reset form and close modal
    form.reset();
    closeModal("quickAddModal");

    // Show success message
    const typeText = transaction.type === "income" ? "pemasukan" : "pengeluaran";
    this.showToast(`${typeText} berhasil ditambahkan!`, "success");

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
  }

  setBudget() {
    const form = document.getElementById("budgetForm");
    const formData = new FormData(form);

    // F6: Simple monthly budget (BRD requirement)
    const amount = parseFloat(formData.get("budget"));
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format

    if (amount > 0) {
      this.budget[currentMonth] = amount;
      this.saveUserData();

      this.showToast("Anggaran berhasil diatur!", "success");
      closeModal("budgetModal");
      this.updateBudget();
    } else {
      this.showToast("Masukkan jumlah anggaran yang valid", "error");
    }
  }

  updateUI() {
    this.updateDashboard();
    this.updateHistory();
    this.updateBudget();
    this.updateAnalytics();
    this.updateBalance();
    this.updateUserInfo();

    // Initialize all category dropdowns
    this.updateAllCategoryDropdowns();
  }

  updateUserInfo() {
    const userNameEl = document.getElementById("userName");
    const guestBadgeEl = document.getElementById("guestBadge");

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
    }
  }

  updateBalance() {
    const userBalance = document.querySelector(".user-balance .balance-amount");
    if (userBalance) {
      const balance = this.calculateBalance();
      userBalance.textContent = this.formatCurrency(balance);
    }
  }

  updateDashboard() {
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.substring(0, 7);

    // Calculate amounts
    const todayTransactions = this.transactions.filter((t) => t.date === today);
    const monthTransactions = this.transactions.filter((t) =>
      t.date.startsWith(thisMonth)
    );

    const todayIncome = todayTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const todayExpense = todayTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const monthIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const monthExpense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Update balance card
    const currentBalance = document.querySelector(".balance-amount-large");
    const monthIncomeEl = document.querySelector(
      ".balance-item.income .amount"
    );
    const monthExpenseEl = document.querySelector(
      ".balance-item.expense .amount"
    );

    if (currentBalance)
      currentBalance.textContent = this.formatCurrency(
        monthIncome - monthExpense
      );
    if (monthIncomeEl)
      monthIncomeEl.textContent = this.formatCurrency(monthIncome);
    if (monthExpenseEl)
      monthExpenseEl.textContent = this.formatCurrency(monthExpense);

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
  }

  // FR-002: Quick add button visibility
  showQuickAddButton(show) {
    const button = document.getElementById("quickAddFloat");
    if (button) {
      button.classList.toggle("show", show);
    }
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
    if (this.currentView !== "history") return;

    const container = document.querySelector("#history .transaction-list");
    if (!container) return;

    const thisMonth = new Date().toISOString().substring(0, 7);
    const monthTransactions = this.transactions.filter((t) =>
      t.date.startsWith(thisMonth)
    );

    // Update summary
    const totalIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const summaryItems = document.querySelectorAll(".summary-item");
    if (summaryItems[0])
      summaryItems[0].querySelector(".amount").textContent =
        this.formatCurrency(totalIncome);
    if (summaryItems[1])
      summaryItems[1].querySelector(".amount").textContent =
        this.formatCurrency(totalExpense);
    if (summaryItems[2])
      summaryItems[2].querySelector(".amount").textContent =
        this.formatCurrency(balance);

    // Apply current filters
    this.applyFilters();
  }

  applyFilters() {
    if (this.currentView !== "history") return;

    const container = document.querySelector("#history .transaction-list");
    if (!container) return;

    // Get filter values
    const monthFilter = document.getElementById("filterMonth")?.value || "";
    const typeFilter = document.getElementById("filterType")?.value || "";
    const categoryFilter = document.getElementById("filterCategory")?.value || "";

    // Filter transactions
    let filteredTransactions = [...this.transactions];

    if (monthFilter) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.date.startsWith(monthFilter)
      );
    }

    if (typeFilter) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.type === typeFilter
      );
    }

    if (categoryFilter) {
      filteredTransactions = filteredTransactions.filter(t => 
        t.category === categoryFilter
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

    // Update transaction list
    container.innerHTML = filteredTransactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((transaction) => this.createTransactionElement(transaction))
      .join("");

    // Initialize filter dropdowns if empty
    this.populateFilterDropdowns();
  }

  clearFilters() {
    // Reset all filter dropdowns
    const filterElements = ['filterMonth', 'filterType', 'filterCategory'];
    filterElements.forEach(filterId => {
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
  }

  populateMonthFilter() {
    const select = document.getElementById("filterMonth");
    if (!select) return;

    // Get unique months from transactions
    const months = [...new Set(this.transactions.map(t => t.date.substring(0, 7)))];
    months.sort().reverse();

    // Keep first option, rebuild the rest
    const firstOption = select.children[0];
    select.innerHTML = '';
    select.appendChild(firstOption);

    months.forEach(month => {
      const option = document.createElement('option');
      option.value = month;
      option.textContent = new Date(month + '-01').toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long'
      });
      select.appendChild(option);
    });
  }

  populateCategoryFilter() {
    const select = document.getElementById("filterCategory");
    if (!select) return;

    const user = Auth.getCurrentUser();
    if (!user || !user.settings || !user.settings.categories) return;

    // Keep first option
    const firstOption = select.children[0];
    select.innerHTML = '';
    select.appendChild(firstOption);

    // Add expense categories
    const expenseCategories = user.settings.categories.expense || {};
    Object.keys(expenseCategories).forEach(key => {
      const category = expenseCategories[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${category.icon} ${category.name}`;
      select.appendChild(option);
    });

    // Add income categories
    const incomeCategories = user.settings.categories.income || {};
    Object.keys(incomeCategories).forEach(key => {
      const category = incomeCategories[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${category.icon} ${category.name}`;
      select.appendChild(option);
    });
  }

  updateBudget() {
    if (this.currentView !== "budget") return;

    const thisMonth = new Date().toISOString().substring(0, 7);
    const budgetAmount = this.budget[thisMonth] || 0;
    const spent = this.transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

    // Update budget card
    const budgetCard = document.querySelector(".budget-card .budget-progress");
    if (budgetCard) {
      const progressBar = budgetCard.querySelector(".budget-used");
      const usedAmount = budgetCard.querySelector(".budget-info .used");
      const totalAmount = budgetCard.querySelector(".budget-info .total");

      if (progressBar) {
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
        progressBar.style.background =
          percentage > 90 ? "#f44336" : percentage > 70 ? "#ff9800" : "#4caf50";
      }
      if (usedAmount) usedAmount.textContent = this.formatCurrency(spent);
      if (totalAmount)
        totalAmount.textContent = this.formatCurrency(budgetAmount);
    }

    // Update circle progress
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
  }

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
    closeModal("profileModal");

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
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }

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
  }

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
}

// Global function for backward compatibility
window.switchTab = function (sectionId) {
  if (window.app) {
    window.app.showSection(sectionId);
  }
};

// Global function for quick add
window.showQuickAdd = function (type) {
  if (window.app) {
    window.app.showSection("add-transaction");
    window.app.setTransactionType(type);
  }
};

// Global modal functions
window.openModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
    document.body.classList.add("modal-open");
  }
};

window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
  }
};

// Global premium feature function
window.showPremiumFeature = function () {
  if (window.app) {
    window.app.showToast("🚀 Fitur premium akan segera tersedia!", "info");
  }
};

// Global export data function
window.exportData = function () {
  if (window.app && window.app.currentUser) {
    if (window.app.currentUser.isGuest) {
      window.app.showToast(
        "⚠️ Login dengan akun untuk mengekspor data",
        "warning"
      );
      return;
    }

    const data = {
      user: window.app.currentUser.name,
      exportDate: new Date().toISOString(),
      transactions: window.app.transactions,
      categories: window.app.categories,
      budget: window.app.budget,
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `pengeluaranqu-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();

    URL.revokeObjectURL(url);
    window.app.showToast("📁 Data berhasil diekspor!", "success");
  }
};

// Global logout function
window.logout = function () {
  if (window.app) {
    window.app.logout();
  }
};

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.app = new ExpenseTracker();
});

// Handle authentication events
document.addEventListener("user-authenticated", () => {
  if (window.app) {
    window.app.checkAuthState();
  }
});

// Handle modal events
document.addEventListener("click", (e) => {
  if (e.target.matches(".modal")) {
    const modalId = e.target.id;
    if (modalId) {
      closeModal(modalId);
    }
  }

  if (e.target.matches(".close-modal, .btn-cancel")) {
    const modal = e.target.closest(".modal");
    if (modal && modal.id) {
      closeModal(modal.id);
    }
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
        
        .toast-success {
            background-color: #22c55e;
        }
        
        .toast-error {
            background-color: #ef4444;
        }
        
        .toast-warning {
            background-color: #f59e0b;
        }
        
        .toast-info {
            background-color: #3b82f6;
        }
        
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

        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }

        .loading-overlay.show {
            display: flex;
        }

        .loading-content {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #2196F3;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .loading-text {
            color: #666;
            margin: 0;
        }
    `;
  document.head.appendChild(toastStyles);
}
