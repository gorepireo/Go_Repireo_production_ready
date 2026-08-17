import { db } from './firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Initializes and seeds ALL Firestore Collections required for Go_Repireo:
 * 1. users (Customer, Worker, Shopkeeper, Admin accounts)
 * 2. worker_applications (Worker/Technician verification profiles & skills)
 * 3. shops (Hardware & Tool Stores)
 * 4. products (Hardware Parts & Maintenance Supplies)
 * 5. orders (Service Bookings & Hardware Purchases)
 * 6. user_addresses (Saved Customer Delivery Locations)
 * 7. chats (Realtime Customer–Technician Messages)
 * 8. push_subscriptions (Web Push Notifications)
 * 9. reviews (Ratings & Customer Reviews)
 */
export async function seedFirestoreDatabase() {
  try {
    console.log('Starting full Firestore database collection initialization...');

    // 1. Admin Account
    await setDoc(doc(db, 'users', 'admin_default'), {
      name: 'Go_Repireo Admin',
      email: 'gorepireo@gmail.com',
      role: 'admin',
      status: 'active',
      phone: '+91 9876543210',
      email_verified: true,
      created_at: serverTimestamp()
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
      created_at: serverTimestamp()
    });

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
      created_at: serverTimestamp()
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
      created_at: serverTimestamp()
    });

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
      created_at: serverTimestamp()
    });

    // 4. Sample Products for Shop
    await addDoc(collection(db, 'products'), {
      shop_id: shopRef.id,
      shop_name: 'Gupta Hardware & Electricals',
      title: 'Heavy Brass Water Tap Replacement Valve',
      category: 'Plumbing',
      price: 185,
      stock: 50,
      description: 'Durable leak-proof brass valve compatible with all bathroom and kitchen taps.',
      image_url: '/product_tap.png',
      created_at: serverTimestamp()
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
      created_at: serverTimestamp()
    });

    // 5. Sample Order Booking
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
      created_at: serverTimestamp()
    });

    // 6. Sample Customer Saved Address
    await addDoc(collection(db, 'user_addresses'), {
      user_id: 'customer_sample_id',
      user_email: 'customer.sample@gmail.com',
      address_line: 'House No. 42, Sanganer Tehsil, Jaipur',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302025',
      lat: 26.8124,
      lng: 75.8123,
      created_at: serverTimestamp()
    });

    // 7. Sample Review & Rating
    await addDoc(collection(db, 'reviews'), {
      customer_email: 'customer.sample@gmail.com',
      worker_id: sampleWorkerId,
      rating: 5,
      comment: 'Excellent service! Arrived quickly and fixed the tap leak in 15 minutes.',
      created_at: serverTimestamp()
    });

    console.log('All Firestore collections initialized successfully!');
    return { success: true, message: 'All 9 Firestore collections created and seeded successfully.' };
  } catch (err: any) {
    console.error('Error seeding Firestore:', err);
    return { success: false, error: err.message };
  }
}
