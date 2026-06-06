const STORAGE_KEY = 'dermasmart_notifications';

export const NotificationModel = {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  },

  save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  },

  sendNotification(recipientRole, recipientId, title, content) {
    const list = this.getAll();
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      recipientRole, // 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST'
      recipientId,   // specific ID (e.g. 'pat-01', 'doc-01') or 'all'
      title,
      content,
      isRead: false,
    };
    list.unshift(newNotif);
    this.save(list);
    return newNotif;
  },

  markAsRead(id) {
    const list = this.getAll();
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], isRead: true };
      this.save(list);
    }
  },

  markAllAsRead(recipientRole, recipientId = null) {
    const list = this.getAll();
    const updated = list.map(n => {
      const matchRole = n.recipientRole === recipientRole;
      const matchId = !recipientId || n.recipientId === recipientId || n.recipientId === 'all';
      if (matchRole && matchId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.save(updated);
  }
};
