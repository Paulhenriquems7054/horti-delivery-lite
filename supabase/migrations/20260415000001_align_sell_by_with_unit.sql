-- Medida UN: venda só por unidade (sem alternância por peso / sem estimativa por kg)
UPDATE public.products
SET
  sell_by = 'unit',
  average_weight = NULL
WHERE LOWER(COALESCE(unit, '')) IN ('un', 'und', 'unidade');
