"use strict";

// Utility functions - make it globally available
window.Utils = {
  formatCurrency: (amount) => {
    // Enhanced formatting for large numbers with better mobile display
    const absAmount = Math.abs(amount);
    const isNegative = amount < 0;
    const sign = isNegative ? "-" : "";

    // For very large amounts, use shortened format on mobile screens
    if (window.innerWidth <= 480 && absAmount >= 1000000) {
      if (absAmount >= 1000000000) {
        return `${sign}Rp${(absAmount / 1000000000).toFixed(1)}M`;
      } else if (absAmount >= 1000000) {
        return `${sign}Rp${(absAmount / 1000000).toFixed(1)}jt`;
      }
    }

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

// Define and expose ExpenseTracker globally
window.ExpenseTracker = {
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
          // Prevent multiple rapid calls
          if (this._updatingHistory) return;
          this._updatingHistory = true;

          setTimeout(() => {
            this.updateHistory();
            this._updatingHistory = false;
          }, 10);
        });
      }
    });

    // Auto-format amount inputs
    const amountInputs = [
      "amount",
      "quickAddAmount",
      "editAmount",
      "monthlyBudget",
      "categoryBudgetAmount",
      "budget-amount",
    ]; // ditambah edit & budget inputs
    amountInputs.forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener("input", (e) => this.formatAmountInput(e));
      }
    });
  },

  formatAmountInput(e) {
    const input = e.target;
    // 1. Get raw value by removing all non-numeric characters
    let rawValue = input.value.replace(/[^0-9]/g, "");

    // 2. Store the raw value in a data attribute
    input.dataset.rawValue = rawValue;

    // 3. Format the display value with thousand separators
    if (rawValue) {
      const formattedValue = parseInt(rawValue, 10).toLocaleString("id-ID");
      input.value = formattedValue;
    } else {
      input.value = ""; // Clear input if it's empty
    }
  },

  checkAuthState() {
    this.currentUser = Auth.getCurrentUser();

    if (this.currentUser) {
      // Deteksi tipe pengguna
      if (this.currentUser.provider === "google") {
        console.log("User logged in with Google:", this.currentUser.email);
      } else if (this.currentUser.isGuest) {
        console.log("User in guest mode:", this.currentUser.id);
      }

      // Ensure settings object exists
      if (!this.currentUser.settings) {
        this.currentUser.settings = {};
        localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
      }

      const mainApp = document.querySelector(".main-app");
      if (mainApp) {
        mainApp.classList.add("active");
      }

      const authScreen = document.querySelector(".auth-screen");
      if (authScreen) {
        authScreen.classList.remove("active");
      }

      this.loadUserData();

      // Show the default section first, then update the UI.
      this.showSection(this.currentView);
      this.updateUI();

      setTimeout(() => {
        // this.showWelcomeTips(); // TODO: Implement welcome tips feature
      }, 500);
    } else {
      if (window.location.pathname.endsWith("dashboard.html")) {
        window.location.href = "login.html";
      }
    }
  },

  loadUserData() {
    if (!this.currentUser) return;

    const userId = this.currentUser.id;

    // Load transactions from localStorage
    const savedTransactions = localStorage.getItem(`transactions_${userId}`);
    this.transactions = savedTransactions ? JSON.parse(savedTransactions) : [];

    // Load categories
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

    // Load budget
    const savedBudget = localStorage.getItem(`budget_${userId}`);
    this.budget = savedBudget ? JSON.parse(savedBudget) : {};

    // Calculate initial stats
    this.updateGlobalStats();

    // Now the data is ready, we can safely update the UI
    if (document.querySelector(".dashboard-section")) {
      // If we're on the dashboard, do a full update
      this.updateDashboard();
    } else {
      // Otherwise just update the current view
      this.updateUI();
    }
  },

  saveUserData() {
    if (!this.currentUser) return;

    const userId = this.currentUser.id;

    // Save transactions and categories
    localStorage.setItem(
      `transactions_${userId}`,
      JSON.stringify(this.transactions)
    );
    localStorage.setItem(
      `categories_${userId}`,
      JSON.stringify(this.categories)
    );

    // Save budget data
    localStorage.setItem(`budget_${userId}`, JSON.stringify(this.budget));

    // The single source of truth for the budget is now managed by updateGlobalStats.
    // We just need to ensure the currentUser object in localStorage is up-to-date
    // with the latest settings.
    localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
  },

  // Helper function untuk update balance dengan retry mechanism
  updateBalanceDisplay(retries = 5) {
    const attemptUpdate = (attempt) => {
      try {
        // First check if dashboard is active
        const dashboardSection = document.getElementById("dashboard");
        if (
          !dashboardSection ||
          !dashboardSection.classList.contains("active")
        ) {
          console.log(
            `Attempt ${
              attempt + 1
            }: Dashboard not active, skipping balance update`
          );
          return false;
        }

        const dashboardBalance = document.getElementById("dashboardBalance");
        if (dashboardBalance) {
          // Make sure we have valid stats
          if (!this.stats || !this.stats.monthlyBalance === undefined) {
            this.updateGlobalStats();
          }

          const formattedBalance = Utils.formatCurrency(
            this.stats.monthlyBalance
          );
          dashboardBalance.textContent = formattedBalance;
          console.log(
            `Dashboard balance updated successfully on attempt ${
              attempt + 1
            }: ${formattedBalance}`
          );
          return true;
        } else {
          console.warn(
            `Dashboard balance element not found on attempt ${attempt + 1}`
          );
          return false;
        }
      } catch (error) {
        console.error(
          `Error updating balance on attempt ${attempt + 1}:`,
          error
        );
        return false;
      }
    };

    // Try immediate update first
    if (attemptUpdate(0)) return;

    // If failed, try with increasing delays
    for (let i = 1; i < retries; i++) {
      setTimeout(() => {
        if (!attemptUpdate(i)) {
          if (i === retries - 1) {
            console.error(
              `Failed to update dashboard balance after ${i + 1} attempts`
            );
          }
        }
      }, i * 100); // Increased delay between attempts
    }
  },

  showSection(sectionId) {
    // Hide all sections first
    document.querySelectorAll(".tab-content").forEach((section) => {
      section.classList.remove("active");
    });

    // Deactivate all nav tabs
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Show the target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add("active");
    } else {
      console.warn(`Target section #${sectionId} not found in DOM`);
    }

    // Activate the corresponding nav tab
    const navTab = document.querySelector(`[data-tab="${sectionId}"]`);
    if (navTab) {
      navTab.classList.add("active");
    }

    // Store the current view
    const previousView = this.currentView;
    this.currentView = sectionId;

    // Dispatch event for other components to react
    document.dispatchEvent(
      new CustomEvent("tab-changed", {
        detail: { tab: sectionId, previousTab: previousView },
      })
    );

    // Handle section-specific updates with a small delay to ensure DOM is ready
    setTimeout(() => {
      switch (sectionId) {
        case "dashboard":
          console.log("Updating dashboard content...");
          // Enable dashboard updates when on dashboard
          window.__DISABLE_DASHBOARD_UPDATES__ = false;
          this.updateGlobalStats(); // Make sure data is fresh
          this.updateDashboard();
          this.updateBudget();
          UI.showQuickAddButton(true);
          break;
        case "history":
          this.updateHistory();
          UI.showQuickAddButton(false);
          break;
        case "add-transaction":
          UI.showQuickAddButton(false);
          setTimeout(() => {
            const amountInput = document.getElementById("amount");
            if (amountInput) amountInput.focus();
            this.setDefaultDate();

            // Initialize categories for the default transaction type (expense)
            const form = document.getElementById("transactionForm");
            const currentType = form
              ? form.dataset.type || "expense"
              : "expense";
            this.updateCategoryOptions(currentType);
          }, 100);
          break;
        case "analytics":
          UI.showQuickAddButton(false);
          break;
      }
    }, 50); // Small delay to ensure DOM updates first
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

      // Add default "Choose category" option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Choose category";
      categorySelect.appendChild(defaultOption);

      // Add category options
      Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${category.icon || ""} ${category.name}`;
        categorySelect.appendChild(option);
      });
    }

    if (quickCategorySelect) {
      quickCategorySelect.innerHTML = "";

      // Add default "Choose category" option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Choose category";
      quickCategorySelect.appendChild(defaultOption);

      // Add category options
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

  populateCategoryFilter() {
    const filterSelect = document.getElementById("filterCategory");
    if (!filterSelect) return; // Skip if not on a page with filter

    // Save current selection if exists
    const currentValue = filterSelect.value;

    // Clear existing options
    filterSelect.innerHTML = "";

    // Add "All" option
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "📂 Semua Kategori";
    filterSelect.appendChild(allOption);

    // Add expense categories
    if (this.categories.expense) {
      Object.entries(this.categories.expense).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${category.icon} ${category.name}`;
        filterSelect.appendChild(option);
      });
    }

    // Add income categories
    if (this.categories.income) {
      Object.entries(this.categories.income).forEach(([id, category]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${category.icon} ${category.name}`;
        filterSelect.appendChild(option);
      });
    }

    // Restore selection if possible
    if (currentValue && currentValue !== "") {
      // Check if the value exists in options
      const optionExists = [...filterSelect.options].some(
        (option) => option.value === currentValue
      );
      if (optionExists) {
        filterSelect.value = currentValue;
      }
    }
  },

  populateMonthFilter() {
    const filterSelect = document.getElementById("filterMonth");
    if (!filterSelect) return;

    // Save current selection if exists
    const currentValue = filterSelect.value;

    // Get unique months from transactions
    const months = [
      ...new Set(this.transactions.map((t) => t.date.substring(0, 7))),
    ];
    months.sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

    // Clear existing options except the first one (All months)
    const firstOption = filterSelect.firstElementChild;
    filterSelect.innerHTML = "";
    if (firstOption) {
      filterSelect.appendChild(firstOption);
    } else {
      const allOption = document.createElement("option");
      allOption.value = "";
      allOption.textContent = "📅 Semua Bulan";
      filterSelect.appendChild(allOption);
    }

    // Add month options
    months.forEach((monthYear) => {
      const [year, month] = monthYear.split("-");
      const date = new Date(year, month - 1);
      const monthName = date.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });

      const option = document.createElement("option");
      option.value = monthYear;
      option.textContent = monthName;
      filterSelect.appendChild(option);
    });

    // Restore selection if possible
    if (currentValue && currentValue !== "" && months.includes(currentValue)) {
      filterSelect.value = currentValue;
    }
  },

  updateAllCategoryDropdowns() {
    const form = document.getElementById("transactionForm");
    const currentType = form?.dataset.type || "expense";
    this.updateCategoryOptions(currentType);

    // Only populate filter if on history page and not already populated
    const categoryFilter = document.getElementById("filterCategory");
    if (categoryFilter && categoryFilter.children.length <= 1) {
      this.populateCategoryFilter();
    }

    this.updateEditCategoryOptions(currentType);
    this.updateQuickAddCategoryOptions(currentType);
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
    // Cegah eksekusi ganda (double submit)
    if (this._addingTransaction) return;
    this._addingTransaction = true;
    setTimeout(() => (this._addingTransaction = false), 800); // reset guard

    const form = document.getElementById("transactionForm");
    const formData = new FormData(form);

    const amountInput = form.querySelector("#amount");
    const rawValue = amountInput?.dataset.rawValue || amountInput?.value || "";
    const amount = parseFloat(rawValue);

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

    // Add transaction to array and save data immediately
    this.transactions.push(transaction);
    this.saveUserData();
    form.reset();

    // Show success message
    this.showToast(
      `Transaksi ${
        transaction.type === "income" ? "pemasukan" : "pengeluaran"
      } berhasil ditambahkan.`,
      "success"
    );

    console.log("Transaction added successfully:", transaction);

    // Calculate fresh stats immediately
    this.updateGlobalStats();
    console.log("Stats updated after transaction:", this.stats);

    // Stay on add-transaction page and reset form for new input
    console.log("Staying on add-transaction page, resetting form...");

    // Reset form to default values
    this.setDefaultDate();

    // Clear description field
    const descriptionInput = document.getElementById("description");
    if (descriptionInput) {
      descriptionInput.value = "";
    }

    // Focus on amount input for quick next entry
    setTimeout(() => {
      const amountInput = document.getElementById("amount");
      if (amountInput) {
        amountInput.focus();
        amountInput.select();
      }
    }, 100);
  },

  handleQuickAdd() {
    if (this._addingQuick) return;
    this._addingQuick = true;
    setTimeout(() => (this._addingQuick = false), 800);

    const form = document.getElementById("quickAddForm");
    const formData = new FormData(form);
    const amountInput = form.querySelector("#quickAddAmount");
    const rawValue = amountInput?.dataset.rawValue || amountInput?.value || "";
    const amount = parseFloat(rawValue);
    const category = formData.get("category");
    const type = formData.get("type") || formData.get("type") || "expense";

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

    // Trigger storage event untuk dashboard real-time update
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent("localStorageUpdate", {
          detail: {
            key: "transactions",
            action: "add",
            transaction: transaction,
          },
        })
      );
    }

    form.reset();
    window.closeModal("quickAddModal");

    // Update statistik global dulu
    this.updateGlobalStats();

    if (this.currentView === "dashboard") {
      // Force update dashboard untuk memastikan sinkronisasi
      setTimeout(() => {
        this.updateDashboard();
        this.updateBudget();
      }, 100);
    } else {
      // Update global stats aja kalau tidak di dashboard
      this.updateUI();
    }

    const typeText =
      transaction.type === "income" ? "pemasukan" : "pengeluaran";
    const notifMessage = `${typeText} cepat ${
      transaction.description ? `(${transaction.description})` : ""
    } berhasil ditambahkan`;

    // Langsung gunakan showToast tanpa NotificationSystem
    this.showToast(notifMessage, "success");
  },

  deleteTransaction(id) {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      this.transactions = this.transactions.filter((t) => t.id !== id);
      this.saveUserData();
      this.updateUI();
      this.showToast("Transaksi berhasil dihapus!", "success");
    }
  },

  editTransaction(id) {
    const transaction = this.transactions.find((t) => t.id === id);
    if (!transaction) {
      this.showToast("Transaksi tidak ditemukan!", "error");
      return;
    }

    // Check if edit form elements exist
    const editId = document.getElementById("editId");
    const editType = document.getElementById("editType");
    const editAmount = document.getElementById("editAmount");
    const editDescription = document.getElementById("editDescription");
    const editDate = document.getElementById("editDate");
    const editTime = document.getElementById("editTime");

    if (
      !editId ||
      !editType ||
      !editAmount ||
      !editDescription ||
      !editDate ||
      !editTime
    ) {
      this.showToast("Form edit tidak tersedia di halaman ini!", "error");
      return;
    }

    // Populate edit form
    editId.value = transaction.id;
    editType.value = transaction.type;
    editAmount.value = transaction.amount.toLocaleString("id-ID");
    editAmount.dataset.rawValue = transaction.amount.toString();
    editDescription.value = transaction.description || "";
    editDate.value = transaction.date;
    editTime.value = transaction.time || "00:00";

    // Update category options for the transaction type
    this.updateEditCategoryOptions(transaction.type);

    // Set selected category
    setTimeout(() => {
      document.getElementById("editCategory").value = transaction.category;
    }, 100);

    // Show modal
    window.openModal("editModal");

    // Setup edit form submit handler
    const editForm = document.getElementById("editForm");
    editForm.onsubmit = (e) => {
      e.preventDefault();
      this.updateTransaction();
    };

    // Setup delete button
    const deleteBtn = document.getElementById("deleteBtn");
    deleteBtn.onclick = () => {
      closeModal("editModal");
      this.deleteTransaction(id);
    };
  },

  updateTransaction() {
    const form = document.getElementById("editForm");
    const formData = new FormData(form);

    const id = formData.get("id");
    const amountInput = form.querySelector("#editAmount");
    const rawValue = amountInput?.dataset.rawValue || amountInput?.value || "";
    const amount = parseFloat(rawValue);

    // Validation
    if (!amount || amount <= 0) {
      this.showToast("Mohon masukkan jumlah yang valid", "error");
      return;
    }

    const category = formData.get("category");
    const date = formData.get("date");

    if (!category) {
      this.showToast("Mohon pilih kategori", "error");
      return;
    }

    if (!date) {
      this.showToast("Mohon pilih tanggal", "error");
      return;
    }

    // Find and update transaction
    const transactionIndex = this.transactions.findIndex((t) => t.id === id);
    if (transactionIndex === -1) {
      this.showToast("Transaksi tidak ditemukan!", "error");
      return;
    }

    // Update transaction data
    this.transactions[transactionIndex] = {
      ...this.transactions[transactionIndex],
      amount: amount,
      category: category,
      description: formData.get("description") || "",
      date: date,
      time:
        formData.get("time") ||
        new Date().toTimeString().split(" ")[0].substring(0, 5),
      updatedAt: Date.now(),
    };

    this.saveUserData();
    this.updateUI();
    closeModal("editModal");

    this.showToast("Transaksi berhasil diperbarui!", "success");
  },

  showBudgetModal() {
    this.showBudgetForm();
  },

  showBudgetForm() {
    const budgetInput = document.getElementById("budget-amount");
    const monthInput = document.getElementById("budget-month");

    if (!monthInput || !budgetInput) {
      console.error("Budget form elements not found in the current view.");
      return;
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
    const amountInput =
      document.getElementById("monthlyBudget") ||
      document.getElementById("budget-amount");
    const raw = amountInput
      ? amountInput.dataset.rawValue || amountInput.value || ""
      : formData.get("budget") || "";
    const cleaned = raw.replace(/[^0-9]/g, "");
    const amount = cleaned ? parseFloat(cleaned) : 0;
    const monthInput = document.getElementById("budget-month");
    const currentMonth =
      monthInput?.value || new Date().toISOString().substring(0, 7);

    if (amount >= 0) {
      this.budget[currentMonth] = amount;
      const todayMonth = new Date().toISOString().substring(0, 7);
      if (currentMonth === todayMonth) {
        if (!this.currentUser.settings) this.currentUser.settings = {};
        this.currentUser.settings.monthlyBudget = amount;
      }
      this.saveUserData();
      this.showToast("Anggaran berhasil diatur!", "success");

      // Close modal first
      window.closeModal("budgetModal");

      // Force comprehensive budget updates
      this.updateGlobalStats();
      this.refreshBudgetDisplay();

      // Update the current view
      this.updateUI();
    } else {
      this.showToast("Masukkan jumlah anggaran yang valid", "error");
    }
  },

  updateUI() {
    // This is the master function to refresh the application's display.
    // It ensures all calculations are up-to-date before redrawing UI components.

    // 1. Recalculate all global statistics. This is the single source of truth.
    this.updateGlobalStats();

    // 2. Update only the currently visible section to prevent errors.
    switch (this.currentView) {
      case "dashboard":
        this.updateDashboard();
        break;
      case "history":
        this.updateHistory();
        break;
      case "analytics":
        this.updateAnalytics();
        break;
      case "profile":
        this.renderProfileContent();
        break;
    }

    // 3. Always update components that might be globally visible or need fresh data.
    this.updateUserInfo(); // For header, etc.
    this.updateAllCategoryDropdowns(); // For forms
    this.updateBudgetStatus(); // For global status indicators
  },

  updateHistory() {
    // Get transaction list container
    const transactionList = document.getElementById("transactionList");
    const totalIncomeFiltered = document.getElementById("totalIncomeFiltered");
    const totalExpenseFiltered = document.getElementById(
      "totalExpenseFiltered"
    );
    const netAmountFiltered = document.getElementById("netAmountFiltered");

    if (!transactionList) return;

    // Populate filter dropdowns only if they're empty or need refresh
    const monthFilter = document.getElementById("filterMonth");
    const categoryFilter = document.getElementById("filterCategory");

    // Check if filters need to be populated
    const needMonthPopulate = !monthFilter || monthFilter.children.length <= 1;
    const needCategoryPopulate =
      !categoryFilter || categoryFilter.children.length <= 1;

    if (needMonthPopulate && this.transactions.length > 0) {
      this.populateMonthFilter();
    }

    if (
      needCategoryPopulate &&
      (this.categories.expense || this.categories.income)
    ) {
      this.populateCategoryFilter();
    }

    // Update budget status on history page
    this.updateBudgetStatus();

    // Get all transactions sorted by date (newest first)
    const transactions = [...this.transactions].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    // Apply filters if they exist
    const filterMonth = document.getElementById("filterMonth")?.value || "";
    const filterType = document.getElementById("filterType")?.value || "";
    const filterCategory =
      document.getElementById("filterCategory")?.value || "";

    const filteredTransactions = transactions.filter((t) => {
      const matchMonth = filterMonth ? t.date.startsWith(filterMonth) : true;
      const matchType = filterType ? t.type === filterType : true;
      const matchCategory = filterCategory
        ? t.category === filterCategory
        : true;

      return matchMonth && matchType && matchCategory;
    });

    // Calculate totals for the filtered transactions
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === "income") {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    const netAmount = totalIncome - totalExpense;

    // Update summary
    if (totalIncomeFiltered)
      totalIncomeFiltered.textContent = Utils.formatCurrency(totalIncome);
    if (totalExpenseFiltered)
      totalExpenseFiltered.textContent = Utils.formatCurrency(totalExpense);
    if (netAmountFiltered) {
      netAmountFiltered.textContent = Utils.formatCurrency(netAmount);
      netAmountFiltered.classList.toggle("positive", netAmount >= 0);
      netAmountFiltered.classList.toggle("negative", netAmount < 0);
    }

    // Update transaction list
    if (filteredTransactions.length === 0) {
      transactionList.innerHTML = `
        <div class="empty-state">
          📭
          <p>Tidak ada data transaksi</p>
        </div>
      `;
      return;
    }

    transactionList.innerHTML = filteredTransactions
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
        <div class="transaction-actions">
          <button class="btn-icon edit-transaction" onclick="window.app.editTransaction('${
            t.id
          }')">✏️</button>
          <button class="btn-icon delete-transaction" onclick="window.app.deleteTransaction('${
            t.id
          }')">🗑️</button>
        </div>
      </div>
    `
      )
      .join("");
  },

  clearFilters() {
    // Clear all filter values
    const filterMonth = document.getElementById("filterMonth");
    const filterType = document.getElementById("filterType");
    const filterCategory = document.getElementById("filterCategory");

    if (filterMonth) filterMonth.value = "";
    if (filterType) filterType.value = "";
    if (filterCategory) filterCategory.value = "";

    // Force repopulate filters to ensure all options are available
    this.populateMonthFilter();
    this.populateCategoryFilter();

    // Refresh the history to show all transactions
    this.updateHistory();
  },

  updateGlobalStats() {
    // Hitung statistik sekali saja untuk digunakan di semua tampilan
    const today = new Date();
    const thisMonth = today.toISOString().substring(0, 7);

    // Ensure we have a user object first
    if (!this.currentUser) {
      const savedUser = localStorage.getItem("currentUser");
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      } else {
        // If we still don't have a user, return empty stats to prevent errors
        return this._getEmptyStats();
      }
    }

    // Pastikan objek budget tersedia
    if (!this.budget) {
      const userId = this.currentUser.id;
      const savedBudget = localStorage.getItem(`budget_${userId}`);
      this.budget = savedBudget ? JSON.parse(savedBudget) : {};
    }

    // Synchronize budget data between user settings and budget object
    if (this.currentUser?.settings?.monthlyBudget !== undefined) {
      // User settings has budget data, use it for current month
      this.budget[thisMonth] = this.currentUser.settings.monthlyBudget;
    } else if (this.budget[thisMonth] !== undefined) {
      // Budget object has data for current month, update user settings
      if (!this.currentUser.settings) {
        this.currentUser.settings = {};
      }
      this.currentUser.settings.monthlyBudget = this.budget[thisMonth];
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
    }

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
      expenseCount: this.transactions.filter((t) => t.type === "expense")
        .length,
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      totalBalance: totalBalance,

      // Bulan ini
      monthlyIncome: monthlyIncome,
      monthlyExpense: monthlyExpense,
      monthlyBalance: monthlyBalance,
      monthlyBudget: monthlyBudget,
      budgetRemaining: monthlyBudget - monthlyExpense,
      budgetPercentage:
        monthlyBudget > 0
          ? Math.min(100, Math.round((monthlyExpense / monthlyBudget) * 100))
          : 0,

      // Period
      currentMonth: thisMonth,
      currentMonthName: new Date().toLocaleString("id-ID", {
        month: "long",
        year: "numeric",
      }),
    };

    return this.stats;
  },

  _getEmptyStats() {
    // Return empty stats object with default values to prevent errors
    const today = new Date();
    const thisMonth = today.toISOString().substring(0, 7);

    return (this.stats = {
      // Total statistik
      totalTransactions: 0,
      incomeCount: 0,
      expenseCount: 0,
      totalIncome: 0,
      totalExpense: 0,
      totalBalance: 0,

      // Bulan ini
      monthlyIncome: 0,
      monthlyExpense: 0,
      monthlyBalance: 0,
      monthlyBudget: 0,
      budgetRemaining: 0,
      budgetPercentage: 0,

      // Period
      currentMonth: thisMonth,
      currentMonthName: today.toLocaleString("id-ID", {
        month: "long",
        year: "numeric",
      }),
    });
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
    try {
      console.log("Starting dashboard update process...");

      // If explicitly disabled (e.g., on standalone pages like add-transaction), skip
      if (window.__DISABLE_DASHBOARD_UPDATES__) {
        console.log("updateDashboard: Skipped (global disable flag set)");
        return;
      }

      // Fast guard: if page has no dashboard container/elements, don't proceed
      if (
        !document.getElementById("dashboard") &&
        !document.getElementById("dashboardBalance") &&
        !document.getElementById("monthIncome") &&
        !document.getElementById("monthExpense")
      ) {
        console.log(
          "updateDashboard: No dashboard elements present on this page, aborting."
        );
        return;
      }

      // First, ensure we have updated stats
      this.updateGlobalStats();

      // Use a safer approach to update each component with error handling

      // 1. First update the main balance - most critical component
      try {
        this.updateDashboardStats();
      } catch (e) {
        console.error("Error updating dashboard stats:", e);
      }

      // 2. Then update recent transactions
      try {
        this.updateRecentTransactions();
      } catch (e) {
        console.error("Error updating recent transactions:", e);
      }

      // 3. Update budget status
      try {
        this.updateBudgetStatus();
      } catch (e) {
        console.error("Error updating budget status:", e);
      }

      // 4. Update chart last (least critical)
      try {
        const chartElement = document.getElementById("spendingChart");
        if (chartElement && typeof Chart !== "undefined") {
          this.updateSpendingChart();
        }
      } catch (e) {
        console.error("Error updating spending chart:", e);
      }

      console.log("Dashboard update completed successfully");
    } catch (e) {
      console.error("Critical error updating dashboard:", e);
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
    const maxRetries = 15; // Increased retries
    const retryDelay = 200; // Increased delay between retries

    // If page has no dashboard markers at all, skip (prevents retries on add-transaction page)
    if (window.__DISABLE_DASHBOARD_UPDATES__) {
      console.log(
        "updateDashboardStats: Skipped (global disable flag set for this page)"
      );
      return;
    }

    const hasAnyDashboardMarker =
      document.getElementById("dashboardBalance") ||
      document.getElementById("monthIncome") ||
      document.getElementById("monthExpense");
    if (!hasAnyDashboardMarker) {
      console.log(
        "updateDashboardStats: No dashboard elements present on this page, skipping updates."
      );
      return; // Hard exit
    }

    const attemptUpdate = (attempt = 0) => {
      try {
        console.log(
          `updateDashboardStats: Attempt ${attempt + 1} of ${maxRetries}`
        );

        // Make sure we have valid stats
        if (!this.stats || Object.keys(this.stats).length === 0) {
          console.log("updateDashboardStats: Recalculating stats");
          this.updateGlobalStats();
        }

        const stats = this.stats;
        console.log("updateDashboardStats: Using stats:", {
          monthlyBalance: stats.monthlyBalance,
          monthlyIncome: stats.monthlyIncome,
          monthlyExpense: stats.monthlyExpense,
        });

        // First ensure all required elements are present
        const dashboardElements = {
          dashboard: document.getElementById("dashboard"),
          dashboardBalance: document.getElementById("dashboardBalance"),
          monthIncome: document.getElementById("monthIncome"),
          monthExpense: document.getElementById("monthExpense"),
        };

        // Check if any required element is missing
        const missingElements = Object.entries(dashboardElements)
          .filter(([key, element]) => !element)
          .map(([key]) => key);

        if (missingElements.length > 0) {
          console.log(
            `updateDashboardStats: Missing elements: ${missingElements.join(
              ", "
            )}`
          );
          if (attempt < maxRetries - 1) {
            setTimeout(() => attemptUpdate(attempt + 1), retryDelay);
            return;
          }
          console.error(
            "updateDashboardStats: Failed to find all required elements after all attempts"
          );
          return;
        }

        // Check if we're actually on the dashboard
        if (!dashboardElements.dashboard.classList.contains("active")) {
          console.log("updateDashboardStats: Dashboard section not active");
          if (attempt < maxRetries - 1) {
            setTimeout(() => attemptUpdate(attempt + 1), retryDelay);
            return;
          }
          return;
        }

        // Try to find the critical element
        const dashboardBalance = document.getElementById("dashboardBalance");
        if (!dashboardBalance) {
          console.log(
            `updateDashboardStats: dashboardBalance element not found on attempt ${
              attempt + 1
            }`
          );
          if (attempt < maxRetries - 1) {
            setTimeout(() => attemptUpdate(attempt + 1), retryDelay);
            return;
          }
          console.error(
            "updateDashboardStats: Failed to find dashboardBalance after all attempts"
          );
          return;
        }

        // Update all dashboard elements
        let updateCount = 0;

        // Update each element with its corresponding value
        const updates = [
          {
            element: dashboardElements.dashboardBalance,
            value: stats.monthlyBalance,
          },
          {
            element: dashboardElements.monthIncome,
            value: stats.monthlyIncome,
          },
          {
            element: dashboardElements.monthExpense,
            value: stats.monthlyExpense,
          },
        ];

        updates.forEach(({ element, value }) => {
          const formattedValue = Utils.formatCurrency(value);
          element.textContent = formattedValue;
          updateCount++;
          console.log(
            `updateDashboardStats: Updated ${element.id} to ${formattedValue}`
          );
        });

        console.log(
          `updateDashboardStats: Successfully updated ${updateCount} elements`
        );
        return true; // Success
      } catch (error) {
        console.error(
          `updateDashboardStats: Error on attempt ${attempt + 1}:`,
          error
        );
        if (attempt < maxRetries - 1) {
          setTimeout(() => attemptUpdate(attempt + 1), retryDelay);
          return;
        }
        return false;
      }
    };

    // Start the update attempt
    attemptUpdate();
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
    this.updateHeaderUserInfo();
  },

  updateHeaderUserInfo() {
    // Update user name in both possible locations
    const userName = document.getElementById("userName");
    const headerUserName = document.getElementById("headerUserName");
    const greetingText = document.getElementById("greetingText");

    if (this.currentUser) {
      // Get user name from profile data or current user
      const profileData = this.currentUser.settings?.profile || {};
      const fullName =
        profileData.fullName || this.currentUser.name || "Pengguna";

      // Update both elements if they exist
      if (userName) {
        userName.textContent = fullName;
      }
      
      // Get current hour for greeting
      const currentHour = new Date().getHours();
      let greeting = "Selamat datang,";

      if (currentHour >= 5 && currentHour < 12) {
        greeting = "Selamat pagi,";
      } else if (currentHour >= 12 && currentHour < 17) {
        greeting = "Selamat siang,";
      } else if (currentHour >= 17 && currentHour < 21) {
        greeting = "Selamat sore,";
      } else {
        greeting = "Selamat malam,";
      }

      greetingText.textContent = greeting;
    }
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
    // Update main dashboard balance menggunakan helper function dengan retry
    this.updateBalanceDisplay();
  },

  calculateBalance() {
    // Menggunakan stats global untuk konsistensi
    return this.stats.monthlyBalance;
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
        <div class="budget-amount">${Utils.formatCurrency(
          stats.monthlyBudget
        )}</div>
      </div>
      <div class="budget-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${
            stats.budgetPercentage
          }%"></div>
        </div>
        <div class="progress-labels">
          <span class="progress-percent">${
            stats.budgetPercentage
          }% digunakan</span>
          <span class="progress-value">${Utils.formatCurrency(
            stats.monthlyExpense
          )} / ${Utils.formatCurrency(stats.monthlyBudget)}</span>
        </div>
      </div>
      <div class="budget-remaining ${
        stats.budgetRemaining < 0 ? "negative" : ""
      }">
        <span>Sisa: ${Utils.formatCurrency(stats.budgetRemaining)}</span>
      </div>
    `;
  },

  refreshBudgetDisplay() {
    // Comprehensive budget refresh for all pages
    console.log("Refreshing budget display...");

    // Force update global stats first
    this.updateGlobalStats();

    // Update different budget displays that might exist
    setTimeout(() => {
      this.updateBudget();
      this.updateBudgetStatus();

      // Only update specific dashboard stats without triggering full dashboard update
      this.updateDashboardStats();
    }, 50);
  },

  updateBudgetStatus() {
    const budgetStatus = document.querySelector(".budget-status");
    if (!budgetStatus) return;

    // Gunakan data dari stats global
    const stats = this.stats;

    let statusClass = "normal";
    let statusMessage = "Pengeluaran dalam batas normal";

    if (stats.budgetPercentage >= 90) {
      statusClass = "critical";
      statusMessage = "Anggaran hampir habis!";
    } else if (stats.budgetPercentage >= 75) {
      statusClass = "warning";
      statusMessage = "Pengeluaran mendekati batas anggaran";
    } else if (stats.budgetPercentage <= 25 && stats.monthlyBudget > 0) {
      statusClass = "good";
      statusMessage = "Pengeluaran sangat baik";
    }

    if (stats.monthlyBudget === 0) {
      statusMessage = "Anggaran belum diatur";
      statusClass = "unset";
    }

    budgetStatus.innerHTML = `
      <div class="status-indicator ${statusClass}"></div>
      <div class="status-message">${statusMessage}</div>
      <div class="status-details">
        <span>${stats.budgetPercentage}%</span>
        <span>${Utils.formatCurrency(
          stats.monthlyExpense
        )} / ${Utils.formatCurrency(stats.monthlyBudget)}</span>
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
    if (
      this._lastToast &&
      this._lastToast.message === message &&
      Date.now() - this._lastToast.time < 900
    ) {
      return; // suppress duplicate toast within 900ms
    }
    this._lastToast = { message, type, time: Date.now() };

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

  // Menampilkan form edit profil
  showEditProfileForm() {
    // Tampilkan modal untuk mengedit profil
    const profileData = this.currentUser.settings?.profile || {};

    // Buat modal dialog untuk mengedit profil
    const modalContent = `
      <div class="modal-header">
        <h2>Edit Profil</h2>
        <span class="close-modal" onclick="closeModal('editProfileModal')">&times;</span>
      </div>
      <div class="modal-body">
        <form id="editProfileForm">
          <div class="form-group">
            <label for="fullName">Nama Lengkap</label>
            <input type="text" id="fullName" name="fullName" value="${
              profileData.fullName || this.currentUser.name || ""
            }" required>
          </div>
          <div class="form-group">
            <label for="job">Pekerjaan</label>
            <input type="text" id="job" name="job" value="${
              profileData.job || ""
            }">
          </div>
          <div class="form-group">
            <label for="company">Perusahaan</label>
            <input type="text" id="company" name="company" value="${
              profileData.company || ""
            }">
          </div>
          <div class="form-group">
            <label for="phone">Nomor Telepon</label>
            <input type="tel" id="phone" name="phone" value="${
              profileData.phone || ""
            }">
          </div>
          <div class="form-group">
            <label for="address">Alamat</label>
            <textarea id="address" name="address" rows="2">${
              profileData.address || ""
            }</textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" onclick="closeModal('editProfileModal')">Batal</button>
            <button type="submit" class="btn-primary">Simpan</button>
          </div>
        </form>
      </div>
      </div>
    `;

    // Tambahkan modal ke DOM jika belum ada
    let modal = document.getElementById("editProfileModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "editProfileModal";
      modal.className = "modal";
      document.body.appendChild(modal);
    }

    modal.innerHTML = modalContent;

    // Tampilkan modal
    openModal("editProfileModal");

    // Tambahkan event listener untuk form submission
    document
      .getElementById("editProfileForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveProfileChanges();
      });
  },

  // Simpan perubahan profil
  saveProfileChanges() {
    const form = document.getElementById("editProfileForm");
    const formData = new FormData(form);

    const profileData = {
      fullName: formData.get("fullName"),
      job: formData.get("job"),
      company: formData.get("company"),
      phone: formData.get("phone"),
      address: formData.get("address"),
    };

    // Update user settings
    if (!this.currentUser.settings) {
      this.currentUser.settings = {};
    }

    this.currentUser.settings.profile = profileData;

    // Jika pengguna bukan tamu, simpan data secara permanen
    if (!this.currentUser.isGuest && Auth.updateUserSettings) {
      Auth.updateUserSettings({ profile: profileData });
    }

    // Update nama pengguna juga
    this.currentUser.name = profileData.fullName;

    // Simpan data pengguna
    localStorage.setItem("currentUser", JSON.stringify(this.currentUser));

    // Tutup modal
    closeModal("editProfileModal");

    // Update tampilan profil
    this.renderProfileContent();

    // Tampilkan pesan sukses
    this.showToast("Profil berhasil diperbarui!", "success");
  },

  renderProfileContent() {
    const profileContent = document.getElementById("profileContent");
    if (!profileContent || !this.currentUser) return;

    // Pastikan pengambilan data profil terkini
    const currentUserData = Auth.getCurrentUser() || this.currentUser;

    // Sync local user data dengan data dari Auth jika tersedia
    if (currentUserData && currentUserData.id === this.currentUser.id) {
      this.currentUser = currentUserData;
    }

    const stats = this.calculateUserStats();
    const recent = [...this.transactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);

    // Tentukan avatar dan badge berdasarkan provider
    let avatarContent = "";
    let providerBadge = "";
    let profilePicture = "";

    // Dapatkan user profile data
    const profileData = this.currentUser.settings?.profile || {};
    const userFullName =
      profileData.fullName || this.currentUser.name || "Pengguna";
    const userJob = profileData.job || "Pengguna";
    const userCompany = profileData.company || "";
    const userPhone = profileData.phone || "";
    const userAddress = profileData.address || "";

    // Tentukan avatar dan badge berdasarkan jenis pengguna
    if (this.currentUser.provider === "google") {
      // Cek jika ada profile picture dari Google
      if (this.currentUser.profilePicture) {
        avatarContent = `<img src="${this.currentUser.profilePicture}" alt="${userFullName}" />`;
      } else {
        avatarContent = `<i class="fab fa-google"></i>`;
      }

      providerBadge = `<span class="provider-badge google">
        <i class="fab fa-google"></i>
        Akun Google
      </span>`;
    } else {
      // Get the first letter of the name for the avatar
      const initial = userFullName.charAt(0).toUpperCase();
      avatarContent = initial;

      if (this.currentUser.isGuest) {
        providerBadge = `<span class="guest-badge">
          <i class="fas fa-user-clock"></i>
          Mode Tamu
        </span>`;
      } else {
        providerBadge = `<span class="provider-badge local">
          <i class="fas fa-user"></i>
          Akun Lokal
        </span>`;
      }
    }

    profileContent.innerHTML = `
      <div class="profile-container">
        <div class="profile-header">
          <div class="profile-avatar ${
            this.currentUser.provider === "google" ? "google-avatar" : ""
          }${this.currentUser.isGuest ? " guest-avatar" : ""}">
            ${avatarContent}
          </div>
          <div class="profile-info">
            <h2 class="profile-name">${userFullName}</h2>
            <p class="profile-email">${
              this.currentUser.email || "pengguna@tamu"
            }</p>
            ${providerBadge}
          </div>
        </div>
        
        <!-- User Information Card -->
        <div class="profile-user-info">
          <h3>Informasi Pengguna</h3>
          <div class="user-info-grid">
            <div class="info-item">
              <span class="info-label"><i class="fas fa-briefcase"></i> Pekerjaan:</span>
              <span class="info-value">${userJob || "Belum diatur"}</span>
            </div>
            ${
              userCompany
                ? `
            <div class="info-item">
              <span class="info-label"><i class="fas fa-building"></i> Perusahaan:</span>
              <span class="info-value">${userCompany}</span>
            </div>
            `
                : ""
            }
            ${
              userPhone
                ? `
            <div class="info-item">
              <span class="info-label"><i class="fas fa-phone"></i> Telepon:</span>
              <span class="info-value">${userPhone}</span>
            </div>
            `
                : ""
            }
            ${
              userAddress
                ? `
            <div class="info-item">
              <span class="info-label"><i class="fas fa-map-marker-alt"></i> Alamat:</span>
              <span class="info-value">${userAddress}</span>
            </div>
            `
                : ""
            }
            <div class="info-item">
              <span class="info-label"><i class="fas fa-calendar-check"></i> Bergabung:</span>
              <span class="info-value">${new Date(
                this.currentUser.createdAt
              ).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}</span>
            </div>
          </div>
          ${
            !this.currentUser.isGuest
              ? `
          <button class="btn-secondary btn-edit-profile" onclick="ExpenseTracker.showEditProfileForm()">
            <i class="fas fa-pencil-alt"></i> Edit Profil
          </button>
          `
              : `
          <div class="guest-info-note">
            <i class="fas fa-info-circle"></i> Buat akun tetap untuk menyimpan data profil
          </div>
          `
          }
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
      // Deduplikasi notifikasi di level NotificationSystem
      const notifKey = `${type}-${message}`;
      if (
        this._lastNotif === notifKey &&
        Date.now() - this._lastNotifTime < 1000
      ) {
        return; // abaikan notifikasi duplikat dalam 1 detik
      }
      this._lastNotif = notifKey;
      this._lastNotifTime = Date.now();

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
  if (window.app && typeof window.app.loadUserData === "function") {
    // Cegah eksekusi ganda dari event yang sama
    if (window.app._authHandling) return;
    window.app._authHandling = true;

    setTimeout(() => {
      // Instead of calling checkAuthState which might create a loop,
      // just load the user data and update UI
      window.app.loadUserData();
      window.app.updateGlobalStats();
      window.app.updateUI();
      window.app.updateHeaderUserInfo();

      // Reset flag setelah selesai
      window.app._authHandling = false;
    }, 100);
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
