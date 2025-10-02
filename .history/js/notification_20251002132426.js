// Notification System
const NotificationSystem = {
  notifications: [],
  maxNotifications: 50, // Batasi jumlah notifikasi yang disimpan

  init() {
    this.loadNotifications();
    this.setupEventListeners();
  },

  loadNotifications() {
    const saved = localStorage.getItem("userNotifications");
    if (saved) {
      this.notifications = JSON.parse(saved);
    }
  },

  saveNotifications() {
    // Batasi jumlah notifikasi yang disimpan
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(-this.maxNotifications);
    }
    localStorage.setItem(
      "userNotifications",
      JSON.stringify(this.notifications)
    );
    this.updateUI();
  },

  addNotification(type, message, amount = null) {
    const notification = {
      id: Date.now(),
      type, // 'transaction', 'profile', 'system'
      message,
      amount,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.notifications.unshift(notification);
    this.saveNotifications();
    this.showNotificationBadge();
  },

  markAsRead(notificationId) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  },

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.saveNotifications();
  },

  getUnreadCount() {
    return this.notifications.filter((n) => !n.read).length;
  },

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
  },

  showNotificationBadge() {
    // Notification badge has been removed from UI
    // This method is kept for compatibility but does nothing
    return;
  },

  formatNotificationTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  },

  updateUI() {
    const container = document.getElementById("notificationList");
    if (!container) return;

    container.innerHTML =
      this.notifications.length === 0
        ? `<div class="empty-state">
           📭<br>
           <p>Belum ada notifikasi</p>
         </div>`
        : this.notifications
            .map((notification) => this.createNotificationElement(notification))
            .join("");

    this.showNotificationBadge();
  },

  createNotificationElement(notification) {
    const timeAgo = this.formatNotificationTime(notification.timestamp);
    const unreadClass = notification.read ? "" : "unread";
    const amountHtml = notification.amount
      ? `<span class="notification-amount">${window.app.formatCurrency(
          notification.amount
        )}</span>`
      : "";

    return `
      <div class="notification-item ${unreadClass}" data-id="${
      notification.id
    }">
        <div class="notification-icon">
          ${this.getNotificationIcon(notification.type)}
        </div>
        <div class="notification-content">
          <div class="notification-message">${notification.message}</div>
          ${amountHtml}
          <div class="notification-time">${timeAgo}</div>
        </div>
      </div>
    `;
  },

  getNotificationIcon(type) {
    switch (type) {
      case "transaction":
        return "💰";
      case "profile":
        return "👤";
      case "system":
        return "⚙️";
      default:
        return "📝";
    }
  },

  setupEventListeners() {
    document.addEventListener("click", (e) => {
      if (e.target.closest(".notification-item")) {
        const item = e.target.closest(".notification-item");
        const id = parseInt(item.dataset.id);
        this.markAsRead(id);
      }
    });
  },
};

// Initialize the notification system
NotificationSystem.init();
