import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserProfile, UserRole } from "@/lib/types/user";

export const UserService = {
  /**
   * Fetches a user profile from the `users` collection.
   */
  async getProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  /**
   * Creates a new user profile (usually called upon first sign-up).
   */
  async createProfile(uid: string, data: Partial<UserProfile> & { email: string; name: string; role?: UserRole }): Promise<void> {
    const docRef = doc(db, "users", uid);
    const payload: UserProfile = {
      uid,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      role: data.role || 'customer',
      profilePhoto: data.profilePhoto || null,
      addresses: [],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...data
    };
    await setDoc(docRef, payload, { merge: true });
  },

  /**
   * Updates an existing user profile.
   */
  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }
};
