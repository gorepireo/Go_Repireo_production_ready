import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBjX7u7VciLY0KdqjONmw0byKvORzF-dAM",
  authDomain: "gorepireo-b2969.firebaseapp.com",
  projectId: "gorepireo-b2969",
  storageBucket: "gorepireo-b2969.firebasestorage.app",
  messagingSenderId: "832687653476",
  appId: "1:832687653476:web:0b9bcf8d27e3a3b7489571",
  measurementId: "G-Q570ZNWBSL",
  databaseURL: "https://gorepireo-b2969-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);

async function seedRealtimeDatabase() {
  console.log('🚀 AI Direct Seeding Starting for Firebase Realtime Database: https://gorepireo-b2969-default-rtdb.asia-southeast1.firebasedatabase.app ...');

  try {
    const timestamp = new Date().toISOString();

    // 1. users
    console.log('Seeding users node...');
    await set(ref(rtdb, 'users/admin_default'), {
      name: 'Go_Repireo Admin',
      email: 'gorepireo@gmail.com',
      role: 'admin',
      status: 'active',
      phone: '+91 9876543210',
      email_verified: true,
      created_at: timestamp
    });

    const sampleWorkerId = 'worker_sample_rahul';
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

    const sampleShopkeeperId = 'shopkeeper_sample_gupta';
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

    // 2. worker_applications
    console.log('Seeding worker_applications node...');
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

    // 3. workers
    console.log('Seeding workers node...');
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

    // 4. shop_applications
    console.log('Seeding shop_applications node...');
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

    // 5. shops
    console.log('Seeding shops node...');
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

    // 6. products
    console.log('Seeding products node...');
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

    const prod2 = push(ref(rtdb, 'products'));
    await set(prod2, {
      shop_id: shopRef.key,
      shop_name: 'Gupta Hardware & Electricals',
      title: 'High Durability Regulator Switch 240V',
      category: 'Electrician',
      price: 120,
      stock: 35,
      description: 'Standard fan regulator switch with surge protection.',
      image_url: '/product_switch.png',
      created_at: timestamp
    });

    // 7. orders
    console.log('Seeding orders node...');
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

    // 8. order_live_location
    console.log('Seeding order_live_location node...');
    await set(ref(rtdb, `order_live_location/${orderRef.key}`), {
      order_id: orderRef.key,
      worker_id: sampleWorkerId,
      lat: 26.8124,
      lng: 75.8123,
      updated_at: timestamp
    });

    // 9. user_addresses
    console.log('Seeding user_addresses node...');
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

    // 10. messages (chats)
    console.log('Seeding messages node...');
    const msgRef = push(ref(rtdb, 'messages'));
    await set(msgRef, {
      order_id: orderRef.key,
      sender_id: 'customer_sample_id',
      receiver_id: sampleWorkerId,
      text: 'Hello, what time will you arrive for the tap repair?',
      created_at: timestamp
    });

    // 11. call_sessions
    console.log('Seeding call_sessions node...');
    const callRef = push(ref(rtdb, 'call_sessions'));
    await set(callRef, {
      order_id: orderRef.key,
      caller_id: 'customer_sample_id',
      receiver_id: sampleWorkerId,
      status: 'ended',
      created_at: timestamp
    });

    // 12. push_subscriptions
    console.log('Seeding push_subscriptions node...');
    const pushSubRef = push(ref(rtdb, 'push_subscriptions'));
    await set(pushSubRef, {
      user_id: 'customer_sample_id',
      endpoint: 'https://fcm.googleapis.com/fcm/send/sample-token',
      role: 'user',
      created_at: timestamp
    });

    // 13. reviews
    console.log('Seeding reviews node...');
    const revRef = push(ref(rtdb, 'reviews'));
    await set(revRef, {
      customer_email: 'customer.sample@gmail.com',
      worker_id: sampleWorkerId,
      rating: 5,
      comment: 'Excellent service! Arrived quickly and fixed the tap leak in 15 minutes.',
      created_at: timestamp
    });

    console.log('🎉 SUCCESS! ALL 11+ NODES CREATED AND SEEDED IN FIREBASE REALTIME DATABASE!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Realtime Database:', err);
    process.exit(1);
  }
}

seedRealtimeDatabase();
