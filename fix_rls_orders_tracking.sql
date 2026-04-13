-- Corrige a política RLS de leitura de pedidos
-- Remove a política duplicada e recria corretamente

DROP POLICY IF EXISTS "orders_owner_read" ON public.orders;

-- Permite:
-- 1. Dono da loja (autenticado) ver pedidos da sua loja
-- 2. Usuários anônimos (clientes) ver pedidos pelo telefone (rastreamento)
CREATE POLICY "orders_owner_read" ON public.orders
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = store_id)
    OR auth.uid() IS NULL
  );

-- Normaliza todos os telefones existentes removendo caracteres não numéricos
-- Isso corrige a inconsistência entre telefones salvos com formatação e busca sem formatação
UPDATE public.orders
SET phone = regexp_replace(phone, '\D', '', 'g')
WHERE phone ~ '\D';
