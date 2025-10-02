// Enhanced Authentication System with Security Improvements

const Auth = {
  currentUser: null,
  sessionToken: null,
  securityModule: null,

  // Initialize authentication with security enhancements
  init: function () {
    // Import security module
    this.initSecurityModule();

    // Check if user is already logged in with valid session
    const savedUser = localStorage.getItem("currentUser");
    const sessionToken = sessionStorage.getItem("sessionToken");

    if (savedUser && sessionToken) {
      try {
        const userData = JSON.parse(savedUser);

        // Validate session token
        if (this.validateSession(sessionToken)) {
          this.currentUser = userData;
          this.sessionToken = sessionToken;
          this.showMainApp();
        } else {
          // Session expired, clear data
          this.clearSession();
          this.showAuthScreen();
        }
      } catch (error) {
        console.error("Error parsing saved user:", error);
        this.clearSession();
        this.showAuthScreen();
      }
    } else {
      this.showAuthScreen();
    }

    this.setupEventListeners();
  },

  // Initialize security module
  initSecurityModule: async function () {
    // For demo purposes, we'll use a simplified security implementation
    this.securityModule = {
      hashPassword: async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + "salt_" + Date.now());
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        return Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      },
      sanitizeInput: (input) => {
        if (typeof input !== "string") return input;
        return input
          .replace(/[<>]/g, "")
          .replace(/javascript:/gi, "")
          .trim();
      },
      escapeHtml: (text) => {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
      },
    };
  },

  // Setup event listeners for auth forms
  setupEventListeners: function () {
    const loginForm = document.getElementById("loginFormElement");
    const registerForm = document.getElementById("registerFormElement");

    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }

    if (registerForm) {
      registerForm.addEventListener("submit", this.handleRegister.bind(this));
    }
  },

  generateGuestId: function () {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `guest_${timestamp}${random}`;
  },

  // Handle guest login
  loginAsGuest: function () {
    const guestId = this.generateGuestId();
    const guestUser = {
      id: guestId,
      name: "Pengguna Tamu",
      email: `${guestId}@guest.pengeluaranqu.app`,
      isGuest: true,
      createdAt: new Date().toISOString(),
      settings: {
        monthlyBudget: 5000000, // Example budget
        currency: "IDR",
        categories: this.getDefaultCategories(),
        profile: {
          fullName: "Pengguna Tamu",
          job: "Explorer",
          company: "PWA Demo",
          phone: "081234567890",
          address: "Jl. Jend. Sudirman No. 52-53, Jakarta",
        },
        notifications: {
          enabled: true,
          lastRead: null,
        },
      },
    };

    this.loginUser(guestUser);

    // Redirect immediately after guest login
    window.location.href = "dashboard.html";
  },

  // Handle login with enhanced security
  handleLogin: async function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    let email = formData.get("email");
    let password = formData.get("password");

    // Input sanitization
    email = this.securityModule.sanitizeInput(email);
    password = this.securityModule.sanitizeInput(password);

    // Validation
    if (!email || !password) {
      showToast("Mohon isi semua field", "error");
      return;
    }

    try {
      // Check rate limiting
      this.checkLoginAttempts(email);

      // Get stored users
      const users = this.getStoredUsers();
      const user = users.find((u) => u.email === email);

      if (user) {
        // Verify password with enhanced hashing
        const isValidPassword = await this.verifyPassword(
          password,
          user.passwordHash,
          user.salt
        );

        if (isValidPassword) {
          this.recordLoginAttempt(email, true);
          this.loginUser(user);
          showToast("Login berhasil!", "success");
        } else {
          this.recordLoginAttempt(email, false);
          showToast("Email atau password salah", "error");
        }
      } else {
        this.recordLoginAttempt(email, false);
        showToast("Email atau password salah", "error");
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  },

  // Handle registration with enhanced security
  handleRegister: async function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    let name = formData.get("name");
    let email = formData.get("email");
    let password = formData.get("password");
    let confirmPassword = formData.get("confirmPassword");

    // Input sanitization
    name = this.securityModule.sanitizeInput(name);
    email = this.securityModule.sanitizeInput(email);
    password = this.securityModule.sanitizeInput(password);
    confirmPassword = this.securityModule.sanitizeInput(confirmPassword);

    // Enhanced validation
    if (!name || !email || !password || !confirmPassword) {
      showToast("Mohon isi semua field", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Konfirmasi password tidak cocok", "error");
      return;
    }

    // Strong password validation
    if (!this.isStrongPassword(password)) {
      showToast(
        "Password harus minimal 8 karakter, mengandung huruf besar, kecil, angka, dan simbol",
        "error"
      );
      return;
    }

    // Email validation
    if (!this.isValidEmail(email)) {
      showToast("Format email tidak valid", "error");
      return;
    }

    try {
      // Check if user already exists
      const users = this.getStoredUsers();
      if (users.find((u) => u.email === email)) {
        showToast("Email sudah terdaftar", "error");
        return;
      }

      // Generate secure password hash
      const salt = this.generateSalt();
      const passwordHash = await this.securityModule.hashPassword(
        password + salt
      );

      // Create new user with enhanced security
      const newUser = {
        id: this.generateUserId(),
        name: this.securityModule.escapeHtml(name),
        email: email.toLowerCase(),
        passwordHash: passwordHash,
        salt: salt,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        settings: {
          monthlyBudget: 0,
          currency: "IDR",
          categories: this.getDefaultCategories(),
          isPremium: false,
          premiumExpiry: null,
        },
      };

      // Save user
      users.push(newUser);
      localStorage.setItem("pengeluaranqu_users", JSON.stringify(users));

      this.loginUser(newUser);
      showToast("Registrasi berhasil! Selamat datang!", "success");
    } catch (error) {
      console.error("Registration error:", error);
      showToast("Terjadi kesalahan saat registrasi", "error");
    }
  },

  // Login user with enhanced session management
  loginUser: function (user) {
    // Generate secure session token
    this.sessionToken = this.generateSessionToken();

    // Create safe user object (remove sensitive data)
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: new Date().toISOString(),
      settings: user.settings,
      isPremium: user.settings?.isPremium || false,
    };

    this.currentUser = safeUser;

    // Redirect to dashboard after login
    window.location.href = "dashboard.html";
  },

  // Enhanced logout with session cleanup
  logout: function () {
    // Clear user data and session
    this.currentUser = null;
    this.sessionToken = null;

    // Remove stored data
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("sessionToken");

    // Clear any cached sensitive data
    this.clearSensitiveCache();

    this.showAuthScreen();
    showToast("Logout berhasil", "success");
  },

  // Clear sensitive cached data
  clearSensitiveCache: function () {
    // Clear session storage encryption keys
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("key_") || key.startsWith("cache_")) {
        sessionStorage.removeItem(key);
      }
    });
  },

  // Clear session data
  clearSession: function () {
    localStorage.removeItem("currentUser");
    sessionStorage.removeItem("sessionToken");
    this.currentUser = null;
    this.sessionToken = null;
  },

  // Get current user
  getCurrentUser: function () {
    return this.currentUser;
  },

  // Show authentication screen
  showAuthScreen: function () {
    if (window.location.pathname.endsWith('dashboard.html')) {
      window.location.href = 'login.html';
    } else {
      const authScreen = document.getElementById("authScreen");
      const mainApp = document.getElementById("mainApp");
      if (authScreen && mainApp) {
        authScreen.classList.add("active");
        mainApp.classList.remove("active");
      }
    }
  },

  // Show main application
  showMainApp: function () {
    const authScreen = document.getElementById("authScreen");
    const mainApp = document.getElementById("mainApp");

    if (authScreen && mainApp) {
      authScreen.classList.remove("active");
      mainApp.classList.add("active");
    }

    // Ensure budget data is synchronized before initialization
    if (window.app && window.app.budget && this.currentUser) {
      const thisMonth = new Date().toISOString().substring(0, 7);

      // Initialize settings if needed
      if (!this.currentUser.settings) {
        this.currentUser.settings = {};
      }

      // Sync budget data between the two sources
      if (window.app.budget[thisMonth] !== undefined) {
        // App budget takes precedence if it exists
        this.currentUser.settings.monthlyBudget = window.app.budget[thisMonth];
        localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
      } else if (this.currentUser.settings.monthlyBudget !== undefined) {
        // User settings as fallback
        window.app.budget[thisMonth] = this.currentUser.settings.monthlyBudget;
        localStorage.setItem(
          `budget_${this.currentUser.id}`,
          JSON.stringify(window.app.budget)
        );
      }
    }

    // Trigger user authenticated event
    document.dispatchEvent(new CustomEvent("user-authenticated"));
  },

  // Get stored users
  getStoredUsers: function () {
    try {
      const users = localStorage.getItem("pengeluaranqu_users");
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error("Error getting stored users:", error);
      return [];
    }
  },

  // Enhanced security methods
  generateSalt: function () {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },

  // Verify password against stored hash
  verifyPassword: async function (password, storedHash, salt) {
    try {
      const hashedPassword = await this.securityModule.hashPassword(
        password + salt
      );
      return hashedPassword === storedHash;
    } catch (error) {
      console.error("Password verification failed:", error);
      return false;
    }
  },

  // Strong password validation
  isStrongPassword: function (password) {
    if (password.length < 8) return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  },

  // Email validation
  isValidEmail: function (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Rate limiting methods
  checkLoginAttempts: function (email) {
    const key = `login_attempts_${email}`;
    const attempts = JSON.parse(
      localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}'
    );
    const now = Date.now();
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    // Reset attempts after lockout duration
    if (now - attempts.lastAttempt > lockoutDuration) {
      attempts.count = 0;
    }

    if (attempts.count >= maxAttempts) {
      const remainingTime = lockoutDuration - (now - attempts.lastAttempt);
      if (remainingTime > 0) {
        throw new Error(
          `Terlalu banyak percobaan login. Coba lagi dalam ${Math.ceil(
            remainingTime / 60000
          )} menit.`
        );
      }
    }

    return true;
  },

  recordLoginAttempt: function (email, success = false) {
    const key = `login_attempts_${email}`;
    const attempts = JSON.parse(
      localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}'
    );

    if (success) {
      localStorage.removeItem(key);
    } else {
      attempts.count++;
      attempts.lastAttempt = Date.now();
      localStorage.setItem(key, JSON.stringify(attempts));
    }
  },

  // Session management
  generateSessionToken: function () {
    const tokenData = {
      id: this.generateUserId(),
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    return btoa(JSON.stringify(tokenData));
  },

  validateSession: function (token) {
    try {
      const tokenData = JSON.parse(atob(token));
      return tokenData.expiresAt > Date.now();
    } catch (error) {
      return false;
    }
  },

  updateLastLogin: function (userId) {
    const users = this.getStoredUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date().toISOString();
      localStorage.setItem("pengeluaranqu_users", JSON.stringify(users));
    }
  },

  // Generate user ID
  generateUserId: function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Get default categories
  getDefaultCategories: function () {
    return {
      expense: {
        makanan: { name: "Makanan & Minuman", icon: "🍽️", color: "#FF5722" },
        transportasi: { name: "Transportasi", icon: "🚗", color: "#2196F3" },
        belanja: { name: "Belanja", icon: "🛒", color: "#4CAF50" },
        hiburan: { name: "Hiburan", icon: "🎬", color: "#9C27B0" },
        kesehatan: { name: "Kesehatan", icon: "🏥", color: "#F44336" },
        pendidikan: { name: "Pendidikan", icon: "📚", color: "#FF9800" },
        tagihan: { name: "Tagihan", icon: "💳", color: "#607D8B" },
        lainnya: { name: "Lainnya", icon: "📝", color: "#795548" },
      },
      income: {
        gaji: { name: "Gaji", icon: "💰", color: "#4CAF50" },
        freelance: { name: "Freelance", icon: "💻", color: "#2196F3" },
        bisnis: { name: "Bisnis", icon: "🏢", color: "#FF9800" },
        investasi: { name: "Investasi", icon: "📈", color: "#9C27B0" },
        hadiah: { name: "Hadiah", icon: "🎁", color: "#E91E63" },
        lainnya: { name: "Lainnya", icon: "💵", color: "#795548" },
      },
    };
  },

  // Update user settings
  updateUserSettings: function (newSettings) {
    if (this.currentUser) {
      this.currentUser.settings = {
        ...this.currentUser.settings,
        ...newSettings,
      };
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser));

      // Also update in users list
      const users = this.getStoredUsers();
      const userIndex = users.findIndex((u) => u.id === this.currentUser.id);
      if (userIndex !== -1) {
        users[userIndex].settings = this.currentUser.settings;
        localStorage.setItem("pengeluaranqu_users", JSON.stringify(users));
      }
    }
  },
};

// Auth UI functions (global scope for onclick handlers)
function showLogin() {
  document.getElementById("loginForm").classList.add("active");
  document.getElementById("registerForm").classList.remove("active");
}

function showRegister() {
  document.getElementById("loginForm").classList.remove("active");
  document.getElementById("registerForm").classList.add("active");
}

function loginAsGuest() {
  Auth.loginAsGuest();
}

function loginWithGoogle() {
  // Simulate Google login for demo purposes
  showToast("Sedang menghubungkan dengan Google...", "info");

  setTimeout(() => {
    // Create a demo Google user with more realistic Google profile data
    const googleUser = {
      id: "google_" + Math.random().toString(36).substr(2, 9),
      name: "Pengguna Google",
      email: "user@gmail.com",
      provider: "google",
      profilePicture: null, // Dalam implementasi nyata ini bisa berisi URL gambar profil
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      settings: {
        monthlyBudget: 5000000, // Default budget
        currency: "IDR",
        categories: Auth.getDefaultCategories(),
        profile: {
          fullName: "Pengguna Google",
          job: "Professional",
          company: "Google Inc",
          phone: "081234567890",
        },
        notifications: {
          enabled: true,
          lastRead: null,
        },
      },
    };

    // Store user data
    localStorage.setItem("currentUser", JSON.stringify(googleUser));

    // Show success message
    showToast("Berhasil masuk dengan Google!", "success");

    // Trigger authentication event
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("user-authenticated"));
    }, 500);
  }, 1500);
}

function registerWithGoogle() {
  // For MVP, show message that this will be implemented
  showToast("Fitur registrasi Google akan segera tersedia", "info");
}

function logout() {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    Auth.logout();
  }
}

// Global showToast function for authentication
function showToast(message, type = "success", duration = 4000) {
  try {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Pastikan toast container ada
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className =
        "fixed bottom-4 right-4 z-50 flex flex-col gap-2";
      document.body.appendChild(toastContainer);
    }

    // Tambahkan toast ke container
    toastContainer.appendChild(toast);

    // Hapus toast setelah durasi tertentu
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add("fade-out");
        setTimeout(() => {
          if (toast.parentElement) {
            toastContainer.removeChild(toast);
          }
        }, 300);
      }
    }, duration);
  } catch (error) {
    console.error("Error showing toast:", error);
  }
}

// Initialize authentication when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  Auth.init();
});
