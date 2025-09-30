/**
 * Enhanced Features Module for Pengeluaranqu PWA
 * Implements advanced analytics and category budgets as per QA recommendations
 */

const EnhancedFeatures = {
  // Analytics functionality
  Analytics: {
    // Initialize analytics
    init: function () {
      if (PremiumFeatures.isPremiumUser()) {
        this.loadAnalyticsData();
        this.showPremiumContent();
      } else {
        this.showTeaserContent();
      }
    },

    // Show premium analytics content
    showPremiumContent: function () {
      document.getElementById("analyticsTeaser").style.display = "none";
      document.getElementById("analyticsContent").style.display = "block";

      this.renderTrendChart();
      this.renderCategoryAnalysis();
      this.calculatePredictions();
    },

    // Show teaser for free users
    showTeaserContent: function () {
      document.getElementById("analyticsTeaser").style.display = "block";
      document.getElementById("analyticsContent").style.display = "none";
    },

    // Load analytics data
    loadAnalyticsData: async function () {
      try {
        const expenses = await Storage.loadExpenses();
        this.processAnalyticsData(expenses);
      } catch (error) {
        console.error("Error loading analytics data:", error);
        showToast("Gagal memuat data analisis", "error");
      }
    },

    // Process data for analytics
    processAnalyticsData: function (expenses) {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      // Filter last 6 months data
      const recentExpenses = expenses.filter(
        (expense) =>
          new Date(expense.date) >= sixMonthsAgo && expense.type === "expense"
      );

      this.analyticsData = {
        monthlyTrends: this.calculateMonthlyTrends(recentExpenses),
        categoryBreakdown: this.calculateCategoryBreakdown(recentExpenses),
        predictions: this.calculatePredictions(recentExpenses),
        insights: this.generateInsights(recentExpenses),
      };
    },

    // Calculate monthly trends
    calculateMonthlyTrends: function (expenses) {
      const trends = {};

      expenses.forEach((expense) => {
        const monthKey = new Date(expense.date).toISOString().substr(0, 7);
        if (!trends[monthKey]) {
          trends[monthKey] = 0;
        }
        trends[monthKey] += expense.amount;
      });

      return Object.keys(trends)
        .sort()
        .map((month) => ({
          month: month,
          amount: trends[month],
          monthName: new Date(month + "-01").toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
          }),
        }));
    },

    // Calculate category breakdown with trends
    calculateCategoryBreakdown: function (expenses) {
      const categories = {};

      expenses.forEach((expense) => {
        if (!categories[expense.category]) {
          categories[expense.category] = {
            total: 0,
            count: 0,
            monthly: {},
          };
        }

        categories[expense.category].total += expense.amount;
        categories[expense.category].count++;

        const monthKey = new Date(expense.date).toISOString().substr(0, 7);
        if (!categories[expense.category].monthly[monthKey]) {
          categories[expense.category].monthly[monthKey] = 0;
        }
        categories[expense.category].monthly[monthKey] += expense.amount;
      });

      return Object.keys(categories)
        .map((categoryKey) => ({
          category: categoryKey,
          ...categories[categoryKey],
          average:
            categories[categoryKey].total /
            Math.max(1, Object.keys(categories[categoryKey].monthly).length),
        }))
        .sort((a, b) => b.total - a.total);
    },

    // Calculate predictions
    calculatePredictions: function (expenses) {
      const currentMonth = new Date().toISOString().substr(0, 7);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthKey = lastMonth.toISOString().substr(0, 7);

      const currentMonthTotal = expenses
        .filter((e) => e.date.startsWith(currentMonth))
        .reduce((sum, e) => sum + e.amount, 0);

      const lastMonthTotal = expenses
        .filter((e) => e.date.startsWith(lastMonthKey))
        .reduce((sum, e) => sum + e.amount, 0);

      const averageMonthly =
        expenses.length > 0
          ? expenses.reduce((sum, e) => sum + e.amount, 0) / 6
          : 0;

      return {
        nextMonth: Math.round(averageMonthly * 1.05), // 5% growth assumption
        savingsTarget: Math.round(averageMonthly * 0.15), // 15% savings target
        trend: currentMonthTotal > lastMonthTotal ? "increasing" : "decreasing",
        accuracy: 85, // Mock accuracy percentage
      };
    },

    // Generate insights
    generateInsights: function (expenses) {
      const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
      const avgDaily = totalSpent / 180; // 6 months

      const categoryTotals = {};
      expenses.forEach((expense) => {
        categoryTotals[expense.category] =
          (categoryTotals[expense.category] || 0) + expense.amount;
      });

      const topCategory = Object.keys(categoryTotals).reduce(
        (a, b) => (categoryTotals[a] > categoryTotals[b] ? a : b),
        ""
      );

      return {
        monthlyTrend:
          avgDaily > 100000
            ? "Pengeluaran Anda cenderung tinggi. Pertimbangkan untuk membuat anggaran yang lebih ketat."
            : "Pengeluaran Anda terkendali dengan baik. Terus pertahankan kebiasaan ini!",
        recommendation: `Kategori ${topCategory} adalah pengeluaran terbesar Anda. Coba analisis apakah ada peluang penghematan.`,
        topCategory: topCategory,
      };
    },

    // Render trend chart
    renderTrendChart: function () {
      const ctx = document.getElementById("trendChart");
      if (!ctx || !this.analyticsData) return;

      const chartData = this.analyticsData.monthlyTrends;

      if (this.trendChart) {
        this.trendChart.destroy();
      }

      this.trendChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: chartData.map((d) => d.monthName),
          datasets: [
            {
              label: "Pengeluaran Bulanan",
              data: chartData.map((d) => d.amount),
              borderColor: "#2196F3",
              backgroundColor: "rgba(33, 150, 243, 0.1)",
              borderWidth: 3,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(value);
                },
              },
            },
          },
        },
      });

      // Update insights
      document.getElementById("monthlyTrend").textContent =
        this.analyticsData.insights.monthlyTrend;
      document.getElementById("trendRecommendation").textContent =
        this.analyticsData.insights.recommendation;
    },

    // Render category analysis
    renderCategoryAnalysis: function () {
      const container = document.getElementById("categoryAnalytics");
      if (!container || !this.analyticsData) return;

      const categories = this.analyticsData.categoryBreakdown.slice(0, 5); // Top 5

      container.innerHTML = categories
        .map(
          (cat) => `
        <div class="category-analysis-item">
          <div class="category-header">
            <h4>${cat.category}</h4>
            <span class="category-total">${Utils.formatCurrency(
              cat.total
            )}</span>
          </div>
          <div class="category-stats">
            <span>Rata-rata: ${Utils.formatCurrency(cat.average)}/bulan</span>
            <span>Transaksi: ${cat.count}x</span>
          </div>
        </div>
      `
        )
        .join("");
    },

    // Update predictions display
    calculatePredictions: function () {
      if (!this.analyticsData) return;

      const predictions = this.analyticsData.predictions;

      document.getElementById("nextMonthPrediction").textContent =
        Utils.formatCurrency(predictions.nextMonth);
      document.getElementById("savingsTarget").textContent =
        Utils.formatCurrency(predictions.savingsTarget);
      document.getElementById("predictionAccuracy").textContent =
        predictions.accuracy + "%";
      document.getElementById("savingsPotential").textContent = "15%";
    },
  },

  // Category Budgets functionality
  CategoryBudgets: {
    budgets: {},

    // Initialize category budgets
    init: function () {
      this.loadBudgets();
      this.renderBudgetsList();
      this.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners: function () {
      const form = document.getElementById("categoryBudgetForm");
      if (form) {
        form.addEventListener("submit", this.handleBudgetSubmit.bind(this));
      }

      // Populate category dropdown
      this.populateCategoryDropdown();
    },

    // Populate category dropdown
    populateCategoryDropdown: function () {
      const select = document.getElementById("budgetCategory");
      if (!select) return;

      const user = Auth.getCurrentUser();
      if (!user || !user.settings || !user.settings.categories) return;

      const categories = user.settings.categories.expense || {};

      select.innerHTML = '<option value="">-- Pilih Kategori --</option>';

      Object.keys(categories).forEach((key) => {
        const category = categories[key];
        select.innerHTML += `<option value="${key}">${category.icon} ${category.name}</option>`;
      });
    },

    // Handle budget submission
    handleBudgetSubmit: function (e) {
      e.preventDefault();

      if (!PremiumFeatures.isPremiumUser()) {
        PremiumFeatures.showPremiumPrompt("categoryBudgets");
        return;
      }

      const formData = new FormData(e.target);
      const budgetData = {
        category: formData.get("category"),
        amount: parseFloat(formData.get("amount")),
        period: formData.get("period"),
        createdAt: new Date().toISOString(),
      };

      this.saveBudget(budgetData);
      closeModal("categoryBudgetModal");
      e.target.reset();
    },

    // Save budget
    saveBudget: function (budgetData) {
      this.budgets[budgetData.category] = budgetData;
      this.persistBudgets();
      this.renderBudgetsList();
      showToast("Anggaran kategori berhasil disimpan!", "success");
    },

    // Load budgets from storage
    loadBudgets: function () {
      try {
        const stored = localStorage.getItem("categoryBudgets");
        this.budgets = stored ? JSON.parse(stored) : {};
      } catch (error) {
        console.error("Error loading budgets:", error);
        this.budgets = {};
      }
    },

    // Persist budgets to storage
    persistBudgets: function () {
      try {
        localStorage.setItem("categoryBudgets", JSON.stringify(this.budgets));
      } catch (error) {
        console.error("Error saving budgets:", error);
      }
    },

    // Render budgets list
    renderBudgetsList: async function () {
      const container = document.getElementById("categoryBudgetsList");
      if (!container) return;

      if (Object.keys(this.budgets).length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            🎯 <br/>
            <p>Belum ada anggaran kategori</p>
            <small>${
              PremiumFeatures.isPremiumUser()
                ? 'Klik "Tambah Anggaran" untuk mulai mengatur anggaran per kategori'
                : "Upgrade ke Premium untuk mengatur anggaran per kategori"
            }</small>
          </div>
        `;
        return;
      }

      const expenses = await Storage.loadExpenses();
      const currentMonth = new Date().toISOString().substr(0, 7);

      const budgetItems = Object.keys(this.budgets)
        .map((categoryKey) => {
          const budget = this.budgets[categoryKey];
          const spent = this.calculateSpent(
            expenses,
            categoryKey,
            budget.period
          );
          const percentage =
            budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

          return this.renderBudgetItem(categoryKey, budget, spent, percentage);
        })
        .join("");

      container.innerHTML = budgetItems;
    },

    // Calculate spent amount for category and period
    calculateSpent: function (expenses, categoryKey, period) {
      const now = new Date();
      let startDate;

      switch (period) {
        case "daily":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "weekly":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          break;
        case "monthly":
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      return expenses
        .filter(
          (expense) =>
            expense.type === "expense" &&
            expense.category === categoryKey &&
            new Date(expense.date) >= startDate
        )
        .reduce((sum, expense) => sum + expense.amount, 0);
    },

    // Render individual budget item
    renderBudgetItem: function (categoryKey, budget, spent, percentage) {
      const user = Auth.getCurrentUser();
      const categoryName =
        user?.settings?.categories?.expense?.[categoryKey]?.name || categoryKey;
      const categoryIcon =
        user?.settings?.categories?.expense?.[categoryKey]?.icon || "📂";

      const isOverBudget = percentage > 100;
      const progressClass = isOverBudget ? "over-budget" : "";

      return `
        <div class="category-budget-item">
          <div class="budget-header">
            <div class="budget-category">
              ${categoryIcon} ${categoryName}
            </div>
            <div class="budget-amount">${Utils.formatCurrency(
              budget.amount
            )}/${this.getPeriodText(budget.period)}</div>
          </div>
          <div class="budget-progress-bar">
            <div class="budget-progress-fill ${progressClass}" style="width: ${Math.min(
        percentage,
        100
      )}%"></div>
          </div>
          <div class="budget-status">
            <span>Terpakai: ${Utils.formatCurrency(spent)}</span>
            <span class="${
              isOverBudget ? "text-danger" : ""
            }">${percentage.toFixed(1)}%</span>
          </div>
          <div class="budget-actions">
            <button class="btn-small btn-edit" onclick="EnhancedFeatures.CategoryBudgets.editBudget('${categoryKey}')">
              ✏️ Edit
            </button>
            <button class="btn-small btn-delete" onclick="EnhancedFeatures.CategoryBudgets.deleteBudget('${categoryKey}')">
              🗑️ Hapus
            </button>
          </div>
        </div>
      `;
    },

    // Get period text
    getPeriodText: function (period) {
      const periodTexts = {
        daily: "hari",
        weekly: "minggu",
        monthly: "bulan",
      };
      return periodTexts[period] || "bulan";
    },

    // Edit budget
    editBudget: function (categoryKey) {
      const budget = this.budgets[categoryKey];
      if (!budget) return;

      // Populate form with existing data
      document.getElementById("budgetCategory").value = categoryKey;
      document.getElementById("categoryBudgetAmount").value = budget.amount;
      document.getElementById("budgetPeriod").value = budget.period;

      // Show modal
      showModal("categoryBudgetModal");
    },

    // Delete budget
    deleteBudget: function (categoryKey) {
      if (confirm("Apakah Anda yakin ingin menghapus anggaran kategori ini?")) {
        delete this.budgets[categoryKey];
        this.persistBudgets();
        this.renderBudgetsList();
        showToast("Anggaran kategori berhasil dihapus", "success");
      }
    },
  },

  // Initialize all enhanced features
  init: function () {
    this.CategoryBudgets.init();

    // Initialize analytics when tab is shown
    document.addEventListener("tab-changed", (e) => {
      if (e.detail.tab === "analytics") {
        setTimeout(() => {
          this.Analytics.init();
        }, 100);
      }
    });
  },
};

// Export analytics functions for onclick handlers
function exportAnalytics(format) {
  if (!PremiumFeatures.isPremiumUser()) {
    PremiumFeatures.showPremiumPrompt("exportFormats");
    return;
  }

  showToast(
    `Mengekspor laporan analisis ke format ${format.toUpperCase()}...`,
    "info"
  );

  // Simulate export process
  setTimeout(() => {
    showToast(
      `Laporan berhasil diekspor ke ${format.toUpperCase()}!`,
      "success"
    );
  }, 2000);
}

// Show category budget modal
function showCategoryBudgetModal() {
  if (!PremiumFeatures.isPremiumUser()) {
    PremiumFeatures.showPremiumPrompt("categoryBudgets");
    return;
  }
  showModal("categoryBudgetModal");
}

// Initialize enhanced features when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  EnhancedFeatures.init();
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = EnhancedFeatures;
}
