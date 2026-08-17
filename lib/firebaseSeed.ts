import { rtdb, db } from './firebase';
import { ref, set, push } from 'firebase/database';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Seeds ALL 11+ Firebase Collections/Nodes:
 * Supports both Firebase Realtime Database (RTDB) and Cloud Firestore
 * Target Vercel Deployment Sync: 2026-08-18
 */
export async function seedFirestoreDatabase() {
  const status: any = { rtdb: false, firestore: false };

  const timestamp = new Date().toISOString();
  const sampleWorkerId = 'worker_sample_rahul';
  const sampleShopkeeperId = 'shopkeeper_sample_gupta';

  // 1. Seed Realtime Database (RTDB)
  try {
    console.log('Seeding Firebase Realtime Database (RTDB)...');

    // users
    await set(ref(rtdb, 'users/admin_default'), {
      name: 'Go_Repireo Admin',
      email: 'gorepireo@gmail.com',
      role: 'admin',
      status: 'active',
      phone: '+91 9876543210',
      email_verified: true,
      created_at: timestamp
    });

    await set(ref(rtdb, `users/${sampleWorkerId}`), {
      name: 'Rahul Sharma',
      email: 'rahul.plumber@repireo.com',
      role: 'worker',
      status: 'active',
      phone: '+91 9812345678',
      state: 'Rajasthan',
      district: 'Jaipur',
      pincode: '302025',
      area: 'Sanganer, Jaipur',
      lat: 26.8124,
      lng: 75.8123,
      email_verified: true,
      specializations: ['Plumbing', 'Repair & Services'],
      repair_description: 'Expert in tap leakage, concealed pipe repairs, and bath fitting installations.',
      category_tokens: ['plumbing', 'tap', 'leakage', 'pipe', 'bath', 'valve'],
      created_at: timestamp
    });

    await set(ref(rtdb, `users/${sampleShopkeeperId}`), {
      name: 'Gupta Hardware Store',
      email: 'guptahardware@repireo.com',
      role: 'shopkeeper',
      status: 'active',
      phone: '+91 9823456789',
      state: 'Rajasthan',
      district: 'Jaipur',
      pincode: '302025',
      area: 'Main Road, Sanganer, Jaipur',
      email_verified: true,
      created_at: timestamp
    });

    // worker_applications
    await set(ref(rtdb, `worker_applications/${sampleWorkerId}`), {
      app_id: sampleWorkerId,
      from_name: 'Rahul Sharma',
      email: 'rahul.plumber@repireo.com',
      mobile: '+91 9812345678',
      service: 'Plumbing, Repair & Services',
      experience: 6,
      other_skills: 'Tap repair, pipeline fitting, motor repair',
      specializations: ['Plumbing', 'Repair & Services'],
      category_tokens: ['plumbing', 'tap', 'leakage', 'pipe', 'bath', 'valve'],
      state: 'Rajasthan',
      district: 'Jaipur',
      pincode: '302025',
      address: 'Sanganer, Jaipur',
      status: 'approved',
      created_at: timestamp
    });

    // workers
    await set(ref(rtdb, `workers/${sampleWorkerId}`), {
      worker_id: sampleWorkerId,
      name: 'Rahul Sharma',
      email: 'rahul.plumber@repireo.com',
      phone: '+91 9812345678',
      specialization: 'Plumbing',
      city: 'Jaipur',
      lat: 26.8124,
      lng: 75.8123,
      rating: 4.9,
      status: 'available',
      created_at: timestamp
    });

    // shop_applications
    await set(ref(rtdb, `shop_applications/${sampleShopkeeperId}`), {
      app_id: sampleShopkeeperId,
      shop_name: 'Gupta Hardware & Electricals',
      owner_name: 'Rajesh Gupta',
      email: 'guptahardware@repireo.com',
      phone: '+91 9823456789',
      city: 'Jaipur',
      address: 'Main Road, Sanganer, Jaipur',
      status: 'approved',
      created_at: timestamp
    });

    // shops
    const shopRef = push(ref(rtdb, 'shops'));
    await set(shopRef, {
      shopkeeper_id: sampleShopkeeperId,
      shop_name: 'Gupta Hardware & Electricals',
      owner_name: 'Rajesh Gupta',
      category: 'Hardware & Electrical',
      city: 'Jaipur',
      address: 'Main Road, Sanganer, Jaipur',
      phone: '+91 9823456789',
      rating: 4.9,
      lat: 26.8150,
      lng: 75.8150,
      status: 'active',
      created_at: timestamp
    });

    // products
    const prod1 = push(ref(rtdb, 'products'));
    await set(prod1, {
      shop_id: shopRef.key,
      shop_name: 'Gupta Hardware & Electricals',
      title: 'Heavy Brass Water Tap Replacement Valve',
      category: 'Plumbing',
      price: 185,
      stock: 50,
      description: 'Durable leak-proof brass valve compatible with bathroom and kitchen taps.',
      image_url: '/product_tap.png',
      created_at: timestamp
    });

    // orders
    const orderRef = push(ref(rtdb, 'orders'));
    await set(orderRef, {
      service_name: 'Plumbing Service',
      category: 'plumbing',
      problem_description: 'Tap leakage in kitchen area',
      status: 'pending',
      total_price: 248,
      payment_method: 'cash',
      payment_status: 'pending',
      start_otp: '1234',
      completion_otp: '5678',
      address: 'Sanganer, Jaipur, Rajasthan, 302025',
      lat: 26.8124,
      lng: 75.8123,
      customer_email: 'customer.sample@gmail.com',
      assigned_worker_id: sampleWorkerId,
      created_at: timestamp
    });

    // order_live_location
    await set(ref(rtdb, `order_live_location/${orderRef.key}`), {
      order_id: orderRef.key,
      worker_id: sampleWorkerId,
      lat: 26.8124,
      lng: 75.8123,
      updated_at: timestamp
    });

    // user_addresses
    const addrRef = push(ref(rtdb, 'user_addresses'));
    await set(addrRef, {
      user_id: 'customer_sample_id',
      user_email: 'customer.sample@gmail.com',
      address_line: 'House No. 42, Sanganer Tehsil, Jaipur',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302025',
      lat: 26.8124,
      lng: 75.8123,
      created_at: timestamp
    });

    // messages (chats)
    const msgRef = push(ref(rtdb, 'messages'));
    await set(msgRef, {
      order_id: orderRef.key,
      sender_id: 'customer_sample_id',
      receiver_id: sampleWorkerId,
      text: 'Hello, what time will you arrive for the tap repair?',
      created_at: timestamp
    });

    // call_sessions
    const callRef = push(ref(rtdb, 'call_sessions'));
    await set(callRef, {
      order_id: orderRef.key,
      caller_id: 'customer_sample_id',
      receiver_id: sampleWorkerId,
      status: 'ended',
      created_at: timestamp
    });

    // push_subscriptions
    const pushSubRef = push(ref(rtdb, 'push_subscriptions'));
    await set(pushSubRef, {
      user_id: 'customer_sample_id',
      endpoint: 'https://fcm.googleapis.com/fcm/send/sample-token',
      role: 'user',
      created_at: timestamp
    });

    // reviews
    const revRef = push(ref(rtdb, 'reviews'));
    await set(revRef, {
      customer_email: 'customer.sample@gmail.com',
      worker_id: sampleWorkerId,
      rating: 5,
      comment: 'Excellent service! Arrived quickly and fixed the tap leak in 15 minutes.',
      created_at: timestamp
    });

    status.rtdb = true;
    console.log('Realtime Database seeded successfully!');
  } catch (rtdbErr: any) {
    console.warn('RTDB Seed Note:', rtdbErr.message);
    status.rtdbError = rtdbErr.message;
  }

  // 2. Seed Firestore if Native mode is enabled
  try {
    await setDoc(doc(db, 'users', 'admin_default'), {
      name: 'Go_Repireo Admin',
      email: 'gorepireo@gmail.com',
      role: 'admin',
      status: 'active',
      created_at: serverTimestamp()
    });
    status.firestore = true;
  } catch (fsErr: any) {
    console.warn('Firestore Seed Note:', fsErr.message);
    status.firestoreError = fsErr.message;
  }

  return {
    success: status.rtdb || status.firestore,
    message: status.rtdb 
      ? 'Successfully created and seeded all 11+ nodes in Firebase Realtime Database!' 
      : (status.firestore ? 'Seeded Firestore Native Database!' : 'Seeding attempted.'),
    status
  };
}
