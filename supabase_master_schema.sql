-- ====================================================================
-- GO_REPIREO MASTER SUPABASE POSTGRESQL SCHEMA (Project: ewyoqmpqqcntohdrmmsa)
-- Execute this entire script in Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'worker', 'shop', 'admin');
    CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
    CREATE TYPE order_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. USERS TABLE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'user',
    status TEXT DEFAULT 'active',
    avatar_url TEXT,
    state TEXT,
    district TEXT,
    pincode TEXT,
    area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. WORKERS (Technician Profiles)
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    experience_years INT DEFAULT 0,
    services TEXT[] DEFAULT '{}',
    category_tokens TEXT[] DEFAULT '{}',
    repair_description TEXT,
    status TEXT DEFAULT 'active',
    rating NUMERIC(3,2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    completed_jobs INT DEFAULT 0,
    current_lat NUMERIC(10,7),
    current_lng NUMERIC(10,7),
    is_online BOOLEAN DEFAULT true,
    state TEXT,
    district TEXT,
    pincode TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WORKER APPLICATIONS (Specialist Registration Queue)
CREATE TABLE IF NOT EXISTS public.worker_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    from_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT NOT NULL,
    service TEXT NOT NULL,
    experience INT DEFAULT 0,
    other_skills TEXT,
    specializations TEXT[] DEFAULT '{}',
    category_tokens TEXT[] DEFAULT '{}',
    status application_status DEFAULT 'pending',
    state TEXT,
    district TEXT,
    pincode TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SHOPS (Hardware Stores)
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_type TEXT,
    gst_number TEXT,
    status TEXT DEFAULT 'active',
    rating NUMERIC(3,2) DEFAULT 5.00,
    state TEXT,
    district TEXT,
    pincode TEXT,
    address TEXT,
    lat NUMERIC(10,7),
    lng NUMERIC(10,7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SHOP APPLICATIONS (Merchant Onboarding Queue)
CREATE TABLE IF NOT EXISTS public.shop_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    shop_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    email TEXT NOT NULL,
    mobile TEXT NOT NULL,
    business_type TEXT,
    gst_number TEXT,
    status application_status DEFAULT 'pending',
    state TEXT,
    district TEXT,
    pincode TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. PRODUCTS (Hardware Catalog)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock_quantity INT DEFAULT 1,
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ORDERS (Service Bookings & Supply Purchases)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL,
    shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
    item_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_method TEXT DEFAULT 'Cash on Service',
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    start_otp VARCHAR(6),
    completion_otp VARCHAR(6),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_address TEXT NOT NULL,
    customer_lat NUMERIC(10,7),
    customer_lng NUMERIC(10,7),
    scheduled_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ORDER TRACKING (Live GPS Logs)
CREATE TABLE IF NOT EXISTS public.order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
    lat NUMERIC(10,7) NOT NULL,
    lng NUMERIC(10,7) NOT NULL,
    speed NUMERIC(5,2),
    heading NUMERIC(5,2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. USER ADDRESSES (Saved Customer Locations)
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Home',
    address_text TEXT NOT NULL,
    lat NUMERIC(10,7),
    lng NUMERIC(10,7),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. REVIEWS (Ratings & Feedback)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL, -- 'worker' or 'shop'
    target_id UUID NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. NOTIFICATIONS (In-App Alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. TEMP OTPS (Email/SMS Verification Code Queue)
CREATE TABLE IF NOT EXISTS public.temp_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    phone TEXT,
    otp_code VARCHAR(6) NOT NULL,
    type TEXT DEFAULT 'verify',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. HIGH-PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_worker_id ON public.orders(worker_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);

-- 16. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temp_otps ENABLE ROW LEVEL SECURITY;

-- Grant Read & Manage Permissions for Authenticated Users
DROP POLICY IF EXISTS "Public read users" ON public.users;
CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert self" ON public.users;
CREATE POLICY "Users insert self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update self" ON public.users;
CREATE POLICY "Users update self" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public read workers" ON public.workers;
CREATE POLICY "Public read workers" ON public.workers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Workers manage self" ON public.workers;
CREATE POLICY "Workers manage self" ON public.workers FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read shops" ON public.shops;
CREATE POLICY "Public read shops" ON public.shops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Shops manage self" ON public.shops;
CREATE POLICY "Shops manage self" ON public.shops FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own orders" ON public.orders;
CREATE POLICY "Users manage own orders" ON public.orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage notifications" ON public.notifications;
CREATE POLICY "Users manage notifications" ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage addresses" ON public.user_addresses;
CREATE POLICY "Users manage addresses" ON public.user_addresses FOR ALL USING (true);

DROP POLICY IF EXISTS "Users manage otps" ON public.temp_otps;
CREATE POLICY "Users manage otps" ON public.temp_otps FOR ALL USING (true);
