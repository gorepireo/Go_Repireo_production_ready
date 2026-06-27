-- Fixes for RLS Security Issues (Tightening to Authenticated Users)

-- Issue 1: public.orders
DROP POLICY IF EXISTS "Enable all access for anonymous" ON public.orders;
CREATE POLICY "Enable all access for authenticated" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Issue 2: public.shops
DROP POLICY IF EXISTS "Enable all access for anonymous" ON public.shops;
CREATE POLICY "Enable all access for authenticated" ON public.shops FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Issue 4: public.users
DROP POLICY IF EXISTS "Enable all access for anonymous" ON public.users;
CREATE POLICY "Enable all access for authenticated" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Issue 5: public.projects
DROP POLICY IF EXISTS "Enable read for everyone" ON public.projects;
CREATE POLICY "Enable read for authenticated" ON public.projects FOR SELECT TO authenticated USING (true);

-- Issue 6: public.worker_applications
DROP POLICY IF EXISTS "Enable all access for anonymous" ON public.worker_applications;
CREATE POLICY "Enable all access for authenticated" ON public.worker_applications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Issue 8: public.workers
DROP POLICY IF EXISTS "Enable all access for all" ON public.workers;
CREATE POLICY "Enable all access for authenticated" ON public.workers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Issue 9: public.shop_applications
DROP POLICY IF EXISTS "Enable all access for anonymous" ON public.shop_applications;
CREATE POLICY "Enable all access for authenticated" ON public.shop_applications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Issue 10: public.contacts
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.contacts;
CREATE POLICY "Enable insert for authenticated" ON public.contacts FOR INSERT TO authenticated WITH CHECK (true);

-- Issue 11: public.shop_items
DROP POLICY IF EXISTS "Enable all access for anonymous" ON public.shop_items;
CREATE POLICY "Enable all access for authenticated" ON public.shop_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Issue 13: public.shop_sales
DROP POLICY IF EXISTS "Enable all access for anonymous" ON public.shop_sales;
CREATE POLICY "Enable all access for authenticated" ON public.shop_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Fixes for tables with RLS completely disabled
-- Issue 3: order_tracking
ALTER TABLE public.order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_tracking FORCE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated" ON public.order_tracking FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Issue 7: notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Issue 12: reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated" ON public.reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Issue 14: products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- Note on Issues 30-39: project_admin_policy grants ALL access to project_admin. This is intended behavior for admins to manage all rows, so we leave it unchanged.


-- Fixes for Performance / Missing Indexes (Without CONCURRENTLY to be safe in a single migration script)
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON public.orders(item_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_worker_id ON public.orders(worker_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_shop_id ON public.shop_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_sales_item_id ON public.shop_sales(item_id);
CREATE INDEX IF NOT EXISTS idx_shop_sales_shop_id ON public.shop_sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON public.workers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
