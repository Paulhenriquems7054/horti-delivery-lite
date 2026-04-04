-- Verificar qual usuário deveria ver o pedido

-- 1. Pedido específico e seu dono
SELECT 
  'Pedido Info' as tipo,
  o.id as pedido_id,
  o.customer_name,
  o.store_id,
  s.name as loja_nome,
  s.slug as loja_slug,
  s.user_id as dono_user_id,
  u.email as dono_email
FROM orders o
JOIN stores s ON s.id = o.store_id
LEFT JOIN auth.users u ON u.id = s.user_id
WHERE o.id = '5287891d-7094-411f-a414-b3cdaa458664';

-- 2. Todos os usuários e suas lojas
SELECT 
  'Usuários e Lojas' as tipo,
  u.id as user_id,
  u.email,
  s.id as store_id,
  s.name as store_name,
  s.slug as store_slug
FROM auth.users u
LEFT JOIN stores s ON s.user_id = u.id
ORDER BY u.created_at DESC;

-- 3. Verificar se há usuário sem loja
SELECT 
  'Usuários Sem Loja' as tipo,
  u.id as user_id,
  u.email,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM stores s WHERE s.user_id = u.id
);

-- 4. Verificar se há loja sem usuário
SELECT 
  'Lojas Sem Usuário' as tipo,
  s.id as store_id,
  s.name as store_name,
  s.slug,
  s.user_id
FROM stores s
WHERE s.user_id IS NULL;

-- 5. Contar pedidos por usuário (através da loja)
SELECT 
  'Pedidos por Usuário' as tipo,
  u.email as user_email,
  s.name as store_name,
  COUNT(o.id) as total_pedidos
FROM auth.users u
JOIN stores s ON s.user_id = u.id
LEFT JOIN orders o ON o.store_id = s.id
GROUP BY u.id, u.email, s.name
ORDER BY total_pedidos DESC;
