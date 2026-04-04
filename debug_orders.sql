-- Script de Debug para Verificar Pedidos e Lojas

-- 1. Ver todas as lojas
SELECT 
  id,
  name,
  slug,
  user_id,
  active
FROM stores
ORDER BY created_at DESC;

-- 2. Ver todos os pedidos recentes
SELECT 
  o.id,
  o.customer_name,
  o.store_id,
  s.name as store_name,
  s.slug as store_slug,
  o.status,
  o.total,
  o.created_at
FROM orders o
LEFT JOIN stores s ON s.id = o.store_id
ORDER BY o.created_at DESC
LIMIT 20;

-- 3. Ver pedidos sem loja associada
SELECT 
  id,
  customer_name,
  store_id,
  status,
  total,
  created_at
FROM orders
WHERE store_id IS NULL
ORDER BY created_at DESC;

-- 4. Ver pedidos da loja 'teste' (slug)
SELECT 
  o.id,
  o.customer_name,
  o.phone,
  o.address,
  o.status,
  o.total,
  o.created_at
FROM orders o
JOIN stores s ON s.id = o.store_id
WHERE s.slug = 'teste'
ORDER BY o.created_at DESC;

-- 5. Ver qual usuário é dono de qual loja
SELECT 
  s.id as store_id,
  s.name as store_name,
  s.slug,
  s.user_id,
  u.email as user_email
FROM stores s
LEFT JOIN auth.users u ON u.id = s.user_id
ORDER BY s.created_at DESC;

-- 6. Contar pedidos por loja
SELECT 
  s.name as store_name,
  s.slug,
  COUNT(o.id) as total_orders,
  COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN o.status = 'preparing' THEN 1 END) as preparing,
  COUNT(CASE WHEN o.status = 'delivering' THEN 1 END) as delivering,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered
FROM stores s
LEFT JOIN orders o ON o.store_id = s.id
GROUP BY s.id, s.name, s.slug
ORDER BY total_orders DESC;

-- 7. Ver itens do último pedido
SELECT 
  oi.id,
  oi.order_id,
  p.name as product_name,
  oi.quantity,
  oi.weight_kg,
  oi.sold_by,
  oi.price,
  oi.needs_weighing
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = (
  SELECT id FROM orders ORDER BY created_at DESC LIMIT 1
);

-- 8. Verificar RLS (Row Level Security)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('orders', 'order_items', 'stores')
ORDER BY tablename, policyname;

-- 9. Ver pedido específico com detalhes completos
-- Substitua 'ID_DO_PEDIDO' pelo ID real
SELECT 
  o.*,
  s.name as store_name,
  s.slug as store_slug,
  s.user_id as store_owner_id
FROM orders o
LEFT JOIN stores s ON s.id = o.store_id
WHERE o.id = '5287891d-7094-411f-a414-b3cdaa458664';

-- 10. Verificar se há múltiplas lojas com mesmo slug
SELECT 
  slug,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as store_ids
FROM stores
GROUP BY slug
HAVING COUNT(*) > 1;
