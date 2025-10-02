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
  stats: {}, // Untuk menyimpan statistik yang terkalkulasi
  currentUser: null,
  currentView: "dashboard",
  chart: null,
  tipsShown: false,

  init() {
    this.bindEvents();
    this.setDefaultDate();
    this.checkAuthState();
  },

  bindEvents() {
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

    document.querySelectorAll(".type-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        this.setTransactionType(tab.dataset.type);
      });
    });

    const profileBtn = document.querySelector(".btn-profile");
    if (profileBtn) {
      profileBtn.addEventListener("click", () => {
        this.showProfile();
      });
    }

    const quickAddForm = document.getElementById("quickAddForm");
    if (quickAddForm) {
      quickAddForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleQuickAdd();
      });
    }

    const clearFiltersBtn = document.getElementById("clearFilters");
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        this.clearFilters();
      });
    }

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

      setTimeout(() => {
        this.showWelcomeTips();
      }, 500);
    } else {
      document.querySelector(".auth-screen").classList.add("active");
      document.querySelector(".main-app").classList.remove("active");
      this.tipsShown = false;
    }
  },

  loadUserData() {
    if (!this.currentUser) return;

    const userId = this.currentUser.id;
    this.transactions =
      JSON.parse(localStorage.getItem(`transactions_${userId}`)) || [];

    if (this.currentUser.settings && this.currentUser.settings.categories) {
      this.categories = this.currentUser.settings.categories;
    } else if (typeof Auth !== "undefined" && Auth.getDefaultCategories) {
      this.categories = Auth.getDefaultCategories();
    } else {
      this.categories = {
        expense: this.getDefaultExpenseCategories(),
        income: this.getDefaultIncomeCategories(),
      };
    }

    this.budget = JSON.parse(localStorage.getItem(`budget_${userId}`)) || {};
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
    document.querySelectorAll(".tab-content").forEach((section) => {
      section.classList.remove("active");
    });

    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add("active");
    }

    const navTab = document.querySelector(`[data-tab="${sectionId}"]`);
    if (navTab) {
      navTab.classList.add("active");
    }

    this.currentView = sectionId;

    document.dispatchEvent(
      new CustomEvent("tab-changed", {
        detail: { tab: sectionId, previousTab: this.currentView },
      })
    );

    switch (sectionId) {
      case "dashboard":
        this.updateDashboard();
        this.updateBudget();
        this.updateCategoryChart();
        this.showQuickAddButton(true);
        break;
      case "history":
        this.updateHistory();
        this.showQuickAddButton(false);
        break;
      case "add-transaction":
        this.showQuickAddButton(false);
        setTimeout(() => {
          const amountInput = document.getElementById("amount");
          if (amountInput) amountInput.focus();
          this.setDefaultDate();
        }, 100);
        break;
      case "analytics":
        this.showQuickAddButton(false);
        break;
    }
  },

  setTransactionType(type) {
    document.querySelectorAll(".type-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.type === type);
    });

    this.updateCategoryOptions(type);

    const form = document.getElementById("transactionForm");
    if (form) {
      form.dataset.type = type;
    }
  },

  updateCategoryOptions(type) {
    const categorySelect = document.getElementById("category");
    const quickCategorySelect = document.getElementById("quickAddCategory");

    if (!categorySelect && !quickCategorySelect) return;

    const user = Auth.getCurrentUser();
    let categories = {};

    if (user && user.settings && user.settings.categories) {
      categories =
        type === "income"
          ? user.settings.categories.income
          : user.settings.categories.expense;
    } else {
      categories =
        type === "income"
          ? this.getDefaultIncomeCategories()
          : this.getDefaultExpenseCategories();
    }

    if (categorySelect) {
      categorySelect.innerHTML = "";
      Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${category.icon || ""} ${category.name}`;
        categorySelect.appendChild(option);
      });
    }

    if (quickCategorySelect) {
      quickCategorySelect.innerHTML = "";
      Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${category.icon || ""} ${category.name}`;
        quickCategorySelect.appendChild(option);
      });
    }
  },

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
    const form = document.getElementById("transactionForm");
    const currentType = form?.dataset.type || "expense";
    this.updateCategoryOptions(currentType);
    this.populateCategoryFilter();
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

  addTransaction() {
    const form = document.getElementById("transactionForm");
    const formData = new FormData(form);

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
    form.reset();

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

    this.updateUI();
    this.showSection("dashboard");
  },

  handleQuickAdd() {
    const form = document.getElementById("quickAddForm");
    const formData = new FormData(form);

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

    form.reset();
    window.closeModal("quickAddModal");

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

    this.updateUI();
  },

  deleteTransaction(id) {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      this.transactions = this.transactions.filter((t) => t.id !== id);
      this.saveUserData();
      this.updateUI();
      this.showToast("Transaksi berhasil dihapus!", "success");
    }
  },

  showBudgetModal() {
    this.showBudgetForm();
  },
  
  showBudgetForm() {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthInput = document.getElementById("budget-month");
    const budgetInput = document.getElementById("monthlyBudget");

    if (monthInput) {
      monthInput.value = monthInput.value || currentMonth;
    }

    const currentBudget = this.budget[monthInput.value] || 0;

    if (budgetInput) {
      budgetInput.value = currentBudget;
    }

    monthInput.addEventListener("change", () => {
      const selectedMonth = monthInput.value;
      const monthBudget = this.budget[selectedMonth] || 0;
      budgetInput.value = monthBudget;
    });

    window.openModal("budgetModal");
  },

  setBudget() {
    const form = document.getElementById("budgetForm");
    const formData = new FormData(form);
    const amount = parseFloat(formData.get("budget"));
    const monthInput = document.getElementById("budget-month");
    const currentMonth =
      monthInput?.value || new Date().toISOString().substring(0, 7);

    if (amount >= 0) {
      this.budget[currentMonth] = amount;
      this.saveUserData();
      this.showToast("Anggaran berhasil diatur!", "success");
      window.closeModal("budgetModal");
      this.updateUI();
    } else {
      this.showToast("Masukkan jumlah anggaran yang valid", "error");
    }
  },

  updateUI() {
    // Pertama, update statistik global
    this.updateGlobalStats();
    
    // Kemudian perbarui semua tampilan menggunakan data yang sama
    if (document.querySelector(".dashboard-section")) this.updateDashboard();
    if (document.querySelector(".budget-section")) this.updateBudget();
    if (document.querySelector(".budget-status")) this.updateBudgetStatus();
    if (document.querySelector(".history-section")) this.updateHistory();
    if (document.querySelector(".analytics-section")) this.updateAnalytics();
    this.updateUserInfo();
    this.updateAllCategoryDropdowns();
  },
  
  updateGlobalStats() {
    // Hitung statistik sekali saja untuk digunakan di semua tampilan
    const thisMonth = new Date().toISOString().substring(0, 7);
    
    // Transaksi bulan ini
    const monthTransactions = this.transactions.filter((t) =>
      t.date.startsWith(thisMonth)
    );
    
    // Statistik bulan ini
    const monthlyIncome = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const monthlyExpense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyBalance = monthlyIncome - monthlyExpense;
    const monthlyBudget = this.budget[thisMonth] || 0;
    
    // Statistik keseluruhan
    const totalIncome = this.transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpense = this.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalBalance = totalIncome - totalExpense;
    
    // Simpan statistik dalam objek stats
    this.stats = {
      // Total statistik
      totalTransactions: this.transactions.length,
      incomeCount: this.transactions.filter((t) => t.type === "income").length,
      expenseCount: this.transactions.filter((t) => t.type === "expense").length,
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      totalBalance: totalBalance,
      
      // Bulan ini
      monthlyIncome: monthlyIncome,
      monthlyExpense: monthlyExpense,
      monthlyBalance: monthlyBalance,
      monthlyBudget: monthlyBudget,
      budgetRemaining: monthlyBudget - monthlyExpense,
      budgetPercentage: monthlyBudget > 0 ? 
        Math.min(100, Math.round((monthlyExpense / monthlyBudget) * 100)) : 0,
      
      // Period
      currentMonth: thisMonth,
      currentMonthName: new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    };
    
    return this.stats;
  },

  updateAnalytics() {
    const analyticsContent = document.getElementById("analyticsContent");
    if (!analyticsContent) return;

    const thisMonth = new Date().toISOString().substring(0, 7);
    const transactions = this.transactions.filter((t) =>
      t.date.startsWith(thisMonth)
    );

    const stats = {
      income: transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
      expense: transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
      categories: {},
    };

    transactions.forEach((t) => {
      if (!stats.categories[t.category]) {
        stats.categories[t.category] = {
          amount: 0,
          count: 0,
          type: t.type,
        };
      }
      stats.categories[t.category].amount += t.amount;
      stats.categories[t.category].count++;
    });

    analyticsContent.innerHTML = `
      <div class="analytics-summary">
        <div class="stat-card">
          <h3>Total Pemasukan</h3>
          <p class="income">${Utils.formatCurrency(stats.income)}</p>
        </div>
        <div class="stat-card">
          <h3>Total Pengeluaran</h3>
          <p class="expense">${Utils.formatCurrency(stats.expense)}</p>
        </div>
        <div class="stat-card">
          <h3>Selisih</h3>
          <p class="${
            stats.income - stats.expense >= 0 ? "income" : "expense"
          }">
            ${Utils.formatCurrency(stats.income - stats.expense)}
          </p>
        </div>
      </div>
      
      <div class="category-breakdown">
        <h3>Breakdown per Kategori</h3>
        ${Object.entries(stats.categories)
          .sort((a, b) => b[1].amount - a[1].amount)
          .map(
            ([category, data]) => `
            <div class="category-item ${data.type}">
              <div class="category-info">
                <span class="category-name">
                  ${this.categories[data.type]?.[category]?.icon || "📝"}
                  ${this.categories[data.type]?.[category]?.name || category}
                </span>
                <span class="category-count">${data.count}x</span>
              </div>
              <div class="category-amount">
                ${Utils.formatCurrency(data.amount)}
              </div>
            </div>
          `
          )
          .join("")}
      </div>

      ${this.renderAnalyticsCharts()}
    `;
  },

  renderAnalyticsCharts() {
    // Only render charts if Chart.js is available
    if (typeof Chart === "undefined") return "";

    const thisMonth = new Date().toISOString().substring(0, 7);
    const transactions = this.transactions.filter((t) =>
      t.date.startsWith(thisMonth)
    );

    // Prepare data for expense by category chart
    const expenseByCategory = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        expenseByCategory[t.category] =
          (expenseByCategory[t.category] || 0) + t.amount;
      });

    // Prepare data for daily expense trend
    const dailyExpense = {};
    transactions.forEach((t) => {
      if (!dailyExpense[t.date]) {
        dailyExpense[t.date] = { income: 0, expense: 0 };
      }
      dailyExpense[t.date][t.type] += t.amount;
    });

    return `
      <div class="analytics-charts">
        <div class="chart-container">
          <h3>Pengeluaran per Kategori</h3>
          <canvas id="categoryChart"></canvas>
        </div>
        <div class="chart-container">
          <h3>Tren Harian</h3>
          <canvas id="trendChart"></canvas>
        </div>
      </div>
    `;

    // Charts will be initialized after the HTML is inserted
    setTimeout(() => {
      this.initializeAnalyticsCharts(expenseByCategory, dailyExpense);
    }, 0);
  },

  initializeAnalyticsCharts(expenseByCategory, dailyExpense) {
    const categoryCtx = document.getElementById("categoryChart");
    const trendCtx = document.getElementById("trendChart");

    if (categoryCtx) {
      new Chart(categoryCtx, {
        type: "pie",
        data: {
          labels: Object.keys(expenseByCategory).map(
            (cat) => this.categories.expense?.[cat]?.name || cat
          ),
          datasets: [
            {
              data: Object.values(expenseByCategory),
              backgroundColor: Object.keys(expenseByCategory).map(
                (cat) => this.categories.expense?.[cat]?.color || "#666"
              ),
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
            },
          },
        },
      });
    }

    if (trendCtx) {
      const dates = Object.keys(dailyExpense).sort();
      new Chart(trendCtx, {
        type: "line",
        data: {
          labels: dates.map((date) => Utils.formatDate(date)),
          datasets: [
            {
              label: "Pemasukan",
              data: dates.map((date) => dailyExpense[date].income),
              borderColor: "#4CAF50",
              tension: 0.4,
            },
            {
              label: "Pengeluaran",
              data: dates.map((date) => dailyExpense[date].expense),
              borderColor: "#F44336",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }
  },

  updateDashboard() {
    this.updateBalance();
    this.updateRecentTransactions();
    this.updateDashboardStats();
    this.updateBudgetStatus();
    if (document.getElementById("spendingChart")) {
      this.updateSpendingChart();
    }
  },

  updateRecentTransactions() {
    const container = document.getElementById("recentTransactions");
    if (!container) return;

    const recent = [...this.transactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    container.innerHTML = recent.length
      ? recent
          .map(
            (t) => `
      <div class="transaction-item ${t.type}" data-id="${t.id}">
        <div class="transaction-icon">${
          this.categories[t.type]?.[t.category]?.icon || "📝"
        }</div>
        <div class="transaction-info">
          <div class="transaction-title">${
            this.categories[t.type]?.[t.category]?.name || "Lainnya"
          }</div>
          <div class="transaction-date">${Utils.formatDate(t.date)} ${
              t.time
            }</div>
          ${
            t.description
              ? `<div class="transaction-desc">${t.description}</div>`
              : ""
          }
        </div>
        <div class="transaction-amount ${t.type}">${Utils.formatCurrency(
              t.amount
            )}</div>
      </div>
    `
          )
          .join("")
      : '<p class="text-muted">Belum ada transaksi</p>';
  },

  updateDashboardStats() {
    // Gunakan data dari stats global
    const stats = this.stats;
    
    const statsContainer = document.getElementById("dashboardStats");
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card income">
          <div class="stat-title">Pemasukan</div>
          <div class="stat-value">${Utils.formatCurrency(stats.monthlyIncome)}</div>
        </div>
        <div class="stat-card expense">
          <div class="stat-title">Pengeluaran</div>
          <div class="stat-value">${Utils.formatCurrency(stats.monthlyExpense)}</div>
        </div>
        <div class="stat-card balance">
          <div class="stat-title">Saldo</div>
          <div class="stat-value ${
            stats.monthlyBalance >= 0 ? "positive" : "negative"
          }">${Utils.formatCurrency(stats.monthlyBalance)}</div>
        </div>
      `;
    }
  },

  updateSpendingChart() {
    const chartCanvas = document.getElementById("spendingChart");
    if (!chartCanvas || typeof Chart === "undefined") return;

    const thisMonth = new Date().toISOString().substring(0, 7);
    const monthExpenses = this.transactions.filter(
      (t) => t.type === "expense" && t.date.startsWith(thisMonth)
    );

    const expenseByCategory = {};
    monthExpenses.forEach((t) => {
      expenseByCategory[t.category] =
        (expenseByCategory[t.category] || 0) + t.amount;
    });

    const data = {
      labels: Object.keys(expenseByCategory).map(
        (cat) => this.categories.expense?.[cat]?.name || cat
      ),
      datasets: [
        {
          data: Object.values(expenseByCategory),
          backgroundColor: Object.keys(expenseByCategory).map(
            (cat) => this.categories.expense?.[cat]?.color || "#666"
          ),
        },
      ],
    };

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(chartCanvas, {
      type: "doughnut",
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
        },
      },
    });
  },

  showQuickAddModal(type) {
    const form = document.getElementById("quickAddForm");
    const typeInput = document.getElementById("quickAddType");
    const modalTitle = document.getElementById("quickAddTitle");

    if (form && typeInput) {
      form.dataset.type = type;
      typeInput.value = type;

      if (modalTitle) {
        modalTitle.textContent =
          type === "income" ? "➕ Tambah Pemasukan" : "➖ Tambah Pengeluaran";
      }

      this.updateCategoryOptions(type);
      window.openModal("quickAddModal");

      setTimeout(() => {
        const amountInput = document.getElementById("quickAddAmount");
        if (amountInput) {
          amountInput.focus();
        }
      }, 100);
    }
  },

  updateUserInfo() {
    this.renderProfileContent();
  },
  
  renderProfileContent() {
    const profileContent = document.getElementById("profileContent");
    if (!profileContent || !this.currentUser) return;

    const stats = this.calculateUserStats();
    const recent = [...this.transactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    // Get the first letter of the name for the avatar
    const initial = (this.currentUser.name || "Pengguna")
      .charAt(0)
      .toUpperCase();

    profileContent.innerHTML = `
      <div class="profile-container">
        <div class="profile-header">
          <div class="profile-avatar">
            ${initial}
          </div>
          <div class="profile-info">
            <h2 class="profile-name">${this.currentUser.name || "Pengguna"}</h2>
            <p class="profile-email">${
              this.currentUser.email || "pengguna@tamu"
            }</p>
            ${
              this.currentUser.isGuest
                ? `<span class="guest-badge">
                <i class="fas fa-user-clock"></i>
                Mode Tamu
              </span>`
                : ""
            }
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-card balance">
            <div class="stat-title">Saldo Total</div>
            <div class="stat-value ${
              stats.balance >= 0 ? "income" : "expense"
            }">
              ${Utils.formatCurrency(stats.balance)}
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-title">Total Transaksi</div>
            <div class="stat-value">${stats.totalTransactions}</div>
            <div class="stat-detail">
              <span class="income">${stats.incomeCount} Pemasukan</span>
              <span class="expense">${stats.expenseCount} Pengeluaran</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Total Pemasukan</div>
            <div class="stat-value income">${Utils.formatCurrency(
              stats.totalIncome
            )}</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Total Pengeluaran</div>
            <div class="stat-value expense">${Utils.formatCurrency(
              stats.totalExpense
            )}</div>
          </div>
        </div>

        <div class="activity-section">
          <div class="activity-header">
            <h3>Aktivitas Terakhir</h3>
          </div>
          <div class="activity-list">
            ${
              recent.length
                ? recent
                    .map(
                      (t) => `
              <div class="activity-item ${t.type}">
                <div class="activity-icon">
                  ${this.categories[t.type]?.[t.category]?.icon || "📝"}
                </div>
                <div class="activity-info">
                  <p class="activity-title">
                    ${this.categories[t.type]?.[t.category]?.name || "Lainnya"}
                    ${t.description ? `- ${t.description}` : ""}
                  </p>
                  <span class="activity-date">
                    ${Utils.formatDate(t.date)} ${t.time}
                  </span>
                </div>
                <div class="activity-amount ${t.type}">
                  ${Utils.formatCurrency(t.amount)}
                </div>
              </div>
            `
                    )
                    .join("")
                : `
              <div class="activity-empty">
                <p>Belum ada transaksi</p>
              </div>
            `
            }
          </div>
        </div>

        ${
          !this.currentUser.isGuest
            ? `
          <div class="profile-actions">
            <button class="profile-button" onclick="ExpenseTracker.showExportDataModal()">
              <i class="fas fa-download"></i>
              Export Data
            </button>
            <button class="profile-button" onclick="ExpenseTracker.showSettingsModal()">
              <i class="fas fa-cog"></i>
              Pengaturan
            </button>
          </div>
        `
            : ""
        }
      </div>
    `;
  },

  updateBalance() {
    const userBalance = document.querySelector(".user-balance .balance-amount");
    if (userBalance) {
      const balance = this.calculateBalance();
      userBalance.textContent = Utils.formatCurrency(balance);
    }
  },

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
  
  updateBudget() {
    const budgetSection = document.querySelector(".budget-section");
    if (!budgetSection) return;
    
    // Gunakan data dari stats global
    const stats = this.stats;
    
    budgetSection.innerHTML = `
      <div class="section-header budget-header">
        <h2>Anggaran Bulanan</h2>
        <button class="btn-secondary" onclick="ExpenseTracker.showBudgetForm()">
          <i class="fas fa-edit"></i> Edit
        </button>
      </div>
      <div class="budget-info">
        <div class="budget-month">${stats.currentMonthName}</div>
        <div class="budget-amount">${Utils.formatCurrency(stats.monthlyBudget)}</div>
      </div>
      <div class="budget-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${stats.budgetPercentage}%"></div>
        </div>
        <div class="progress-labels">
          <span class="progress-percent">${stats.budgetPercentage}% digunakan</span>
          <span class="progress-value">${Utils.formatCurrency(stats.monthlyExpense)} / ${Utils.formatCurrency(stats.monthlyBudget)}</span>
        </div>
      </div>
      <div class="budget-remaining ${stats.budgetRemaining < 0 ? 'negative' : ''}">
        <span>Sisa: ${Utils.formatCurrency(stats.budgetRemaining)}</span>
      </div>
    `;
  },
  
  updateBudgetStatus() {
    const budgetStatus = document.querySelector(".budget-status");
    if (!budgetStatus) return;
    
    // Gunakan data dari stats global
    const stats = this.stats;
    
    let statusClass = 'normal';
    let statusMessage = 'Pengeluaran dalam batas normal';
    
    if (stats.budgetPercentage >= 90) {
      statusClass = 'critical';
      statusMessage = 'Anggaran hampir habis!';
    } else if (stats.budgetPercentage >= 75) {
      statusClass = 'warning';
      statusMessage = 'Pengeluaran mendekati batas anggaran';
    } else if (stats.budgetPercentage <= 25 && stats.monthlyBudget > 0) {
      statusClass = 'good';
      statusMessage = 'Pengeluaran sangat baik';
    }
    
    if (stats.monthlyBudget === 0) {
      statusMessage = 'Anggaran belum diatur';
      statusClass = 'unset';
    }
    
    budgetStatus.innerHTML = `
      <div class="status-indicator ${statusClass}"></div>
      <div class="status-message">${statusMessage}</div>
      <div class="status-details">
        <span>${stats.budgetPercentage}%</span>
        <span>${Utils.formatCurrency(stats.monthlyExpense)} / ${Utils.formatCurrency(stats.monthlyBudget)}</span>
      </div>
    `;
  },

  calculateUserStats() {
    // Pastikan statistik global sudah diperbarui
    if (!this.stats || Object.keys(this.stats).length === 0) {
      this.updateGlobalStats();
    }
    
    // Gunakan stats global untuk konsistensi
    return this.stats;
  },

  formatCurrency(amount) {
    return Utils.formatCurrency(amount);
  },

  formatDate(dateString) {
    return Utils.formatDate(dateString);
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
      timeInput.value = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
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
  },

  hideLoading() {
    const loading = document.querySelector(".loading-overlay");
    if (loading) {
      loading.classList.remove("show");
    }
  },

  showToast(message, type = "info") {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, 4000);
  },

  showProfile() {
    this.showSection("profile");
    this.renderProfileContent();
  },

  logout() {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      Auth.logout();
      this.currentUser = null;
      this.transactions = [];
      this.categories = {};
      this.budget = {};
      this.tipsShown = false;
      this.checkAuthState();
      this.showToast("Anda berhasil keluar", "info");
    }
  },

  exportUserData() {
    if (!this.currentUser) return;

    const data = {
      transactions: this.transactions,
      categories: this.categories,
      budget: this.budget,
      user: {
        name: this.currentUser.name,
        email: this.currentUser.email,
        id: this.currentUser.id,
        exportDate: new Date().toISOString(),
      },
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `pengeluaranqu-data-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();

    URL.revokeObjectURL(url);
    this.showToast("Data berhasil diexport", "success");
  },

  renderProfileContent() {
    const profileContent = document.getElementById("profileContent");
    if (!profileContent || !this.currentUser) return;

    const stats = this.calculateUserStats();
    const recent = [...this.transactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    // Get the first letter of the name for the avatar
    const initial = (this.currentUser.name || "Pengguna")
      .charAt(0)
      .toUpperCase();

    profileContent.innerHTML = `
      <div class="profile-container">
        <div class="profile-header">
          <div class="profile-avatar">
            ${initial}
          </div>
          <div class="profile-info">
            <h2 class="profile-name">${this.currentUser.name || "Pengguna"}</h2>
            <p class="profile-email">${
              this.currentUser.email || "pengguna@tamu"
            }</p>
            ${
              this.currentUser.isGuest
                ? `<span class="guest-badge">
                <i class="fas fa-user-clock"></i>
                Mode Tamu
              </span>`
                : ""
            }
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat-card balance">
            <div class="stat-title">Saldo Total</div>
            <div class="stat-value ${
              stats.balance >= 0 ? "income" : "expense"
            }">
              ${Utils.formatCurrency(stats.balance)}
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-title">Total Transaksi</div>
            <div class="stat-value">${stats.totalTransactions}</div>
            <div class="stat-detail">
              <span class="income">${stats.incomeCount} Pemasukan</span>
              <span class="expense">${stats.expenseCount} Pengeluaran</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Total Pemasukan</div>
            <div class="stat-value income">${Utils.formatCurrency(
              stats.totalIncome
            )}</div>
          </div>

          <div class="stat-card">
            <div class="stat-title">Total Pengeluaran</div>
            <div class="stat-value expense">${Utils.formatCurrency(
              stats.totalExpense
            )}</div>
          </div>
        </div>

        <div class="activity-section">
          <div class="activity-header">
            <h3>Aktivitas Terakhir</h3>
            ${
              recent.length > 0
                ? '<button class="btn-text" onclick="ExpenseTracker.showSection(\'history\')">Lihat Semua</button>'
                : ""
            }
          </div>
          <div class="activity-list">
            ${
              recent.length
                ? recent
                    .map(
                      (t) => `
              <div class="activity-item ${t.type}">
                <div class="activity-icon">
                  ${this.categories[t.type]?.[t.category]?.icon || "📝"}
                </div>
                <div class="activity-info">
                  <p class="activity-title">
                    ${this.categories[t.type]?.[t.category]?.name || "Lainnya"}
                    ${t.description ? `- ${t.description}` : ""}
                  </p>
                  <span class="activity-date">
                    ${Utils.formatDate(t.date)} ${t.time}
                  </span>
                </div>
                <div class="activity-amount ${t.type}">
                  ${Utils.formatCurrency(t.amount)}
                </div>
              </div>
            `
                    )
                    .join("")
                : `
              <div class="activity-empty">
                <p>Belum ada transaksi</p>
                <button class="btn-primary" onclick="ExpenseTracker.showSection('add-transaction')">Tambah Transaksi</button>
              </div>
            `
            }
          </div>
        </div>

        <div class="profile-actions">
          ${
            !this.currentUser.isGuest
              ? `
            <button class="profile-button" onclick="ExpenseTracker.exportUserData()">
              <i class="fas fa-download"></i>
              Export Data
            </button>
            <button class="profile-button">
              <i class="fas fa-cog"></i>
              Pengaturan
            </button>
          `
              : ""
          }
          <button class="profile-button logout" onclick="ExpenseTracker.logout()">
            <i class="fas fa-sign-out-alt"></i>
            Keluar
          </button>
        </div>
      </div>
    `;
  },
};

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize NotificationSystem if not present
  window.NotificationSystem = window.NotificationSystem || {
    addNotification: function (type, message, amount) {
      ExpenseTracker.showToast(
        message,
        type === "success" ? "success" : "info"
      );
    },
  };

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
