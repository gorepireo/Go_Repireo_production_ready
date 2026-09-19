import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const assignWorker = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { orderId } = request.data;
  const workerId = request.auth.uid;
  const db = admin.firestore();

  // Validate worker role
  const userSnap = await db.collection('users').doc(workerId).get();
  if (!userSnap.exists || userSnap.data()?.role !== 'worker') {
    throw new HttpsError('permission-denied', 'Only workers can accept orders.');
  }

  const orderRef = db.collection('orders').doc(orderId);

  await db.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists) {
      throw new HttpsError('not-found', 'Order not found.');
    }

    const orderData = orderDoc.data();
    if (orderData?.status !== 'pending' && orderData?.status !== 'searching_worker') {
      throw new HttpsError('failed-precondition', 'Order is no longer available.');
    }

    transaction.update(orderRef, {
      workerId,
      status: 'worker_assigned',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  return { success: true };
});
