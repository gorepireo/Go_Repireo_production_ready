import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBjX7u7VciLY0KdqjONmw0byKvORzF-dAM",
  authDomain: "gorepireo-b2969.firebaseapp.com",
  projectId: "gorepireo-b2969",
  storageBucket: "gorepireo-b2969.firebasestorage.app",
  messagingSenderId: "832687653476",
  appId: "1:832687653476:web:0b9bcf8d27e3a3b7489571",
  measurementId: "G-Q570ZNWBSL"
};

const app = initializeApp(firebaseConfig);

async function runDirectSeed() {
  console.log('🚀 AI Direct Seeding Starting for Default Firestore Database...');

  // Try default database first
  const db = getFirestore(app);

  try {
    // 1. Admin Account
    console.log('Creating users collection...');
    await setDoc(doc(db, 'users', 'admin_default'), {
      name: 'Go_Repireo Admin',
      email: 'gorepireo@gmail.com',
      role: 'admin',
      status: 'active',
      phone: '+91 9876543210',
      email_verified: true,
      created_at: new Date().toISOString()
    });

    // 2. Sample Worker User Account & Worker Application
    const sampleWorkerId = 'worker_sample_rahul';
    await setDoc(doc(db, 'users', sampleWorkerId), {
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
      created_at: new Date().toISOString()
    });

    console.log('Creating worker_applications collection...');
    await setDoc(doc(db, 'worker_applications', sampleWorkerId), {
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
      created_at: new Date().toISOString()
    });

    // 3. Sample Shopkeeper User & Shop Profile
    const sampleShopkeeperId = 'shopkeeper_sample_gupta';
    await setDoc(doc(db, 'users', sampleShopkeeperId), {
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
      created_at: new Date().toISOString()
    });

    console.log('Creating shops collection...');
    const shopRef = await addDoc(collection(db, 'shops'), {
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
      created_at: new Date().toISOString()
    });

    // 4. Sample Products for Shop
    console.log('Creating products collection...');
    await addDoc(collection(db, 'products'), {
      shop_id: shopRef.id,
      shop_name: 'Gupta Hardware & Electricals',
      title: 'Heavy Brass Water Tap Replacement Valve',
      category: 'Plumbing',
      price: 185,
      stock: 50,
      description: 'Durable leak-proof brass valve compatible with all bathroom and kitchen taps.',
      image_url: '/product_tap.png',
      created_at: new Date().toISOString()
    });

    await addDoc(collection(db, 'products'), {
      shop_id: shopRef.id,
      shop_name: 'Gupta Hardware & Electricals',
      title: 'High Durability Regulator Switch 240V',
      category: 'Electrician',
      price: 120,
      stock: 35,
      description: 'Standard fan regulator switch with surge protection.',
      image_url: '/product_switch.png',
      created_at: new Date().toISOString()
    });

    // 5. Sample Order Booking
    console.log('Creating orders collection...');
    await addDoc(collection(db, 'orders'), {
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
      created_at: new Date().toISOString()
    });

    // 6. Sample Customer Saved Address
    console.log('Creating user_addresses collection...');
    await addDoc(collection(db, 'user_addresses'), {
      user_id: 'customer_sample_id',
      user_email: 'customer.sample@gmail.com',
      address_line: 'House No. 42, Sanganer Tehsil, Jaipur',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302025',
      lat: 26.8124,
      lng: 75.8123,
      created_at: new Date().toISOString()
    });

    // 7. Sample Review & Rating
    console.log('Creating reviews collection...');
    await addDoc(collection(db, 'reviews'), {
      customer_email: 'customer.sample@gmail.com',
      worker_id: sampleWorkerId,
      rating: 5,
      comment: 'Excellent service! Arrived quickly and fixed the tap leak in 15 minutes.',
      created_at: new Date().toISOString()
    });

    // 8. Sample Realtime Chat Message
    console.log('Creating chats collection...');
    await addDoc(collection(db, 'chats'), {
      order_id: 'ORD-SAMPLE-1001',
      sender_id: 'customer_sample_id',
      receiver_id: sampleWorkerId,
      message: 'Hello, what time will you arrive for the tap repair?',
      created_at: new Date().toISOString()
    });

    console.log('🎉 ALL 9 FIRESTORE COLLECTIONS CREATED & SEEDED SUCCESSFULLY IN DEFAULT DATABASE!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during direct seed:', err);
    process.exit(1);
  }
}

runDirectSeed();
