import { db } from './firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Initializes and seeds initial Firestore Collections for Go_Repireo:
 * 1. users (Customers, Workers, Shopkeepers, Admin)
 * 2. orders (Service & Product Bookings)
 * 3. shops (Merchant Hardware & Tool Stores)
 * 4. products (Hardware Parts & Tools)
 * 5. user_addresses (Saved Customer Locations)
 * 6. chats (Realtime Support & Technician Chat)
 */
export async function seedFirestoreDatabase() {
  try {
    console.log('Starting Firestore database collection initialization...');

    // 1. Seed Admin User
    await setDoc(doc(db, 'users', 'admin_default'), {
      full_name: 'Go_Repireo Admin',
      email: 'gorepireo@gmail.com',
      role: 'admin',
      status: 'active',
      phone: '+91 9876543210',
      created_at: serverTimestamp()
    });

    // 2. Seed Sample Worker / Technician
    await setDoc(doc(db, 'users', 'worker_sample'), {
      full_name: 'Rahul Sharma (Senior Plumber)',
      email: 'rahul.plumber@repireo.com',
      role: 'worker',
      status: 'active',
      specialization: 'plumbing',
      phone: '+91 9812345678',
      city: 'Jaipur',
      lat: 26.9124,
      lng: 75.7873,
      rating: 4.9,
      completed_jobs: 142,
      created_at: serverTimestamp()
    });

    // 3. Seed Sample Shopkeeper
    await setDoc(doc(db, 'users', 'shop_sample'), {
      full_name: 'Gupta Hardware Store',
      email: 'guptahardware@repireo.com',
      role: 'shopkeeper',
      status: 'active',
      phone: '+91 9823456789',
      city: 'Jaipur',
      address: 'Shop 12, Main Market, Jaipur',
      created_at: serverTimestamp()
    });

    // 4. Seed Sample Service Order
    await addDoc(collection(db, 'orders'), {
      service_name: 'Plumbing Service',
      category: 'plumbing',
      problem_description: 'Tap leakage in kitchen',
      status: 'pending',
      total_price: 248,
      payment_method: 'cash',
      payment_status: 'pending',
      start_otp: '1234',
      completion_otp: '5678',
      address: 'Sanganer, Jaipur, Rajasthan',
      lat: 26.8124,
      lng: 75.8123,
      customer_email: 'customer.sample@gmail.com',
      created_at: serverTimestamp()
    });

    // 5. Seed Sample Hardware Shop
    await addDoc(collection(db, 'shops'), {
      shop_name: 'Gupta Hardware & Electricals',
      owner_name: 'Rajesh Gupta',
      category: 'hardware',
      city: 'Jaipur',
      address: 'Main Road, Sanganer, Jaipur',
      phone: '+91 9823456789',
      rating: 4.8,
      lat: 26.8150,
      lng: 75.8150,
      created_at: serverTimestamp()
    });

    // 6. Seed Sample Product
    await addDoc(collection(db, 'products'), {
      title: 'Brass Water Tap Replacement Valve',
      category: 'plumbing',
      price: 185,
      stock: 45,
      image_url: '/product_tap.png',
      shop_name: 'Gupta Hardware',
      created_at: serverTimestamp()
    });

    console.log('Firestore collections initialized successfully!');
    return { success: true, message: 'All collections created and seeded successfully.' };
  } catch (err: any) {
    console.error('Error seeding Firestore:', err);
    return { success: false, error: err.message };
  }
}
