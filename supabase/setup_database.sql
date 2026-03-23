-- 1. CRIA TABELAS SE NÃO EXISTIREM
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.baskets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.basket_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  basket_id UUID NOT NULL REFERENCES public.baskets(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1
);

-- 2. HABILITAR SECURITY (REGRAS PÚBLICAS PARA O MVP)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select Products" ON public.products;
CREATE POLICY "Public Select Products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Select Baskets" ON public.baskets;
CREATE POLICY "Public Select Baskets" ON public.baskets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Select Basket Items" ON public.basket_items;
CREATE POLICY "Public Select Basket Items" ON public.basket_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public All Orders" ON public.orders;
CREATE POLICY "Public All Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public All Order Items" ON public.order_items;
CREATE POLICY "Public All Order Items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- 3. HABILITAR REALTIME
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.orders;
COMMIT;

-- 4. DADOS INICIAIS (SEED)
DELETE FROM public.basket_items;
DELETE FROM public.baskets;
DELETE FROM public.products;

INSERT INTO public.products (name, price, active)
VALUES
  ('Banana Nanica', 4.90, true),
  ('Tomate Italiano', 8.50, true),
  ('Alface Crespa', 3.50, true),
  ('Batata Inglesa', 6.90, true),
  ('Cebola Branca', 4.50, true);

WITH cesta_id AS (
  INSERT INTO public.baskets (name, price, active)
  VALUES ('Cesta de Hortifruti Econômica', 24.90, true)
  RETURNING id
)
INSERT INTO public.basket_items (basket_id, product_id, quantity)
SELECT (SELECT id FROM cesta_id), p.id, 1
FROM public.products p;
