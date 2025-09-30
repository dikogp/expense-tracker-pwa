"use strict";

// Chart Management
const Charts = {
  categoryChart: null,
  trendChart: null,

  // Chart colors matching categories
  colors: {
    makanan: "#FF5722",
    transportasi: "#2196F3",
    belanja: "#4CAF50",
    hiburan: "#9C27B0",
    kesehatan: "#F44336",
    pendidikan: "#FF9800",
    tagihan: "#607D8B",
    lainnya: "#795548",
  },

  // Initialize charts
  init: function () {
    this.initCategoryChart();
    this.initTrendChart();
  },

  // Category pie chart
  initCategoryChart: function () {
    const ctx = document.getElementById("categoryChart").getContext("2d");

    this.categoryChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${Utils.formatCurrency(
                  value
                )} (${percentage}%)`;
              },
            },
          },
        },
        cutout: "60%",
        animation: {
          animateRotate: true,
          duration: 1000,
        },
      },
    });
  },

  // Trend line chart
  initTrendChart: function () {
    const ctx = document.getElementById("trendChart").getContext("2d");

    this.trendChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Pengeluaran Harian",
            data: [],
            borderColor: "#2196F3",
            backgroundColor: "rgba(33, 150, 243, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#2196F3",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
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
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Pengeluaran: ${Utils.formatCurrency(context.parsed.y)}`;
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Tanggal",
            },
            grid: {
              display: false,
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Jumlah (Rp)",
            },
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return Utils.formatCurrency(value);
              },
            },
          },
        },
        animation: {
          duration: 1000,
          easing: "easeInOutQuart",
        },
      },
    });
  },

  // Update category chart
  updateCategoryChart: function (period = "month") {
    const range = Utils.getDateRange(period);
    const expenses =
      window.app && window.app.transactions
        ? window.app.transactions.filter((t) => t.type === "expense")
        : [];
    const periodExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= range.start && expenseDate < range.end;
    });

    // Group by category
    const categoryTotals = {};
    periodExpenses.forEach((expense) => {
      categoryTotals[expense.category] =
        (categoryTotals[expense.category] || 0) + expense.amount;
    });

    // Prepare chart data
    const labels = [];
    const data = [];
    const colors = [];

    Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a) // Sort by amount descending
      .forEach(([category, total]) => {
        const categories =
          window.app && window.app.categories ? window.app.categories : {};
        const categoryInfo = categories[category] || {
          icon: "💰",
          name: category,
        };
        labels.push(`${categoryInfo.icon} ${categoryInfo.name}`);
        data.push(total);
        colors.push(this.colors[category] || "#9E9E9E");
      });

    // Update chart
    if (this.categoryChart) {
      this.categoryChart.data.labels = labels;
      this.categoryChart.data.datasets[0].data = data;
      this.categoryChart.data.datasets[0].backgroundColor = colors;
      this.categoryChart.update("active");
    }
  },

  // Update trend chart
  updateTrendChart: function (period = "month") {
    const range = Utils.getDateRange(period);
    const expenses =
      window.app && window.app.transactions
        ? window.app.transactions.filter((t) => t.type === "expense")
        : [];
    const periodExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= range.start && expenseDate < range.end;
    });

    // Group by date
    const dailyTotals = {};
    const days = this.getDaysInPeriod(range.start, range.end, period);

    // Initialize all days with 0
    days.forEach((day) => {
      dailyTotals[day] = 0;
    });

    // Sum expenses by date
    periodExpenses.forEach((expense) => {
      const dateKey = this.getDateKey(new Date(expense.timestamp), period);
      if (dailyTotals.hasOwnProperty(dateKey)) {
        dailyTotals[dateKey] += expense.amount;
      }
    });

    // Prepare chart data
    const labels = days.map((day) => this.formatDateLabel(day, period));
    const data = days.map((day) => dailyTotals[day]);

    // Update chart
    if (this.trendChart) {
      this.trendChart.data.labels = labels;
      this.trendChart.data.datasets[0].data = data;
      this.trendChart.update("active");
    }
  },

  // Helper function to get days in period
  getDaysInPeriod: function (startDate, endDate, period) {
    const days = [];
    const current = new Date(startDate);

    while (current < endDate) {
      days.push(this.getDateKey(current, period));

      // Increment based on period
      switch (period) {
        case "week":
          current.setDate(current.getDate() + 1);
          break;
        case "month":
          current.setDate(current.getDate() + 1);
          break;
        case "year":
          current.setMonth(current.getMonth() + 1);
          break;
        default:
          current.setDate(current.getDate() + 1);
      }
    }

    return days;
  },

  // Helper function to get date key
  getDateKey: function (date, period) {
    switch (period) {
      case "week":
      case "month":
        return date.toISOString().split("T")[0]; // YYYY-MM-DD
      case "year":
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`; // YYYY-MM
      default:
        return date.toISOString().split("T")[0];
    }
  },

  // Helper function to format date labels
  formatDateLabel: function (dateKey, period) {
    switch (period) {
      case "week":
        const weekDate = new Date(dateKey);
        return weekDate.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
        });
      case "month":
        const monthDate = new Date(dateKey);
        return monthDate.getDate().toString();
      case "year":
        const [year, month] = dateKey.split("-");
        const yearDate = new Date(year, month - 1);
        return yearDate.toLocaleDateString("id-ID", { month: "short" });
      default:
        return dateKey;
    }
  },

  // Update all charts
  updateCharts: function (period) {
    this.updateCategoryChart(period);
    this.updateTrendChart(period);
  },

  // Destroy charts (for cleanup)
  destroy: function () {
    if (this.categoryChart) {
      this.categoryChart.destroy();
      this.categoryChart = null;
    }

    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = null;
    }
  },

  // Resize charts
  resize: function () {
    if (this.categoryChart) {
      this.categoryChart.resize();
    }

    if (this.trendChart) {
      this.trendChart.resize();
    }
  },

  // Export chart as image
  exportChart: function (chartType, filename) {
    const chart =
      chartType === "category" ? this.categoryChart : this.trendChart;

    if (chart) {
      const url = chart.toBase64Image();
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  },

  // Animation helpers
  animateChart: function (chart, animationType = "fadeIn") {
    if (!chart) return;

    chart.options.animation = {
      duration: 1000,
      easing: "easeInOutQuart",
    };

    switch (animationType) {
      case "slideIn":
        chart.options.animation.onProgress = function (animation) {
          const ctx = chart.ctx;
          ctx.save();
          ctx.globalAlpha = animation.currentStep / animation.numSteps;
          ctx.restore();
        };
        break;
      case "bounce":
        chart.options.animation.easing = "easeOutBounce";
        break;
    }

    chart.update();
  },
};

// Global function to update charts (called from app.js)
function updateCharts() {
  const chartPeriodEl = document.getElementById("chartPeriod");
  const period = chartPeriodEl ? chartPeriodEl.value : "month";
  Charts.updateCharts(period);
}

// Initialize charts when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Wait for Chart.js to load
  if (typeof Chart !== "undefined") {
    Charts.init();
  } else {
    // Fallback: wait for Chart.js to load
    const checkChart = setInterval(() => {
      if (typeof Chart !== "undefined") {
        Charts.init();
        clearInterval(checkChart);
      }
    }, 100);
  }
});

// Handle window resize
window.addEventListener("resize", () => {
  setTimeout(() => {
    Charts.resize();
  }, 100);
});

// Export for use in other modules
if (typeof window !== "undefined") {
  window.Charts = Charts;
}
