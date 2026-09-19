import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const NotificationService = {
  async notifyUser(userId: string, title: string, message: string, link: string): Promise<void> {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      message,
      type: 'order',
      link,
      read: false,
      createdAt: serverTimestamp()
    });
  }
};
