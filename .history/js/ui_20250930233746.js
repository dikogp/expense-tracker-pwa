"use strict";

// Modal Functions
window.openModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }
};

window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }
};

// UI Management and Interactions
const UI = {
  // Animation and transitions
  animateElement: function (element, animation, duration = 300) {
    return new Promise((resolve) => {
      element.style.animation = `${animation} ${duration}ms ease-in-out`;

      setTimeout(() => {
        element.style.animation = "";
        resolve();
      }, duration);
    });
  },

  // Smooth scrolling
  smoothScrollTo: function (element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
  },

  // Loading states
  showLoading: function (element, text = "Memuat...") {
    const originalContent = element.innerHTML;
    element.dataset.originalContent = originalContent;
    element.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>${text}</span>
            </div>
        `;
    element.classList.add("loading");
  },

  hideLoading: function (element) {
    const originalContent = element.dataset.originalContent;
    if (originalContent) {
      element.innerHTML = originalContent;
      delete element.dataset.originalContent;
    }
    element.classList.remove("loading");
  },

  // Form validation
  validateForm: function (form) {
    const inputs = form.querySelectorAll("input[required], select[required]");
    let isValid = true;

    inputs.forEach((input) => {
      if (!this.validateInput(input)) {
        isValid = false;
      }
    });

    return isValid;
  },

  validateInput: function (input) {
    const value = input.value.trim();
    const type = input.type;
    let isValid = true;
    let errorMessage = "";

    // Remove existing error
    this.clearInputError(input);

    // Required field check
    if (input.hasAttribute("required") && !value) {
      isValid = false;
      errorMessage = "Field ini wajib diisi";
    } else {
      // Type-specific validation
      switch (type) {
        case "number":
          const num = parseFloat(value);
          if (value && (isNaN(num) || num < 0)) {
            isValid = false;
            errorMessage = "Masukkan angka yang valid (minimal 0)";
          }
          // Additional check for amount field
          if (input.name === "amount" && value && num > 999999999) {
            isValid = false;
            errorMessage = "Jumlah terlalu besar";
          }
          break;
        case "date":
          if (value && !this.isValidDate(value)) {
            isValid = false;
            errorMessage = "Format tanggal tidak valid";
          }
          break;
        case "time":
          if (value && !this.isValidTime(value)) {
            isValid = false;
            errorMessage = "Format waktu tidak valid";
          }
          break;
      }
    }

    if (!isValid) {
      this.showInputError(input, errorMessage);
    }

    return isValid;
  },

  showInputError: function (input, message) {
    input.classList.add("error");

    let errorElement = input.parentNode.querySelector(".error-message");
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "error-message";
      input.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = message;
  },

  clearInputError: function (input) {
    input.classList.remove("error");
    const errorElement = input.parentNode.querySelector(".error-message");
    if (errorElement) {
      errorElement.remove();
    }
  },

  // Date and time utilities
  isValidDate: function (dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },

  isValidTime: function (timeString) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  },

  // Number formatting for input
  formatNumberInput: function (input) {
    // Don't format number inputs, let browser handle validation
    if (input.type === "number") {
      return;
    }

    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/[^\d]/g, "");
      if (value) {
        // Add thousand separators
        value = parseInt(value).toLocaleString("id-ID");
        e.target.value = value;
      }
    });

    input.addEventListener("blur", (e) => {
      // Convert back to number for form submission
      const numericValue = e.target.value.replace(/\./g, "");
      e.target.setAttribute("data-numeric-value", numericValue);
    });
  },

  // Responsive design helpers
  isMobile: function () {
    return window.innerWidth <= 768;
  },

  isTablet: function () {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  },

  isDesktop: function () {
    return window.innerWidth > 1024;
  },

  // Touch gestures
  setupSwipeGestures: function () {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    document.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    document.addEventListener("touchend", (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
    });
  },

  handleSwipeLeft: function () {
    // Switch to next tab
    const currentTab = AppState.currentTab;
    const tabs = ["dashboard", "add-expense", "history", "analytics"];
    const currentIndex = tabs.indexOf(currentTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    switchTab(tabs[nextIndex]);
  },

  handleSwipeRight: function () {
    // Switch to previous tab
    const currentTab = AppState.currentTab;
    const tabs = ["dashboard", "add-expense", "history", "analytics"];
    const currentIndex = tabs.indexOf(currentTab);
    const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
    switchTab(tabs[prevIndex]);
  },

  // Keyboard shortcuts
  setupKeyboardShortcuts: function () {
    document.addEventListener("keydown", (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.tagName === "SELECT"
      ) {
        return;
      }

      switch (e.key) {
        case "1":
          switchTab("dashboard");
          break;
        case "2":
          switchTab("add-expense");
          break;
        case "3":
          switchTab("history");
          break;
        case "4":
          switchTab("analytics");
          break;
        case "Escape":
          closeModal();
          break;
        case "Enter":
          if (e.ctrlKey || e.metaKey) {
            // Ctrl+Enter to submit form
            const activeForm = document.querySelector("form:focus-within");
            if (activeForm) {
              activeForm.requestSubmit();
            }
          }
          break;
      }
    });
  },

  // Accessibility improvements
  setupAccessibility: function () {
    // Add ARIA labels
    document.querySelectorAll(".nav-tab").forEach((tab, index) => {
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", tab.classList.contains("active"));
      tab.setAttribute(
        "tabindex",
        tab.classList.contains("active") ? "0" : "-1"
      );
    });

    document.querySelectorAll(".tab-content").forEach((content, index) => {
      content.setAttribute("role", "tabpanel");
      content.setAttribute(
        "aria-hidden",
        !content.classList.contains("active")
      );
    });

    // Keyboard navigation for tabs
    document.addEventListener("keydown", (e) => {
      if (e.target.classList.contains("nav-tab")) {
        let nextTab = null;

        switch (e.key) {
          case "ArrowLeft":
            nextTab =
              e.target.previousElementSibling ||
              e.target.parentNode.lastElementChild;
            break;
          case "ArrowRight":
            nextTab =
              e.target.nextElementSibling ||
              e.target.parentNode.firstElementChild;
            break;
          case "Home":
            nextTab = e.target.parentNode.firstElementChild;
            break;
          case "End":
            nextTab = e.target.parentNode.lastElementChild;
            break;
        }

        if (nextTab) {
          e.preventDefault();
          nextTab.focus();
          nextTab.click();
        }
      }
    });
  },

  // Performance optimization
  debounce: function (func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle: function (func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Lazy loading for images
  setupLazyLoading: function () {
    const images = document.querySelectorAll("img[data-src]");
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          observer.unobserve(img);
        }
      });
    });

    images.forEach((img) => imageObserver.observe(img));
  },

  // Print functionality
  setupPrintStyles: function () {
    const printButton = document.getElementById("printBtn");
    if (printButton) {
      printButton.addEventListener("click", () => {
        window.print();
      });
    }
  },

  // Theme management
  setupThemeToggle: function () {
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        this.toggleTheme();
      });
    }

    // Apply saved theme
    const savedTheme = localStorage.getItem("pengeluaranqu_theme");
    if (savedTheme) {
      document.body.classList.add(`theme-${savedTheme}`);
    }
  },

  toggleTheme: function () {
    const currentTheme = document.body.classList.contains("theme-dark")
      ? "dark"
      : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.body.classList.remove(`theme-${currentTheme}`);
    document.body.classList.add(`theme-${newTheme}`);

    localStorage.setItem("pengeluaranqu_theme", newTheme);
  },

  // Initialize all UI features
  init: function () {
    this.setupSwipeGestures();
    this.setupKeyboardShortcuts();
    this.setupAccessibility();
    this.setupLazyLoading();
    this.setupPrintStyles();
    this.setupThemeToggle();

    // Add input event listeners for validation
    document.addEventListener("input", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
        this.validateInput(e.target);
      }
    });

    // Add number formatting to amount inputs
    document.querySelectorAll('input[type="number"]').forEach((input) => {
      if (input.name === "amount") {
        this.formatNumberInput(input);
      }
    });

    // Handle window resize
    window.addEventListener(
      "resize",
      this.throttle(() => {
        // Update charts on resize
        if (typeof updateCharts === "function") {
          updateCharts();
        }
      }, 300)
    );
  },
};

// Export for use in other modules
if (typeof window !== "undefined") {
  window.UI = UI;
}

// Initialize UI when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  UI.init();
});
