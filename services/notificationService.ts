import type { Notification } from '../types';

export const notificationService = {
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'review_request' | 'friend_request' | 'announcement' | 'alert',
    relatedBusinessId?: string
  ): Promise<Notification> {
    const notification: Notification = {
      id: crypto.randomUUID(),
      userId,
      title,
      message,
      type,
      relatedBusinessId,
      isRead: false,
      createdAt: Date.now()
    };

    // Save to localStorage (mock)
    const notifications = JSON.parse(localStorage.getItem('streetbites_notifications') || '[]');
    notifications.push(notification);
    localStorage.setItem('streetbites_notifications', JSON.stringify(notifications));

    // Trigger browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: 'https://via.placeholder.com/64?text=SB'
      });
    }

    return notification;
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    const notifications: Notification[] = JSON.parse(
      localStorage.getItem('streetbites_notifications') || '[]'
    );
    return notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async markAsRead(notificationId: string): Promise<void> {
    const notifications: Notification[] = JSON.parse(
      localStorage.getItem('streetbites_notifications') || '[]'
    );
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      localStorage.setItem('streetbites_notifications', JSON.stringify(notifications));
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    let notifications: Notification[] = JSON.parse(
      localStorage.getItem('streetbites_notifications') || '[]'
    );
    notifications = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem('streetbites_notifications', JSON.stringify(notifications));
  },

  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        return true;
      }
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    }
    return false;
  },

  async triggerReviewRequest(
    userId: string,
    businessName: string,
    businessId: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      '⭐ Értékelést szeretnél hagyni?',
      `Nem sokára elmész a ${businessName} közeléből. Szeretnél értékelést hagyni?`,
      'review_request',
      businessId
    );
  }
};
