import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const createOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to create an order.');
  }

  const data = request.data;
  const db = admin.firestore();

  // Validate incoming data here
  if (!data.serviceId || !data.problem) {
    throw new HttpsError('invalid-argument', 'Missing required order fields.');
  }

  const orderNumber = `GR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const orderData = {
    orderNumber,
    customerId: request.auth.uid,
    workerId: null,
    serviceId: data.serviceId,
    problem: data.problem,
    address: data.address,
    schedule: data.schedule || { type: 'immediate', scheduledAt: admin.firestore.FieldValue.serverTimestamp() },
    pricing: data.pricing || {
      inspectionFee: 150,
      travelFee: 0,
      serviceCharge: 0,
      discount: 0,
      tax: 0,
      total: 150
    },
    payment: {
      method: 'pending',
      status: 'pending'
    },
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const orderRef = await db.collection('orders').add(orderData);

  return { orderId: orderRef.id, orderNumber };
});
