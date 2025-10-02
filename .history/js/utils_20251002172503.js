// Utility functions for Pengeluaranqu
const Utils = {
  // Format number to currency
  formatCurrency: function (amount, currency = "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  // Format date to locale string
  formatDate: function (date) {
    return new Date(date).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  },

  // Format date to simple string (DD/MM/YYYY)
  formatSimpleDate: function (date) {
    return new Date(date).toLocaleDateString("id-ID");
  },

  // Format datetime for input fields
  formatDateTimeForInput: function (date) {
    return new Date(date).toISOString().slice(0, 16);
  },

  // Generate unique ID
  generateId: function () {
    return "id_" + Math.random().toString(36).substr(2, 9);
  },

  // Validate amount
  validateAmount: function (amount) {
    return !isNaN(amount) && amount > 0;
  },

  // Truncate text with ellipsis
  truncateText: function (text, maxLength = 30) {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  },

  // Get current timestamp
  getCurrentTimestamp: function () {
    return new Date().toISOString();
  },

  // Deep clone object
  deepClone: function (obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Check if value is empty (null, undefined, empty string, empty array)
  isEmpty: function (value) {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    );
  },

  // Get percentage
  calculatePercentage: function (value, total) {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  },

  // Add delay (for animations, loading states, etc)
  delay: function (ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  // Format number with thousand separator
  formatNumber: function (number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  },

  // Sort array by date
  sortByDate: function (array, dateKey = "date", ascending = false) {
    return array.sort((a, b) => {
      const dateA = new Date(a[dateKey]);
      const dateB = new Date(b[dateKey]);
      return ascending ? dateA - dateB : dateB - dateA;
    });
  },

  // Calculate date difference in days
  daysBetweenDates: function (date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Validate email format
  isValidEmail: function (email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Safe parsing of JSON with error handling
  safeJSONParse: function (str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      return fallback;
    }
  },

  // Get date range for different periods
  getDateRange: function(period) {
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
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
  },
};

// Export as module if in Node environment, otherwise attach to window
if (typeof module !== "undefined" && module.exports) {
  module.exports = Utils;
} else {
  window.Utils = Utils;
}
