-- Migration: Adiciona campos para estimativa de peso em produtos vendidos por unidade
-- Isso permite mostrar estimativas de preço para produtos que serão pesados após a compra

-- Adiciona campo de peso médio estimado (em kg) para produtos vendidos por unidade
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_weight DECIMAL(10,3);

-- Adiciona campo de variação de peso (percentual, ex: 0.2 = 20%) para faixa de preço
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_variance DECIMAL(5,3) DEFAULT 0.15;

-- Comentários para documentação
COMMENT ON COLUMN products.average_weight IS 'Peso médio estimado em kg para produtos vendidos por unidade (ex: 1.2 para abacaxi de 1.2kg)';
COMMENT ON COLUMN products.weight_variance IS 'Variação percentual do peso para faixa de estimativa (ex: 0.15 = 15%, padrão)';

-- Atualiza alguns produtos comuns com pesos médios estimados (exemplos)
-- Esses valores podem ser ajustados pelo administrador
UPDATE products SET average_weight = 1.5, weight_variance = 0.20 WHERE LOWER(name) LIKE '%abacaxi%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.18, weight_variance = 0.15 WHERE LOWER(name) LIKE '%banana%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.20, weight_variance = 0.20 WHERE LOWER(name) LIKE '%maçã%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.25, weight_variance = 0.20 WHERE LOWER(name) LIKE '%laranja%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.35, weight_variance = 0.15 WHERE LOWER(name) LIKE '%manga%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.25, weight_variance = 0.15 WHERE LOWER(name) LIKE '%tomate%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.30, weight_variance = 0.15 WHERE LOWER(name) LIKE '%batata%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.15, weight_variance = 0.15 WHERE LOWER(name) LIKE '%cebola%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.40, weight_variance = 0.15 WHERE LOWER(name) LIKE '%melão%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.30, weight_variance = 0.20 WHERE LOWER(name) LIKE '%mamão%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.30, weight_variance = 0.20 WHERE LOWER(name) LIKE '%abacate%' AND average_weight IS NULL;
UPDATE products SET average_weight = 0.25, weight_variance = 0.20 WHERE LOWER(name) LIKE '%pimentão%' AND average_weight IS NULL;
