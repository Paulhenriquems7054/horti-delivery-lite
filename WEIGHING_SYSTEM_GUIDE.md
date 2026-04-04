# ⚖️ Sistema de Pesagem de Itens - Guia Completo

## Visão Geral

O sistema permite que clientes comprem produtos por unidade (ex: 3 abacaxis, 5 tomates) sem saber o peso exato. O admin pesa os itens depois e o valor final é calculado automaticamente.

## Fluxo Completo

### 1. Cliente Faz Pedido
```
Cliente acessa /:slug
↓
Seleciona produtos:
- 3 abacaxis (por unidade)
- 500g de laranja (por peso) ← já tem valor
- 5 tomates (por unidade)
↓
Finaliza pedido
↓
Total mostrado: R$ 2,75 (apenas laranja)
Aviso: "⚖️ Itens por unidade serão pesados"
```

### 2. Admin Vê Pedido
```
Admin acessa /admin
↓
Vê pedido em "🔔 Novos Pedidos"
↓
Card mostra:
- Nome do cliente
- Endereço
- Total parcial: R$ 2,75
- Botão ⚖️ (Pesar itens)
```

### 3. Admin Pesa Itens
```
Admin clica no botão ⚖️
↓
Modal abre mostrando:

📦 Itens Aguardando Pesagem:
┌─────────────────────────────┐
│ Abacaxi                     │
│ 3 unidades • R$ 4,60/kg     │
│ Peso Real: [____] kg        │
│ Valor: R$ —                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Tomate                      │
│ 5 unidades • R$ 8,90/kg     │
│ Peso Real: [____] kg        │
│ Valor: R$ —                 │
└─────────────────────────────┘

⚖️ Vendidos por Peso:
┌─────────────────────────────┐
│ Laranja Pera                │
│ 500g                        │
│ R$ 2,75                     │
└─────────────────────────────┘

Total Estimado: R$ 2,75
[Cancelar] [Salvar Pesagem]
```

### 4. Admin Preenche Pesos
```
Admin pesa os 3 abacaxis: 1.250 kg
Admin digita: 1.250
Valor calculado: R$ 5,75

Admin pesa os 5 tomates: 0.680 kg
Admin digita: 0.680
Valor calculado: R$ 6,05

Total Estimado atualiza: R$ 14,55
(2,75 + 5,75 + 6,05)

Botão "Salvar Pesagem" fica ativo
```

### 5. Admin Salva Pesagem
```
Admin clica "Salvar Pesagem"
↓
Sistema atualiza:
- order_items.actual_weight_kg = peso real
- order_items.final_price = valor calculado
- order_items.needs_weighing = false
- orders.total = novo total (R$ 14,55)
↓
Toast: "Pesagem concluída! Total atualizado: R$ 14,55"
↓
Modal fecha
↓
Card do pedido atualiza automaticamente
```

### 6. Cliente Vê Atualização
```
Cliente está em /:slug/pedido/:orderId
↓
Vê atualização em tempo real:

Abacaxi
3 unidades
Peso real: 1.250kg
R$ 5,75

Tomate
5 unidades
Peso real: 0.680kg
R$ 6,05

Laranja Pera
500g
R$ 2,75

Total: R$ 14,55 ✅
```

## Estrutura de Dados

### Antes da Pesagem
```sql
-- order_items
{
  id: "abc123",
  order_id: "order-xyz",
  product_id: "prod-abacaxi",
  quantity: 3,
  price: 4.60,  -- preço por kg
  sold_by: "unit",
  needs_weighing: true,  -- ← Precisa pesar
  actual_weight_kg: null,
  final_price: null
}
```

### Depois da Pesagem
```sql
-- order_items
{
  id: "abc123",
  order_id: "order-xyz",
  product_id: "prod-abacaxi",
  quantity: 3,
  price: 4.60,  -- preço por kg
  sold_by: "unit",
  needs_weighing: false,  -- ← Já foi pesado
  actual_weight_kg: 1.250,  -- ← Peso real
  final_price: 5.75  -- ← Valor final (1.250 × 4.60)
}
```

### Cálculo do Total do Pedido
```sql
-- Antes da pesagem
SELECT SUM(
  CASE 
    WHEN sold_by = 'weight' THEN price  -- Itens por peso já têm valor
    ELSE 0  -- Itens por unidade não contam ainda
  END
) as total
FROM order_items
WHERE order_id = 'order-xyz';
-- Resultado: R$ 2,75 (apenas laranja)

-- Depois da pesagem
SELECT SUM(
  CASE 
    WHEN final_price IS NOT NULL THEN final_price  -- Usa valor pesado
    ELSE price  -- Ou valor original
  END
) as total
FROM order_items
WHERE order_id = 'order-xyz';
-- Resultado: R$ 14,55 (todos os itens)
```

## Interface do Modal de Pesagem

### Componente: WeighingModal.tsx

#### Props
```typescript
interface WeighingModalProps {
  order: Order | null;  // Pedido a ser pesado
  onClose: () => void;  // Fecha o modal
  onUpdate: () => void; // Callback após salvar
}
```

#### Estados
```typescript
const [items, setItems] = useState<OrderItem[]>([]);  // Itens do pedido
const [weights, setWeights] = useState<Record<string, string>>({});  // Pesos digitados
const [loading, setLoading] = useState(true);  // Carregando itens
const [saving, setSaving] = useState(false);  // Salvando pesagem
```

#### Seções do Modal

1. **Header**
   - Ícone de balança
   - Título "Pesar Itens"
   - Nome do cliente
   - Botão fechar (X)

2. **Itens Aguardando Pesagem** (Amarelo)
   - Lista de itens com `needs_weighing = true`
   - Input para digitar peso em kg
   - Cálculo automático do valor
   - Validação: peso > 0

3. **Itens Já Pesados** (Verde)
   - Lista de itens com `needs_weighing = false` e `sold_by = 'unit'`
   - Mostra peso real e valor final
   - Somente leitura

4. **Itens por Peso** (Azul)
   - Lista de itens com `sold_by = 'weight'`
   - Já têm peso e valor definidos
   - Somente leitura

5. **Footer**
   - Total estimado (soma de todos os itens)
   - Botão "Cancelar"
   - Botão "Salvar Pesagem" (desabilitado se faltar pesos)

## Validações

### No Frontend
```typescript
// Permite apenas números e ponto decimal
const sanitized = value.replace(/[^0-9.]/g, '');

// Verifica se todos os itens foram pesados
const canSave = itemsNeedingWeighing.every(item => {
  const weight = parseFloat(weights[item.id] || '0');
  return weight > 0;
});
```

### No Backend
```sql
-- Trigger para recalcular total após pesagem
CREATE OR REPLACE FUNCTION recalculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET total = (
    SELECT SUM(COALESCE(final_price, price))
    FROM order_items
    WHERE order_id = NEW.order_id
  )
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_total_after_weighing
AFTER UPDATE OF actual_weight_kg, final_price ON order_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_order_total();
```

## Histórico de Pesagem

### Tabela: weighing_history
```sql
CREATE TABLE weighing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  order_item_id UUID REFERENCES order_items(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER,
  weight_kg NUMERIC,
  price_per_kg NUMERIC,
  final_price NUMERIC,
  weighed_at TIMESTAMP DEFAULT NOW(),
  weighed_by UUID REFERENCES auth.users(id)
);
```

### Propósito
- Auditoria: Quem pesou, quando pesou
- Histórico: Rastrear mudanças de peso
- Análise: Peso médio por produto
- Compliance: Registro para fiscalização

## Casos de Uso

### Caso 1: Pedido Só com Itens por Unidade
```
Cliente pede:
- 3 abacaxis
- 5 tomates
- 2 melancias

Total inicial: R$ 0,00
Admin pesa todos
Total final: R$ 45,80
```

### Caso 2: Pedido Misto
```
Cliente pede:
- 500g de laranja (por peso) → R$ 2,75
- 3 abacaxis (por unidade) → A pesar
- 1kg de banana (por peso) → R$ 4,90

Total inicial: R$ 7,65
Admin pesa abacaxis: 1.250kg → R$ 5,75
Total final: R$ 13,40
```

### Caso 3: Pedido Só com Itens por Peso
```
Cliente pede:
- 500g de laranja → R$ 2,75
- 1kg de banana → R$ 4,90
- 750g de maçã → R$ 8,63

Total inicial: R$ 16,28
Admin não precisa pesar nada
Total final: R$ 16,28
```

### Caso 4: Repesagem
```
Admin pesou errado:
- Digitou 1.250kg ao invés de 0.125kg

Solução:
1. Admin abre modal novamente
2. Campo já mostra 1.250
3. Admin corrige para 0.125
4. Salva novamente
5. Total é recalculado
```

## Botão de Pesagem no Admin

### Localização
- Card do pedido no Kanban
- Ao lado do botão de ação principal
- Ícone: ⚖️ (balança)
- Cor: Amarelo (bg-amber-100)

### Quando Aparece
- Pedidos em "Pendente"
- Pedidos em "Separando"
- Não aparece em "Na Rota" ou "Entregue"

### Comportamento
```typescript
<button
  onClick={() => setWeighingOrder(order)}
  className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
  title="Pesar itens"
>
  <Scale className="h-3.5 w-3.5" />
</button>
```

## Atualização em Tempo Real

### Cliente
```typescript
// CustomerTracking.tsx
useEffect(() => {
  const channel = supabase
    .channel(`customer-order-${orderId}`)
    .on("postgres_changes", {
      event: "*",
      table: "order_items",
      filter: `order_id=eq.${orderId}`
    }, () => {
      // Recarrega itens quando houver mudança
      loadOrderItems();
    })
    .subscribe();
}, [orderId]);
```

### Admin
```typescript
// Admin.tsx
useEffect(() => {
  const channel = supabase
    .channel("orders-realtime")
    .on("postgres_changes", {
      event: "UPDATE",
      table: "orders",
      filter: `store_id=eq.${storeId}`
    }, (payload) => {
      // Atualiza card do pedido
      setOrders(prev => 
        prev.map(o => o.id === payload.new.id ? payload.new : o)
      );
    })
    .subscribe();
}, [storeId]);
```

## Boas Práticas

### Para Admin
1. **Pesar logo após receber pedido**
   - Cliente fica sabendo o valor total rapidamente
   - Evita surpresas na entrega

2. **Conferir peso antes de salvar**
   - Verificar se digitou corretamente
   - Peso muito alto ou baixo pode ser erro

3. **Pesar todos os itens de uma vez**
   - Mais eficiente
   - Cliente vê total completo

4. **Usar balança calibrada**
   - Precisão é importante
   - Cliente paga pelo peso real

### Para Desenvolvedor
1. **Sempre validar peso > 0**
   - Não permitir peso negativo ou zero
   - Mostrar erro claro

2. **Calcular total automaticamente**
   - Não confiar em cálculo manual
   - Usar trigger no banco

3. **Registrar histórico**
   - Auditoria é importante
   - Facilita resolver disputas

4. **Atualização em tempo real**
   - Cliente vê mudanças instantaneamente
   - Melhor experiência

## Troubleshooting

### Botão de Pesagem Não Aparece
**Causa**: Pedido já está em "Na Rota" ou "Entregue"
**Solução**: Voltar status para "Separando"

### Modal Não Carrega Itens
**Causa**: Erro ao buscar order_items
**Solução**: Verificar console, checar RLS

### Não Consegue Salvar
**Causa**: Algum item sem peso preenchido
**Solução**: Preencher todos os pesos

### Total Não Atualiza
**Causa**: Trigger não está funcionando
**Solução**: Executar migração `20260404000003_add_weighing_support.sql`

### Cliente Não Vê Atualização
**Causa**: Realtime não está funcionando
**Solução**: Verificar Supabase Realtime, recarregar página

## Migração Necessária

Para o sistema funcionar, execute:

```bash
# Migração que adiciona campos de pesagem
supabase/migrations/20260404000003_add_weighing_support.sql
```

Essa migração adiciona:
- `actual_weight_kg` em order_items
- `final_price` em order_items
- `needs_weighing` em order_items
- Tabela `weighing_history`
- Trigger para recalcular total

## Conclusão

O sistema de pesagem permite que clientes comprem por unidade sem saber o peso exato, e o admin pesa depois. Isso replica o comportamento de um hortifruti físico, onde o cliente escolhe os produtos e paga pelo peso real na balança.

A interface é simples e intuitiva, com validações para evitar erros, e atualização em tempo real para que o cliente acompanhe o processo.
