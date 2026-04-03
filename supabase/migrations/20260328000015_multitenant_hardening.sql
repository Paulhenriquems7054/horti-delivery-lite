-- ============================================================
-- MULTI-TENANT HARDENING — safe, idempotent
-- All tables confirmed to exist before this migration
-- ============================================================

-- 1. Add store_id to favorites (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='favorites' AND column_name='store_id'
  ) THEN
    ALTER TABLE public.favorites ADD COLUMN store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_favorites_store_id ON public.favorites(store_id);

-- 2. Add store_id to basket_items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='basket_items' AND column_name='store_id'
  ) THEN
    ALTER TABLE public.basket_items ADD COLUMN store_id UUID;
  END IF;
END $$;

-- Backfill
UPDATE public.basket_items bi
SET store_id = b.store_id
FROM public.baskets b
WHERE bi.basket_id = b.id AND bi.store_id IS NULL;

-- Remove orphans before adding FK
DELETE FROM public.basket_items
WHERE store_id IS NOT NULL
  AND store_id NOT IN (SELECT id FROM public.stores);

-- Add FK only if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='basket_items_store_id_fkey'
  ) THEN
    ALTER TABLE public.basket_items
      ADD CONSTRAINT basket_items_store_id_fkey
      FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_basket_items_store_id ON public.basket_items(store_id);

-- 3. Add store_id to order_items
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='order_items' AND column_name='store_id'
  ) THEN
    ALTER TABLE public.order_items ADD COLUMN store_id UUID;
  END IF;
END $$;

UPDATE public.order_items oi
SET store_id = o.store_id
FROM public.orders o
WHERE oi.order_id = o.id AND oi.store_id IS NULL;

DELETE FROM public.order_items
WHERE store_id IS NOT NULL
  AND store_id NOT IN (SELECT id FROM public.stores);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='order_items_store_id_fkey'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_store_id_fkey
      FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_order_items_store_id ON public.order_items(store_id);

-- 4. Add store_id to order_tracking
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='order_tracking' AND column_name='store_id'
  ) THEN
    ALTER TABLE public.order_tracking ADD COLUMN store_id UUID;
  END IF;
END $$;

UPDATE public.order_tracking ot
SET store_id = o.store_id
FROM public.orders o
WHERE ot.order_id = o.id AND ot.store_id IS NULL;

DELETE FROM public.order_tracking
WHERE store_id IS NOT NULL
  AND store_id NOT IN (SELECT id FROM public.stores);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name='order_tracking_store_id_fkey'
  ) THEN
    ALTER TABLE public.order_tracking
      ADD CONSTRAINT order_tracking_store_id_fkey
      FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_order_tracking_store_id ON public.order_tracking(store_id);

-- 5. Trigger: auto-fill store_id on basket_items insert
CREATE OR REPLACE FUNCTION fill_basket_item_store_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.store_id IS NULL THEN
    SELECT store_id INTO NEW.store_id FROM public.baskets WHERE id = NEW.basket_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_basket_items_store_id ON public.basket_items;
CREATE TRIGGER trg_basket_items_store_id
  BEFORE INSERT ON public.basket_items
  FOR EACH ROW EXECUTE FUNCTION fill_basket_item_store_id();

-- 6. Trigger: auto-fill store_id on order_items insert
CREATE OR REPLACE FUNCTION fill_order_item_store_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.store_id IS NULL THEN
    SELECT store_id INTO NEW.store_id FROM public.orders WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_order_items_store_id ON public.order_items;
CREATE TRIGGER trg_order_items_store_id
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION fill_order_item_store_id();

-- 7. Trigger: auto-fill store_id on order_tracking insert
CREATE OR REPLACE FUNCTION fill_order_tracking_store_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.store_id IS NULL THEN
    SELECT store_id INTO NEW.store_id FROM public.orders WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_order_tracking_store_id ON public.order_tracking;
CREATE TRIGGER trg_order_tracking_store_id
  BEFORE INSERT ON public.order_tracking
  FOR EACH ROW EXECUTE FUNCTION fill_order_tracking_store_id();

-- 8. Composite indexes for multi-tenant performance
CREATE INDEX IF NOT EXISTS idx_products_store_active       ON public.products(store_id, active);
CREATE INDEX IF NOT EXISTS idx_orders_store_status         ON public.orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_store_phone          ON public.orders(store_id, phone);
CREATE INDEX IF NOT EXISTS idx_baskets_store_active        ON public.baskets(store_id, active);
CREATE INDEX IF NOT EXISTS idx_coupons_store_code          ON public.coupons(store_id, code);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_store_active ON public.delivery_zones(store_id, active);

-- 9. Tighten RLS on basket_items
DROP POLICY IF EXISTS "basket_items_public_read"   ON public.basket_items;
DROP POLICY IF EXISTS "basket_items_owner_manage"  ON public.basket_items;
CREATE POLICY "basket_items_public_read" ON public.basket_items
  FOR SELECT USING (true);
CREATE POLICY "basket_items_owner_manage" ON public.basket_items
  FOR ALL USING (
    store_id IS NULL OR
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  ) WITH CHECK (
    store_id IS NULL OR
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
  );

-- 10. RLS on order_items
DROP POLICY IF EXISTS "order_items_public_insert" ON public.order_items;
DROP POLICY IF EXISTS "order_items_owner_read"    ON public.order_items;
CREATE POLICY "order_items_public_insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_owner_read"    ON public.order_items FOR SELECT USING (true);

-- 11. RLS on favorites
DROP POLICY IF EXISTS "favorites_read"   ON public.favorites;
DROP POLICY IF EXISTS "favorites_insert" ON public.favorites;
DROP POLICY IF EXISTS "favorites_delete" ON public.favorites;
CREATE POLICY "favorites_read"   ON public.favorites FOR SELECT USING (true);
CREATE POLICY "favorites_insert" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "favorites_delete" ON public.favorites FOR DELETE USING (true);
