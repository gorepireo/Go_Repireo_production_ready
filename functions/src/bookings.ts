import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { randomInt } from 'node:crypto';

const db = () => admin.firestore();
const timestamp = () => admin.firestore.FieldValue.serverTimestamp();
const roleOf = (request: any) => request.auth?.token?.role as string | undefined;
const requireRole = (request: any, ...roles: string[]) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required.');
  if (!roles.includes(roleOf(request) || '')) throw new HttpsError('permission-denied', 'This account cannot perform that action.');
  return request.auth.uid as string;
};

export const createBooking = onCall(async (request) => {
  const customerId = requireRole(request, 'customer');
  const data = request.data || {};
  const serviceId = String(data.serviceId || data.category || data.service_name || '').trim();
  const description = String(data.description || data.problem?.description || data.details?.description || '').trim();
  if (!serviceId || !description) throw new HttpsError('invalid-argument', 'Service and problem description are required.');
  const latitude = Number(data.latitude ?? data.lat ?? data.address?.latitude);
  const longitude = Number(data.longitude ?? data.lng ?? data.address?.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new HttpsError('invalid-argument', 'A valid service location is required.');
  }
  const ref = db().collection('bookings').doc();
  const startOtp = String(randomInt(1000, 10000));
  const completionOtp = String(randomInt(1000, 10000));
  const booking = {
    customerId,
    workerId: null,
    serviceId,
    serviceName: String(data.serviceName || data.service_name || serviceId),
    problemDescription: description.slice(0, 4000),
    formattedAddress: String(data.formattedAddress || data.address?.fullAddress || data.details?.address || ''),
    latitude,
    longitude,
    scheduleType: data.scheduleType === 'scheduled' || data.details?.bookingType === 'scheduled' ? 'scheduled' : 'immediate',
    scheduledAt: data.scheduledAt || null,
    status: 'requested',
    paymentStatus: 'pending',
    paymentMethod: data.paymentMethod === 'razorpay' || data.payment_method === 'online' ? 'razorpay' : 'cash',
    quotedAmountPaise: Math.max(0, Math.round(Number(data.amountPaise ?? (Number(data.total_price || 0) * 100)))),
    createdAt: timestamp(),
    updatedAt: timestamp(),
  };
  await db().runTransaction(async (tx) => {
    tx.create(ref, booking);
    tx.create(db().collection('bookingSecrets').doc(ref.id), { startOtp, completionOtp, createdAt: timestamp() });
    tx.create(ref.collection('events').doc(), {
      type: 'requested', actorId: customerId, actorRole: 'customer', createdAt: timestamp(),
    });
    tx.create(db().collection('notifications').doc(), {
      ownerId: customerId,
      bookingId: ref.id,
      title: 'Booking security codes',
      message: `Start OTP: ${startOtp}. Completion OTP: ${completionOtp}. Share each code only at the correct service stage.`,
      createdAt: timestamp(),
      readAt: null,
    });
  });
  return { bookingId: ref.id };
});

export const listEligibleBookings = onCall(async (request) => {
  const workerId = requireRole(request, 'worker');
  const worker = await db().collection('workers').doc(workerId).get();
  if (!worker.exists || worker.data()?.status !== 'approved' || worker.data()?.acceptingJobs !== true) {
    return { bookings: [] };
  }
  const serviceIds = Array.isArray(worker.data()?.serviceIds) ? worker.data()!.serviceIds : [];
  const snapshot = await db().collection('bookings').where('status', '==', 'requested')
    .orderBy('createdAt', 'desc').limit(20).get();
  return { bookings: snapshot.docs
    .filter((item) => serviceIds.includes(item.data().serviceId))
    .map((item) => ({ id: item.id, ...item.data() })) };
});

export const claimBooking = onCall(async (request) => {
  const workerId = requireRole(request, 'worker');
  const bookingId = String(request.data?.bookingId || '');
  if (!bookingId) throw new HttpsError('invalid-argument', 'bookingId is required.');
  const worker = await db().collection('workers').doc(workerId).get();
  if (!worker.exists || worker.data()?.status !== 'approved') throw new HttpsError('permission-denied', 'An approved worker account is required.');
  const ref = db().collection('bookings').doc(bookingId);
  await db().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) throw new HttpsError('not-found', 'Booking not found.');
    if (snapshot.data()?.status !== 'requested' || snapshot.data()?.workerId) {
      throw new HttpsError('failed-precondition', 'Booking is no longer available.');
    }
    tx.update(ref, {
      workerId,
      workerName: worker.data()?.fullName || 'Technician',
      workerAvatarUrl: worker.data()?.avatarUrl || null,
      workerRatingAverage: worker.data()?.ratingAverage || 0,
      workerRatingCount: worker.data()?.ratingCount || 0,
      status: 'assigned',
      assignedAt: timestamp(),
      updatedAt: timestamp(),
    });
    tx.set(ref.collection('events').doc(), { type: 'assigned', actorId: workerId, actorRole: 'worker', createdAt: timestamp() });
  });
  return { success: true };
});

const transitions: Record<string, string[]> = {
  assigned: ['enRoute', 'cancelled'],
  enRoute: ['arrived', 'cancelled'],
  arrived: ['inService', 'cancelled'],
  inService: ['awaitingCompletion', 'cancelled'],
  awaitingCompletion: ['completed', 'cancelled'],
  requested: ['cancelled'],
};

export const transitionBooking = onCall(async (request) => {
  const uid = requireRole(request, 'customer', 'worker', 'admin');
  const role = roleOf(request)!;
  const bookingId = String(request.data?.bookingId || '');
  const raw = request.data?.updates || {};
  const requestedStatus = String(raw.status || '');
  const statusMap: Record<string, string> = {
    pending: 'requested', worker_assigned: 'assigned', worker_arriving: 'enRoute',
    in_progress: 'inService', work_in_progress: 'inService', completed: 'completed', cancelled: 'cancelled',
  };
  const nextStatus = statusMap[requestedStatus] || requestedStatus;
  if (!bookingId || !nextStatus) throw new HttpsError('invalid-argument', 'bookingId and status are required.');
  const ref = db().collection('bookings').doc(bookingId);
  await db().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) throw new HttpsError('not-found', 'Booking not found.');
    const booking = snapshot.data()!;
    if (role !== 'admin' && uid !== booking.customerId && uid !== booking.workerId) throw new HttpsError('permission-denied', 'Not a booking participant.');
    if (!(transitions[booking.status] || []).includes(nextStatus) && role !== 'admin') {
      throw new HttpsError('failed-precondition', 'Invalid booking transition.');
    }
    tx.update(ref, { status: nextStatus, updatedAt: timestamp() });
    tx.set(ref.collection('events').doc(), { type: nextStatus, actorId: uid, actorRole: role, createdAt: timestamp() });
  });
  return { success: true };
});

export const updateWorkerAvailability = onCall(async (request) => {
  const uid = requireRole(request, 'worker');
  await db().collection('workers').doc(uid).update({
    online: request.data?.online === true,
    acceptingJobs: request.data?.acceptingJobs === true,
    updatedAt: timestamp(),
  });
  return { success: true };
});

export const updateWorkerLocation = onCall(async (request) => {
  const workerId = requireRole(request, 'worker');
  const bookingId = String(request.data?.bookingId || '');
  const latitude = Number(request.data?.latitude);
  const longitude = Number(request.data?.longitude);
  if (!bookingId || !Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new HttpsError('invalid-argument', 'A booking and valid coordinates are required.');
  }
  const booking = await db().collection('bookings').doc(bookingId).get();
  if (!booking.exists || booking.data()?.workerId !== workerId) throw new HttpsError('permission-denied', 'Worker is not assigned to this booking.');
  await db().collection('workerLocations').doc(workerId).set({
    workerId, activeBookingId: bookingId, latitude, longitude, updatedAt: timestamp(),
  }, { merge: true });
  return { success: true };
});

export const verifyBookingOtp = onCall(async (request) => {
  const workerId = requireRole(request, 'worker');
  const bookingId = String(request.data?.bookingId || '');
  const phase = String(request.data?.phase || '');
  const otp = String(request.data?.otp || '');
  if (!bookingId || !['start', 'completion'].includes(phase) || !/^\d{4}$/.test(otp)) {
    throw new HttpsError('invalid-argument', 'A booking, phase, and four-digit OTP are required.');
  }
  const bookingRef = db().collection('bookings').doc(bookingId);
  const secretRef = db().collection('bookingSecrets').doc(bookingId);
  await db().runTransaction(async (tx) => {
    const [bookingSnapshot, secretSnapshot] = await Promise.all([tx.get(bookingRef), tx.get(secretRef)]);
    if (!bookingSnapshot.exists || !secretSnapshot.exists) throw new HttpsError('not-found', 'Booking not found.');
    const bookingData = bookingSnapshot.data()!;
    if (bookingData.workerId !== workerId) throw new HttpsError('permission-denied', 'Worker is not assigned to this booking.');
    const expected = phase === 'start' ? secretSnapshot.data()!.startOtp : secretSnapshot.data()!.completionOtp;
    if (otp !== expected) throw new HttpsError('permission-denied', 'Incorrect OTP.');
    if (phase === 'start' && !['assigned', 'enRoute', 'arrived'].includes(bookingData.status)) {
      throw new HttpsError('failed-precondition', 'Booking cannot be started from its current state.');
    }
    if (phase === 'completion' && !['inService', 'awaitingCompletion'].includes(bookingData.status)) {
      throw new HttpsError('failed-precondition', 'Booking cannot be completed from its current state.');
    }
    const nextStatus = phase === 'start' ? 'inService' : 'completed';
    tx.update(bookingRef, {
      status: nextStatus,
      ...(phase === 'completion' && bookingData.paymentMethod === 'cash' ? { paymentStatus: 'paid' } : {}),
      updatedAt: timestamp(),
    });
    tx.set(bookingRef.collection('events').doc(), {
      type: nextStatus, actorId: workerId, actorRole: 'worker', createdAt: timestamp(),
    });
    tx.update(secretRef, { [phase === 'start' ? 'startUsedAt' : 'completionUsedAt']: timestamp() });
  });
  return { success: true };
});

export const updateWorkerSettings = onCall(async (request) => {
  const workerId = requireRole(request, 'worker');
  const fullName = String(request.data?.fullName || '').trim();
  const upiId = String(request.data?.upiId || '').trim();
  const bankDetails = String(request.data?.bankDetails || '').trim();
  if (fullName.length < 2 || fullName.length > 100 || upiId.length > 200 || bankDetails.length > 1000) {
    throw new HttpsError('invalid-argument', 'Worker settings contain invalid values.');
  }
  await Promise.all([
    db().collection('workers').doc(workerId).update({ fullName, updatedAt: timestamp() }),
    db().collection('workerPrivate').doc(workerId).set({
      workerId, upiId, bankDetails, updatedAt: timestamp(),
    }, { merge: true }),
  ]);
  return { success: true };
});
