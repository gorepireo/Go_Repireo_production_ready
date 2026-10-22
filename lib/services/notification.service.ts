export const NotificationService = {
  async notifyUser(_uid: string, _title: string, _message: string, _url?: string): Promise<void> {
    // Notifications are created by trusted backend operations under the verified rules.
  },
};
