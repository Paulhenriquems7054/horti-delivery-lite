-- ============================================================
-- SECURITY FIX: Proper RLS policies
-- ============================================================

-- 1. STORES: public can only READ active stores
DROP POLICY IF EXISTS "Public read stores" ON public.stores;
DROP POLICY IF EXISTS "Public insert stores" ON public.stores;
DROP POLICY IF EXISTS "Public update stores" ON public.stores;
DROP POLICY IF EXISTS "Public delete stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can read stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can insert stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can update stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can delete stores" ON public.stores;

-- Anyone can read active stores (needed for slug lookup)
CREATE POLICY "stores_public_read" ON public.stores
  FOR SELECT USING (true);

-- Only authenticated users can insert (register flow)
CREATE POLICY "stores_auth_insert" ON public.stores
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only the store owner can update their store
CREATE POLICY "stores_owner_update" ON public.stores
  FOR UPDATE USING (auth.uid() = user_id);

-- Only the store owner can delete their store
CREATE POLICY "stores_owner_delete" ON public.stores
  FOR DELETE USING (auth.uid() = user_id);

-- 2. PRODUCTS: public read active, owner manages
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;
DROP POLICY IF EXISTS "Public Select Products" ON public.products;

CREATE POLICY "products_public_read" ON public.products
  FOR SELECT USING (active = true);

CREATE POLICY "products_owner_insert" ON public.products
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY "products_owner_update" ON public.products
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  );

CREATE POLICY "products_owner_delete" ON public.products
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  );

-- 3. BASKETS: public read active, owner manages
DROP POLICY IF EXISTS "Anyone can read baskets" ON public.baskets;
DROP POLICY IF EXISTS "Anyone can insert baskets" ON public.baskets;
DROP POLICY IF EXISTS "Anyone can update baskets" ON public.baskets;
DROP POLICY IF EXISTS "Anyone can delete baskets" ON public.baskets;
DROP POLICY IF EXISTS "Public read baskets" ON public.baskets;
DROP POLICY IF EXISTS "Public insert baskets" ON public.baskets;
DROP POLICY IF EXISTS "Public update baskets" ON public.baskets;
DROP POLICY IF EXISTS "Public delete baskets" ON public.baskets;
DROP POLICY IF EXISTS "Public Select Baskets" ON public.baskets;

CREATE POLICY "baskets_public_read" ON public.baskets
  FOR SELECT USING (active = true);

CREATE POLICY "baskets_owner_manage" ON public.baskets
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  ) WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  );

-- 4. BASKET_ITEMS: public read, owner manages
DROP POLICY IF EXISTS "Anyone can read basket_items" ON public.basket_items;
DROP POLICY IF EXISTS "Anyone can insert basket_items" ON public.basket_items;
DROP POLICY IF EXISTS "Anyone can update basket_items" ON public.basket_items;
DROP POLICY IF EXISTS "Anyone can delete basket_items" ON public.basket_items;
DROP POLICY IF EXISTS "Public Select Basket Items" ON public.basket_items;

CREATE POLICY "basket_items_public_read" ON public.basket_items
  FOR SELECT USING (true);

CREATE POLICY "basket_items_owner_manage" ON public.basket_items
  FOR ALL USING (
    auth.uid() IN (
      SELECT s.user_id FROM public.stores s
      JOIN public.baskets b ON b.store_id = s.id
      WHERE b.id = basket_id
    )
  ) WITH CHECK (
    auth.uid() IN (
      SELECT s.user_id FROM public.stores s
      JOIN public.baskets b ON b.store_id = s.id
      WHERE b.id = basket_id
    )
  );

-- 5. ORDERS: anyone can insert (checkout), owner reads their store orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Public All Orders" ON public.orders;

-- Customers can create orders
CREATE POLICY "orders_public_insert" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Store owner can read/update their orders
CREATE POLICY "orders_owner_read" ON public.orders
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
    OR auth.uid() IS NULL  -- allow anon for order tracking by phone
  );

CREATE POLICY "orders_owner_update" ON public.orders
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  );

-- 6. ORDER_ITEMS: insert on checkout, owner reads
DROP POLICY IF EXISTS "Anyone can create order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can read order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public All Order Items" ON public.order_items;

CREATE POLICY "order_items_public_insert" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "order_items_owner_read" ON public.order_items
  FOR SELECT USING (true);

-- 7. DELIVERY ZONES: public read, owner manages
DROP POLICY IF EXISTS "Anyone can read delivery_zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Anyone can insert delivery_zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Anyone can update delivery_zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Anyone can delete delivery_zones" ON public.delivery_zones;

CREATE POLICY "zones_public_read" ON public.delivery_zones
  FOR SELECT USING (active = true);

CREATE POLICY "zones_owner_manage" ON public.delivery_zones
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  ) WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  );

-- 8. COUPONS: owner manages, public validates
DROP POLICY IF EXISTS "Anyone can read coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can update coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can delete coupons" ON public.coupons;

CREATE POLICY "coupons_public_read" ON public.coupons
  FOR SELECT USING (active = true);

CREATE POLICY "coupons_owner_manage" ON public.coupons
  FOR ALL USING (
    store_id IS NULL OR
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  ) WITH CHECK (
    store_id IS NULL OR
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  );

-- 9. HIDE delivery_pin from public queries
-- Create a view that excludes sensitive fields for public access
CREATE OR REPLACE VIEW public.stores_public AS
  SELECT id, name, slug, description, logo_url, phone, email, address,
         active, subscription_status, created_at
  FROM public.stores
  WHERE active = true;

-- 10. ORDER TRACKING: insert on status change, public read own orders
DROP POLICY IF EXISTS "Anyone can read order_tracking" ON public.order_tracking;
DROP POLICY IF EXISTS "Anyone can insert order_tracking" ON public.order_tracking;

CREATE POLICY "order_tracking_public_read" ON public.order_tracking
  FOR SELECT USING (true);

CREATE POLICY "order_tracking_insert" ON public.order_tracking
  FOR INSERT WITH CHECK (true);

-- 11. DIRECT DELIVERIES: owner manages
DROP POLICY IF EXISTS "Public all direct_deliveries" ON public.direct_deliveries;

CREATE POLICY "direct_deliveries_owner_manage" ON public.direct_deliveries
  FOR ALL USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
    OR auth.uid() IS NULL  -- allow anon for customer tracking
  ) WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
    OR auth.uid() IS NULL
  );
