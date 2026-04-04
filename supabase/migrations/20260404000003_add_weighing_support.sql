-- Adicionar suporte para pesagem de produtos vendidos por unidade
-- Permite que admin pese produtos após o pedido e ajuste o valor final

-- 1. Adicionar campos de controle de pesagem em order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS needs_weighing BOOLEAN DEFAULT false;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS actual_weight_kg NUMERIC;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS estimated_price NUMERIC;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS final_price NUMERIC;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC;

-- 2. Comentários explicativos
COMMENT ON COLUMN public.order_items.needs_weighing IS 'Se true, produto precisa ser pesado pelo admin antes de finalizar';
COMMENT ON COLUMN public.order_items.actual_weight_kg IS 'Peso real após pesagem pelo admin (kg)';
COMMENT ON COLUMN public.order_items.estimated_price IS 'Preço estimado quando cliente compra por unidade';
COMMENT ON COLUMN public.order_items.final_price IS 'Preço final após pesagem (ou igual ao estimado se não precisa pesar)';
COMMENT ON COLUMN public.order_items.price_per_kg IS 'Preço por kg do produto (para cálculo após pesagem)';

-- 3. Atualizar itens existentes
-- Itens que já existem não precisam de pesagem (já foram processados)
UPDATE public.order_items SET
  needs_weighing = false,
  final_price = COALESCE(final_price, estimated_price, quantity * (SELECT price FROM products WHERE id = product_id))
WHERE needs_weighing IS NULL;

-- 4. Criar tabela de histórico de pesagens (auditoria)
CREATE TABLE IF NOT EXISTS public.weighing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  estimated_weight_kg NUMERIC,
  actual_weight_kg NUMERIC NOT NULL,
  estimated_price NUMERIC,
  final_price NUMERIC NOT NULL,
  price_per_kg NUMERIC NOT NULL,
  weighed_by UUID REFERENCES auth.users(id),
  weighed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

COMMENT ON TABLE public.weighing_history IS 'Histórico de pesagens para auditoria e controle';

-- 5. Índices para performance
CREATE INDEX IF NOT EXISTS idx_order_items_needs_weighing ON public.order_items(needs_weighing) WHERE needs_weighing = true;
CREATE INDEX IF NOT EXISTS idx_weighing_history_order ON public.weighing_history(order_id);
CREATE INDEX IF NOT EXISTS idx_weighing_history_date ON public.weighing_history(weighed_at DESC);

-- 6. RLS para weighing_history
ALTER TABLE public.weighing_history ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem
DROP POLICY IF EXISTS "Admin can view weighing history" ON public.weighing_history;
DROP POLICY IF EXISTS "Admin can insert weighing history" ON public.weighing_history;

-- Admin pode ver histórico de pesagens da sua loja
CREATE POLICY "Admin can view weighing history" ON public.weighing_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE o.id = weighing_history.order_id
        AND s.user_id = auth.uid()
    )
  );

-- Admin pode inserir pesagens
CREATE POLICY "Admin can insert weighing history" ON public.weighing_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN stores s ON o.store_id = s.id
      WHERE o.id = weighing_history.order_id
        AND s.user_id = auth.uid()
    )
  );

-- 7. Função para recalcular total do pedido após pesagem
CREATE OR REPLACE FUNCTION recalculate_order_total(p_order_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  -- Somar todos os itens (final_price ou estimated_price)
  SELECT COALESCE(SUM(COALESCE(final_price, estimated_price, 0)), 0)
  INTO v_total
  FROM order_items
  WHERE order_id = p_order_id;
  
  -- Adicionar taxa de entrega se houver
  SELECT v_total + COALESCE(delivery_fee, 0)
  INTO v_total
  FROM orders
  WHERE id = p_order_id;
  
  -- Subtrair desconto se houver
  SELECT v_total - COALESCE(discount, 0)
  INTO v_total
  FROM orders
  WHERE id = p_order_id;
  
  -- Atualizar total do pedido
  UPDATE orders
  SET total = v_total
  WHERE id = p_order_id;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalculate_order_total IS 'Recalcula o total do pedido após pesagem dos itens';

-- 8. Trigger para recalcular total quando item é pesado
CREATE OR REPLACE FUNCTION trigger_recalculate_on_weighing()
RETURNS TRIGGER AS $$
BEGIN
  -- Se final_price foi atualizado, recalcular total do pedido
  IF NEW.final_price IS DISTINCT FROM OLD.final_price THEN
    PERFORM recalculate_order_total(NEW.order_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove trigger antigo se existir
DROP TRIGGER IF EXISTS recalculate_order_total_on_weighing ON public.order_items;

-- Cria trigger
CREATE TRIGGER recalculate_order_total_on_weighing
  AFTER UPDATE OF final_price ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_recalculate_on_weighing();

COMMENT ON TRIGGER recalculate_order_total_on_weighing ON public.order_items IS 'Recalcula total do pedido quando item é pesado';
