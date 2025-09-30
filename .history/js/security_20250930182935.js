/**
 * Security Module for Pengeluaranqu PWA
 * Implements enhanced security measures as per QA recommendations
 */

const Security = {
  // Configuration
  config: {
    saltRounds: 12,
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Secure password hashing using Web Crypto API
  hashPassword: async function (password, salt = null) {
    if (!salt) {
      salt = crypto.getRandomValues(new Uint8Array(16));
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(password + Array.from(salt).join(""));

    // Use PBKDF2 for password hashing
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256
    );

    return {
      hash: Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      salt: Array.from(salt)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    };
  },

  // Verify password against hash
  verifyPassword: async function (password, storedHash, storedSalt) {
    try {
      const saltBytes = new Uint8Array(
        storedSalt.match(/.{2}/g).map((byte) => parseInt(byte, 16))
      );
      const result = await this.hashPassword(password, saltBytes);
      return result.hash === storedHash;
    } catch (error) {
      console.error("Password verification failed:", error);
      return false;
    }
  },

  // Input sanitization
  sanitizeInput: function (input) {
    if (typeof input !== "string") return input;

    return input
      .replace(/[<>]/g, "") // Remove potential HTML tags
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .trim();
  },

  // HTML escape for preventing XSS
  escapeHtml: function (text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  // Enhanced data encryption for sensitive storage
  encryptData: async function (data, key = null) {
    try {
      if (!key) {
        key = await this.generateEncryptionKey();
      }

      const encoder = new TextEncoder();
      const dataBytes = encoder.encode(JSON.stringify(data));
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        dataBytes
      );

      return {
        encrypted: Array.from(new Uint8Array(encryptedData))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
        iv: Array.from(iv)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
        keyId: await this.storeKey(key),
      };
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Data encryption failed");
    }
  },

  // Decrypt sensitive data
  decryptData: async function (encryptedData, iv, keyId) {
    try {
      const key = await this.retrieveKey(keyId);
      if (!key) throw new Error("Decryption key not found");

      const dataBytes = new Uint8Array(
        encryptedData.match(/.{2}/g).map((byte) => parseInt(byte, 16))
      );
      const ivBytes = new Uint8Array(
        iv.match(/.{2}/g).map((byte) => parseInt(byte, 16))
      );

      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBytes },
        key,
        dataBytes
      );

      const decoder = new TextDecoder();
      return JSON.parse(decoder.decode(decryptedData));
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Data decryption failed");
    }
  },

  // Generate encryption key
  generateEncryptionKey: async function () {
    return await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  },

  // Store encryption key securely (simplified for demo)
  storeKey: async function (key) {
    const keyId = this.generateKeyId();
    const exportedKey = await crypto.subtle.exportKey("raw", key);

    // In production, this should be stored in a secure key store
    sessionStorage.setItem(
      `key_${keyId}`,
      Array.from(new Uint8Array(exportedKey))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );

    return keyId;
  },

  // Retrieve stored encryption key
  retrieveKey: async function (keyId) {
    const keyData = sessionStorage.getItem(`key_${keyId}`);
    if (!keyData) return null;

    const keyBytes = new Uint8Array(
      keyData.match(/.{2}/g).map((byte) => parseInt(byte, 16))
    );

    return await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  },

  // Generate unique key ID
  generateKeyId: function () {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Rate limiting for login attempts
  checkLoginAttempts: function (email) {
    const key = `login_attempts_${email}`;
    const attempts = JSON.parse(
      localStorage.getItem(key) || '{"count": 0, "lastAttempt": 0}'
    );

    const now = Date.now();

    // Reset attempts after lockout duration
    if (now - attempts.lastAttempt > this.config.lockoutDuration) {
      attempts.count = 0;
    }

    if (attempts.count >= this.config.maxLoginAttempts) {
      const remainingTime =
        this.config.lockoutDuration - (now - attempts.lastAttempt);
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

  // Record login attempt
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

  // Generate secure session token
  generateSessionToken: function () {
    const tokenData = {
      id: this.generateTokenId(),
      createdAt: Date.now(),
      expiresAt: Date.now() + this.config.tokenExpiry,
    };

    return btoa(JSON.stringify(tokenData));
  },

  // Validate session token
  validateSessionToken: function (token) {
    try {
      const tokenData = JSON.parse(atob(token));
      return tokenData.expiresAt > Date.now();
    } catch (error) {
      return false;
    }
  },

  // Generate token ID
  generateTokenId: function () {
    return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  },

  // Content Security Policy helper
  enforceCSP: function () {
    // Create and inject CSP meta tag if not exists
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const cspMeta = document.createElement("meta");
      cspMeta.setAttribute("http-equiv", "Content-Security-Policy");
      cspMeta.setAttribute(
        "content",
        "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self'; " +
          "font-src 'self'; " +
          "object-src 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self';"
      );
      document.head.appendChild(cspMeta);
    }
  },

  // Initialize security measures
  init: function () {
    this.enforceCSP();

    // Clear sensitive data on page unload
    window.addEventListener("beforeunload", () => {
      // Clear session storage keys
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("key_")) {
          sessionStorage.removeItem(key);
        }
      });
    });

    console.log("Security module initialized");
  },
};

// Initialize security on load
document.addEventListener("DOMContentLoaded", () => {
  Security.init();
});

// Export for use in other modules (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = Security;
}
