import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { UserService } from "./user.service";
import { WorkerApplicationService } from "./workerApplication.service";

export const AdminService = {
  async approveWorker(applicationId: string, data: any): Promise<void> {
    // 1. Update user profile to active worker
    await UserService.updateProfile(applicationId, {
      role: 'worker',
      isActive: true
    });

    // 2. Transfer application to active workers collection
    const workerRef = doc(db, "workers", applicationId);
    await setDoc(workerRef, {
      uid: applicationId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'worker',
      services: data.services,
      verification: {
        status: 'approved',
        verifiedAt: serverTimestamp()
      },
      availability: { online: false, busy: false },
      rating: 5.0,
      reviewCount: 0,
      completedOrders: 0,
      earnings: { total: 0, pending: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 3. Mark application as approved
    await WorkerApplicationService.updateStatus(applicationId, 'approved');
  },

  async rejectWorker(applicationId: string): Promise<void> {
    await UserService.updateProfile(applicationId, {
      isActive: false
    });
    await WorkerApplicationService.updateStatus(applicationId, 'rejected');
  }
};
