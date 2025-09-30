/**
 * Premium Features Management for Pengeluaranqu PWA
 * Implements freemium model as per QA recommendations
 */

const PremiumFeatures = {
  // Feature limits for free users
  FREE_LIMITS: {
    maxCustomCategories: 5,
    maxTransactionHistory: 90, // days
    maxBudgets: 1,
    exportFormats: ["basic"],
    cloudSync: false,
    advancedReports: false,
    categoryBudgets: false,
    familySharing: false,
    customThemes: false,
  },

  // Premium features
  PREMIUM_FEATURES: {
    maxCustomCategories: -1, // unlimited
    maxTransactionHistory: -1, // unlimited
    maxBudgets: -1, // unlimited
    exportFormats: ["csv", "pdf", "excel"],
    cloudSync: true,
    advancedReports: true,
    familySharing: true,
    customThemes: true,
    prioritySupport: true,
    monthlyInsights: true,
    goalTracking: true,
  },

  // Check if user has premium access
  isPremiumUser: function (user = null) {
    if (!user) {
      user = Auth.getCurrentUser();
    }

    if (!user) return false;

    const isPremium = user.settings?.isPremium || false;
    const premiumExpiry = user.settings?.premiumExpiry;

    if (isPremium && premiumExpiry) {
      return new Date(premiumExpiry) > new Date();
    }

    return isPremium && !premiumExpiry; // Lifetime premium
  },

  // Check if feature is available for current user
  hasFeatureAccess: function (featureName) {
    const user = Auth.getCurrentUser();
    if (!user) return false;

    if (this.isPremiumUser(user)) {
      return this.PREMIUM_FEATURES[featureName] !== undefined;
    }

    // Check free user limits
    return this.checkFreeUserLimit(featureName);
  },

  // Check specific limits for free users
  checkFreeUserLimit: function (limitType, currentValue = 0) {
    const limit = this.FREE_LIMITS[limitType];

    if (limit === -1) return true; // Unlimited
    if (typeof limit === "boolean") return limit;

    return currentValue < limit;
  },

  // Get remaining quota for free users
  getRemainingQuota: function (limitType) {
    if (this.isPremiumUser()) {
      return -1; // Unlimited for premium users
    }

    const limit = this.FREE_LIMITS[limitType];
    if (limit === -1 || typeof limit === "boolean") return limit;

    // Calculate current usage based on limit type
    let currentUsage = 0;

    switch (limitType) {
      case "maxCustomCategories":
        currentUsage = this.getCurrentCustomCategoriesCount();
        break;
      case "maxTransactionHistory":
        currentUsage = this.getTransactionHistoryDays();
        break;
      case "maxBudgets":
        currentUsage = this.getCurrentBudgetsCount();
        break;
      default:
        return limit;
    }

    return Math.max(0, limit - currentUsage);
  },

  // Get current custom categories count
  getCurrentCustomCategoriesCount: function () {
    const user = Auth.getCurrentUser();
    if (!user || !user.settings || !user.settings.categories) return 0;

    const customCategories = Object.keys(
      user.settings.categories.expense || {}
    ).filter((key) => !this.isDefaultCategory(key));

    return customCategories.length;
  },

  // Check if category is default
  isDefaultCategory: function (categoryKey) {
    const defaultCategories = [
      "makanan",
      "transportasi",
      "belanja",
      "hiburan",
      "kesehatan",
      "pendidikan",
      "tagihan",
      "lainnya",
    ];
    return defaultCategories.includes(categoryKey);
  },

  // Get transaction history days
  getTransactionHistoryDays: function () {
    // This would typically check the oldest transaction
    // For now, return a simple calculation
    const transactions = Storage.loadExpenses();
    if (transactions.length === 0) return 0;

    const oldestTransaction = transactions.reduce((oldest, current) => {
      return new Date(oldest.date) < new Date(current.date) ? oldest : current;
    });

    const daysDiff = Math.ceil(
      (new Date() - new Date(oldestTransaction.date)) / (1000 * 60 * 60 * 24)
    );
    return daysDiff;
  },

  // Get current budgets count
  getCurrentBudgetsCount: function () {
    const user = Auth.getCurrentUser();
    if (!user || !user.settings) return 0;

    let budgetCount = 0;
    if (user.settings.monthlyBudget && user.settings.monthlyBudget > 0) {
      budgetCount++;
    }

    // Add category-specific budgets if they exist
    if (user.settings.categoryBudgets) {
      budgetCount += Object.keys(user.settings.categoryBudgets).length;
    }

    return budgetCount;
  },

  // Show premium upgrade prompt
  showPremiumPrompt: function (featureName, context = "") {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md mx-4">
        <div class="text-center">
          <div class="mb-4">
            <span class="text-4xl">⭐</span>
          </div>
          <h3 class="text-xl font-bold mb-2">Fitur Premium</h3>
          <p class="text-gray-600 mb-4">
            ${this.getFeatureDescription(featureName)}
          </p>
          <div class="mb-4">
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4">
              <h4 class="font-bold mb-2">Pengeluaranqu Premium</h4>
              <div class="text-sm opacity-90">
                ✨ Kategori unlimited<br>
                📊 Laporan lanjutan<br>
                ☁️ Sinkronisasi cloud<br>
                👨‍👩‍👧‍👦 Berbagi keluarga<br>
                🎨 Tema kustom<br>
                📈 Insight bulanan
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="PremiumFeatures.closePremiumPrompt()" 
                    class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">
              Nanti Saja
            </button>
            <button onclick="PremiumFeatures.showPricingPlans()" 
                    class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
              Upgrade Sekarang
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closePremiumPrompt();
      }
    });
  },

  // Get feature description
  getFeatureDescription: function (featureName) {
    const descriptions = {
      maxCustomCategories:
        "Buat kategori kustom tanpa batas untuk pencatatan yang lebih detail.",
      maxTransactionHistory:
        "Akses riwayat transaksi lengkap tanpa batasan waktu.",
      exportFormats:
        "Ekspor data ke berbagai format (CSV, PDF, Excel) untuk analisis lebih lanjut.",
      cloudSync: "Sinkronisasi data otomatis di semua perangkat Anda.",
      advancedReports: "Laporan mendalam dengan analisis tren dan prediksi.",
      familySharing: "Berbagi anggaran dan pencatatan dengan anggota keluarga.",
      customThemes: "Personalisasi tampilan dengan berbagai tema eksklusif.",
      default: "Fitur ini tersedia untuk pengguna premium.",
    };

    return descriptions[featureName] || descriptions.default;
  },

  // Close premium prompt
  closePremiumPrompt: function () {
    const modal = document.querySelector(
      ".fixed.inset-0.bg-black.bg-opacity-50"
    );
    if (modal) {
      modal.remove();
    }
  },

  // Show pricing plans
  showPricingPlans: function () {
    this.closePremiumPrompt();

    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="text-center mb-6">
          <h3 class="text-2xl font-bold mb-2">Pilih Paket Premium</h3>
          <p class="text-gray-600">Dapatkan akses ke semua fitur eksklusif</p>
        </div>
        
        <div class="grid md:grid-cols-2 gap-4 mb-6">
          <!-- Monthly Plan -->
          <div class="border-2 border-purple-200 rounded-lg p-4">
            <div class="text-center">
              <h4 class="font-bold text-lg mb-2">Bulanan</h4>
              <div class="mb-4">
                <span class="text-3xl font-bold">Rp 29.000</span>
                <span class="text-gray-600">/bulan</span>
              </div>
              <button onclick="PremiumFeatures.selectPlan('monthly')" 
                      class="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                Pilih Paket
              </button>
            </div>
          </div>
          
          <!-- Yearly Plan -->
          <div class="border-2 border-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 relative">
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm">
                Hemat 40%
              </span>
            </div>
            <div class="text-center">
              <h4 class="font-bold text-lg mb-2">Tahunan</h4>
              <div class="mb-2">
                <span class="text-gray-400 line-through">Rp 348.000</span>
              </div>
              <div class="mb-4">
                <span class="text-3xl font-bold">Rp 199.000</span>
                <span class="text-gray-600">/tahun</span>
              </div>
              <button onclick="PremiumFeatures.selectPlan('yearly')" 
                      class="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg">
                Pilih Paket
              </button>
            </div>
          </div>
        </div>
        
        <!-- Features List -->
        <div class="bg-gray-50 rounded-lg p-4 mb-4">
          <h5 class="font-bold mb-3">Yang Anda Dapatkan:</h5>
          <div class="space-y-2 text-sm">
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Kategori kustom unlimited
            </div>
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Riwayat transaksi tanpa batas
            </div>
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Ekspor ke CSV, PDF, Excel
            </div>
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Sinkronisasi cloud otomatis
            </div>
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Laporan dan analisis lanjutan
            </div>
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Berbagi dengan keluarga
            </div>
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Tema dan kustomisasi eksklusif
            </div>
            <div class="flex items-center">
              <span class="text-green-500 mr-2">✓</span>
              Dukungan prioritas
            </div>
          </div>
        </div>
        
        <div class="text-center">
          <button onclick="PremiumFeatures.closePremiumPrompt()" 
                  class="px-6 py-2 text-gray-600 hover:text-gray-800">
            Tutup
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on outside click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closePremiumPrompt();
      }
    });
  },

  // Select premium plan
  selectPlan: function (planType) {
    // Simulate payment process
    showToast("Mengarahkan ke sistem pembayaran...", "info");

    setTimeout(() => {
      // For demo purposes, we'll simulate successful payment
      this.simulateSuccessfulPayment(planType);
    }, 2000);
  },

  // Simulate successful premium upgrade
  simulateSuccessfulPayment: function (planType) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Calculate expiry date
    const now = new Date();
    let expiryDate;

    if (planType === "monthly") {
      expiryDate = new Date(now.setMonth(now.getMonth() + 1));
    } else {
      expiryDate = new Date(now.setFullYear(now.getFullYear() + 1));
    }

    // Update user settings
    const updatedSettings = {
      ...user.settings,
      isPremium: true,
      premiumExpiry: expiryDate.toISOString(),
      premiumPlan: planType,
      upgradeDate: new Date().toISOString(),
    };

    Auth.updateUserSettings(updatedSettings);

    this.closePremiumPrompt();
    showToast(
      "🎉 Selamat! Akun Anda telah diupgrade ke Premium!",
      "success",
      5000
    );

    // Trigger UI update
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("premium-status-changed"));
    }, 1000);
  },

  // Check and limit transaction history for free users
  enforceTransactionHistoryLimit: function (transactions) {
    if (this.isPremiumUser()) {
      return transactions;
    }

    const limit = this.FREE_LIMITS.maxTransactionHistory;
    if (limit === -1) return transactions;

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - limit);

    return transactions.filter(
      (transaction) => new Date(transaction.date) >= limitDate
    );
  },

  // Show premium status in UI
  updatePremiumStatusUI: function () {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const premiumIndicators = document.querySelectorAll(".premium-indicator");
    const premiumFeatures = document.querySelectorAll(".premium-feature");

    if (this.isPremiumUser(user)) {
      // Show premium indicators
      premiumIndicators.forEach((indicator) => {
        indicator.style.display = "block";
        indicator.innerHTML = "⭐ Premium";
        indicator.className += " text-yellow-600 font-bold";
      });

      // Enable premium features
      premiumFeatures.forEach((feature) => {
        feature.classList.remove("opacity-50", "cursor-not-allowed");
        feature.removeAttribute("disabled");
      });
    } else {
      // Hide premium indicators
      premiumIndicators.forEach((indicator) => {
        indicator.style.display = "none";
      });

      // Disable premium features
      premiumFeatures.forEach((feature) => {
        feature.classList.add("opacity-50", "cursor-not-allowed");
        feature.setAttribute("disabled", "true");
      });
    }
  },

  // Initialize premium features
  init: function () {
    // Update UI on load
    this.updatePremiumStatusUI();

    // Listen for premium status changes
    document.addEventListener("premium-status-changed", () => {
      this.updatePremiumStatusUI();
    });

    // Listen for user authentication
    document.addEventListener("user-authenticated", () => {
      setTimeout(() => {
        this.updatePremiumStatusUI();
      }, 500);
    });
  },
};

// Initialize premium features when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  PremiumFeatures.init();
});

// Global functions for onclick handlers
function showPremiumFeatures() {
  PremiumFeatures.showPricingPlans();
}

function checkPremiumFeature(featureName) {
  if (!PremiumFeatures.hasFeatureAccess(featureName)) {
    PremiumFeatures.showPremiumPrompt(featureName);
    return false;
  }
  return true;
}

// Export for use in other modules (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = PremiumFeatures;
}
