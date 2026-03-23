-- ============================================================
-- HortiDelivery Lite — Script de seed inicial
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Desativar cestas existentes (garante apenas 1 ativa)
UPDATE baskets SET active = false;

-- 2. Inserir produtos (hortifruti)
INSERT INTO products (id, name, price, image_url, active)
VALUES
  (gen_random_uuid(), 'Banana',  2.50,  NULL, true),
  (gen_random_uuid(), 'Tomate',  5.90,  NULL, true),
  (gen_random_uuid(), 'Alface',  3.00,  NULL, true),
  (gen_random_uuid(), 'Batata',  4.50,  NULL, true),
  (gen_random_uuid(), 'Cebola',  3.70,  NULL, true)
ON CONFLICT DO NOTHING;

-- 3. Inserir a cesta da semana
INSERT INTO baskets (id, name, price, active, created_at)
VALUES (
  gen_random_uuid(),
  'Cesta da Semana',
  24.90,
  true,
  now()
);

-- 4. Associar produtos à cesta (pega os últimos inseridos)
WITH
  cesta AS (SELECT id FROM baskets WHERE active = true LIMIT 1),
  prods AS (
    SELECT id, name FROM products
    WHERE name IN ('Banana','Tomate','Alface','Batata','Cebola')
    ORDER BY name
  )
INSERT INTO basket_items (id, basket_id, product_id, quantity)
SELECT
  gen_random_uuid(),
  cesta.id,
  prods.id,
  CASE prods.name
    WHEN 'Banana' THEN 6
    WHEN 'Tomate' THEN 4
    WHEN 'Alface' THEN 2
    WHEN 'Batata' THEN 3
    WHEN 'Cebola' THEN 2
  END
FROM cesta, prods;

-- ============================================================
-- ✅ Pronto! Acesse o app e a cesta já aparecerá.
-- ============================================================
