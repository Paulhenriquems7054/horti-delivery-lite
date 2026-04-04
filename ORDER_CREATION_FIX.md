# 🔧 Correção: Admin Não Vê Pedidos do Cliente

## Problema Identificado

Cliente faz pedido mas admin não vê na dashboard. O pedido é criado mas não aparece nas colunas do Kanban.

### Sintomas
- Cliente completa pedido com sucesso
- Tela de confirmação aparece normalmente
- Admin não vê o pedido em "Novos Pedidos"
- Dashboard mostra "0 Vazio" em todas as colunas

## Causas Possíveis

### 1. Erro ao Inserir order_items
**Causa**: Hook `useCreateOrder` tentava inserir campo `product_name` que não existe na tabela `order_items`

**Erro no Console**:
```
ERROR: column "product_name" does not exist
```

**Solução**: Remover `product_name` e adicionar campos corretos (`weight_kg`, `sold_by`, `needs_weighing`)

### 2. Falta de store_id no Pedido
**Causa**: Pedido criado sem `store_id`, então não aparece para nenhum admin

**Solução**: Garantir que `storeId` seja passado ao criar pedido

### 3. Filtro de Loja Incorreto
**Causa**: Admin busca pedidos de uma loja, mas pedidos foram criados com `store_id` diferente

**Solução**: Verificar que o `store_id` do pedido corresponde à loja do admin

## Correção Implementada

### Arquivo: `src/hooks/useCreateOrder.ts`

#### Antes (Incorreto)
```typescript
const orderItems = input.products.map((p) => ({
  order_id: order.id,
  product_id: p.id,
  quantity: p.quantity,
  price: p.price,
  product_name: p.name,  // ❌ Campo não existe
}));
```

#### Depois (Correto)
```typescript
const orderItems = input.products.map((p) => {
  const item: any = {
    order_id: order.id,
    product_id: p.id,
    quantity: p.quantity || 1,
    price: p.price,
  };
  
  // Adiciona campos específicos baseado no tipo de venda
  if (p.sold_by === 'weight') {
    item.weight_kg = p.weight_kg;
    item.sold_by = 'weight';
  } else {
    item.sold_by = 'unit';
    item.needs_weighing = true; // Itens por unidade precisam ser pesados
  }
  
  return item;
});
```

## Como Verificar se Está Funcionando

### 1. Teste de Criação de Pedido

#### Cliente
1. Acesse `/:slug` (ex: `/teste`)
2. Adicione produtos ao carrinho
3. Clique em "Ir p/ Checkout"
4. Preencha dados e confirme
5. Deve ver tela de confirmação

#### Admin
1. Acesse `/admin`
2. Deve ver o pedido em "🔔 Novos Pedidos"
3. Pedido deve mostrar:
   - Nome do cliente
   - Endereço
   - Total
   - Botão "Preparar 🍳"

### 2. Verificar no Banco de Dados

```sql
-- Ver pedidos criados
SELECT id, customer_name, store_id, status, total, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Ver itens dos pedidos
SELECT oi.*, p.name as product_name
FROM order_items oi
JOIN products p ON p.id = oi.product_id
WHERE oi.order_id = 'ID_DO_PEDIDO';

-- Verificar se store_id está correto
SELECT o.id, o.customer_name, o.store_id, s.name as store_name
FROM orders o
LEFT JOIN stores s ON s.id = o.store_id
ORDER BY o.created_at DESC
LIMIT 10;
```

### 3. Verificar Console do Navegador

#### Cliente (ao fazer pedido)
```javascript
// Deve ver sucesso
✅ Pedido enviado com sucesso! 🎉

// NÃO deve ver erros como:
❌ ERROR: column "product_name" does not exist
❌ ERROR: null value in column "store_id"
```

#### Admin (ao abrir dashboard)
```javascript
// Deve ver pedidos carregando
🔄 Carregando pedidos...

// Deve ver pedidos listados
✅ Pedidos carregados: 3

// NÃO deve ver:
❌ No store linked
❌ Erro ao buscar pedidos
```

## Fluxo Correto de Criação de Pedido

### 1. Cliente Faz Pedido
```typescript
// src/pages/Index.tsx
createOrder.mutate({
  customer_name: data.customer_name,
  phone: data.phone,
  address: data.address,
  total: data.total_with_fee || cartTotal,
  products: selectedProducts,  // ✅ Com sold_by, weight_kg
  storeId: store.id,           // ✅ ID da loja
  delivery_zone_id: data.neighborhood_id,
  coupon_id: data.coupon_id,
  delivery_fee: data.delivery_fee,
  discount: data.discount,
});
```

### 2. Hook Cria Pedido
```typescript
// src/hooks/useCreateOrder.ts
// 1. Insere na tabela orders
const { data: order } = await supabase
  .from("orders")
  .insert({
    customer_name: input.customer_name,
    phone: input.phone,
    address: input.address,
    total: input.total,
    status: "pending",
    store_id: input.storeId,  // ✅ Associa à loja
  })
  .select()
  .single();

// 2. Insere itens com campos corretos
const orderItems = input.products.map((p) => ({
  order_id: order.id,
  product_id: p.id,
  quantity: p.quantity || 1,
  price: p.price,
  weight_kg: p.weight_kg,      // ✅ Se vendido por peso
  sold_by: p.sold_by,          // ✅ 'weight' ou 'unit'
  needs_weighing: p.sold_by === 'unit',  // ✅ True para unidade
}));

await supabase.from("order_items").insert(orderItems);
```

### 3. Admin Vê Pedido
```typescript
// src/hooks/useOrders.ts
// Busca pedidos apenas da loja do admin
const { data: store } = await supabase
  .from("stores")
  .select("id")
  .eq("user_id", authData.user.id)
  .maybeSingle();

const { data } = await supabase
  .from("orders")
  .select("*")
  .eq("store_id", store.id)  // ✅ Filtra por loja
  .order("created_at", { ascending: false });
```

## Estrutura Correta de order_items

### Campos Obrigatórios
```typescript
{
  id: UUID,              // Auto-gerado
  order_id: UUID,        // ID do pedido
  product_id: UUID,      // ID do produto
  quantity: INTEGER,     // Quantidade
  price: NUMERIC,        // Preço no momento do pedido
}
```

### Campos Opcionais (Venda Dual)
```typescript
{
  weight_kg: NUMERIC,           // Peso em kg (se vendido por peso)
  sold_by: TEXT,                // 'weight' ou 'unit'
  needs_weighing: BOOLEAN,      // true se precisa pesar
  actual_weight_kg: NUMERIC,    // Peso real após pesagem
  final_price: NUMERIC,         // Preço final após pesagem
}
```

## Checklist de Verificação

### Antes de Testar
- [ ] Migração `20260404000004_fix_order_items_constraints.sql` foi executada
- [ ] Tabela `order_items` tem campos: `price`, `weight_kg`, `sold_by`, `needs_weighing`
- [ ] Hook `useCreateOrder` foi atualizado (sem `product_name`)
- [ ] Produtos têm `sell_by` configurado ('unit', 'weight', ou 'both')

### Durante o Teste
- [ ] Cliente consegue adicionar produtos ao carrinho
- [ ] Cliente consegue finalizar pedido sem erros
- [ ] Tela de confirmação aparece
- [ ] Admin vê pedido em "Novos Pedidos"
- [ ] Pedido mostra dados corretos (nome, endereço, total)

### Após o Teste
- [ ] Pedido está no banco com `store_id` correto
- [ ] Itens do pedido estão salvos corretamente
- [ ] Admin pode mudar status do pedido
- [ ] Cliente vê atualização de status em tempo real

## Problemas Comuns

### Pedido Criado Mas Admin Não Vê

**Causa 1**: `store_id` está NULL
```sql
-- Verificar
SELECT id, customer_name, store_id FROM orders WHERE store_id IS NULL;

-- Corrigir (se souber qual loja)
UPDATE orders SET store_id = 'ID_DA_LOJA' WHERE store_id IS NULL;
```

**Causa 2**: Admin está logado em loja diferente
```sql
-- Ver qual loja o admin gerencia
SELECT s.id, s.name, s.user_id
FROM stores s
WHERE s.user_id = 'ID_DO_USER_ADMIN';

-- Ver pedidos dessa loja
SELECT * FROM orders WHERE store_id = 'ID_DA_LOJA';
```

**Causa 3**: RLS bloqueando acesso
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- Desabilitar RLS temporariamente (APENAS PARA DEBUG)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### Erro ao Criar order_items

**Erro**: `column "product_name" does not exist`
- **Solução**: Atualizar `useCreateOrder.ts` (já corrigido)

**Erro**: `null value in column "price"`
- **Solução**: Garantir que `p.price` está definido no produto

**Erro**: `foreign key violation`
- **Solução**: Verificar que `product_id` existe na tabela `products`

## Logs Úteis para Debug

### Cliente (Console)
```javascript
// Adicionar no useCreateOrder antes de mutate
console.log('Criando pedido:', {
  storeId: input.storeId,
  products: input.products.map(p => ({
    id: p.id,
    name: p.name,
    sold_by: p.sold_by,
    weight_kg: p.weight_kg,
    quantity: p.quantity,
    price: p.price
  }))
});
```

### Admin (Console)
```javascript
// Adicionar no useRealtimeOrders
console.log('Buscando pedidos da loja:', store.id);
console.log('Pedidos encontrados:', data.length);
```

## Conclusão

A correção principal foi remover o campo `product_name` inexistente e adicionar os campos corretos (`weight_kg`, `sold_by`, `needs_weighing`) ao criar itens do pedido. Isso permite que:

1. ✅ Pedidos sejam criados sem erros
2. ✅ Admin veja pedidos na dashboard
3. ✅ Sistema de venda dual funcione corretamente
4. ✅ Itens por unidade sejam marcados para pesagem

Se o problema persistir, verifique:
- Migração do banco foi executada
- `store_id` está sendo passado corretamente
- Admin está logado na loja correta
- RLS não está bloqueando acesso
