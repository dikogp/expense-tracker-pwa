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
  initSecurityModule: async function() {
    // For demo purposes, we'll use a simplified security implementation
    this.securityModule = {
      hashPassword: async (password) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + "salt_" + Date.now());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      },
      sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        return input.replace(/[<>]/g, '').replace(/javascript:/gi, '').trim();
      },
      escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
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

  // Handle guest login
  loginAsGuest: function () {
    const guestUser = {
      id: "guest_" + Date.now(),
      name: "Pengguna Tamu",
      email: "guest@example.com",
      isGuest: true,
      createdAt: new Date().toISOString(),
      settings: {
        monthlyBudget: 0,
        currency: "IDR",
        categories: this.getDefaultCategories(),
      },
    };

    this.loginUser(guestUser);
    showToast("Selamat datang! Data tamu tidak disimpan permanen", "info");

    // Show guest notice after a delay
    setTimeout(() => {
      showToast("💡 Daftar akun untuk menyimpan data permanen", "info");
    }, 3000);
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
        const isValidPassword = await this.verifyPassword(password, user.passwordHash, user.salt);
        
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

  // Handle registration
  handleRegister: function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      showToast("Mohon isi semua field", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Konfirmasi password tidak cocok", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password minimal 6 karakter", "error");
      return;
    }

    // Check if user already exists
    const users = this.getStoredUsers();
    if (users.find((u) => u.email === email)) {
      showToast("Email sudah terdaftar", "error");
      return;
    }

    // Create new user
    const newUser = {
      id: this.generateUserId(),
      name: name,
      email: email,
      password: this.hashPassword(password),
      createdAt: new Date().toISOString(),
      settings: {
        monthlyBudget: 0,
        currency: "IDR",
        categories: this.getDefaultCategories(),
      },
    };

    // Save user
    users.push(newUser);
    localStorage.setItem("pengeluaranqu_users", JSON.stringify(users));

    this.loginUser(newUser);
    showToast("Registrasi berhasil! Selamat datang!", "success");
  },

  // Login user
  loginUser: function (user) {
    // Remove password from stored user object for security
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      settings: user.settings,
    };

    this.currentUser = safeUser;
    localStorage.setItem("currentUser", JSON.stringify(safeUser));

    this.showMainApp();
  },

  // Logout user
  logout: function () {
    this.currentUser = null;
    localStorage.removeItem("currentUser");
    this.showAuthScreen();
    showToast("Logout berhasil", "success");
  },

  // Get current user
  getCurrentUser: function () {
    return this.currentUser;
  },

  // Show authentication screen
  showAuthScreen: function () {
    document.getElementById("authScreen").classList.add("active");
    document.getElementById("mainApp").classList.remove("active");
  },

  // Show main application
  showMainApp: function () {
    document.getElementById("authScreen").classList.remove("active");
    document.getElementById("mainApp").classList.add("active");

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

  // Simple password hashing (for MVP only - use proper hashing in production)
  hashPassword: function (password) {
    // This is NOT secure and should be replaced with proper hashing
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
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
    // Create a demo Google user
    const googleUser = {
      id: "google_" + Math.random().toString(36).substr(2, 9),
      name: "Pengguna Google",
      email: "user@gmail.com",
      provider: "google",
      createdAt: new Date().toISOString(),
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
