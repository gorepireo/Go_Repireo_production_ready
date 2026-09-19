import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";

export const AuthService = {
  /**
   * Listen to Firebase Auth state changes.
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Sign out the current user.
   */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }
};
