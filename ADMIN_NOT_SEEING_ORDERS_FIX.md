# 🔧 Correção: Admin Não Vê Pedidos Criados

## Problema

Cliente faz pedido com sucesso, pedido aparece no banco de dados, mas admin não vê na dashboard.

### Sintomas
- ✅ Cliente completa pedido normalmente
- ✅ Pedido está na tabela `orders` com `store_id` correto
- ❌ Admin vê "0 Vazio" em todas as colunas do Kanban
- ❌ Dashboard mostra 0 pedidos

## Causa Raiz

O admin está logado com um `user_id` diferente do `user_id` associado à loja. O hook `useRealtimeOrders` busca pedidos assim:

```typescript
// 1. Pega user_id do admin logado
const { data: authData } = await supabase.auth.getUser();

// 2. Busca loja desse user_id
const { data: store } = await supabase
  .from("stores")
  .select("id")
  .eq("user_id", authData.user.id)  // ← Aqui está o problema
  .maybeSingle();

// 3. Busca pedidos dessa loja
const { data } = await supabase
  .from("orders")
  .select("*")
  .eq("store_id", store.id)
  .order("created_at", { ascending: false });
```

Se o `user_id` do admin não corresponder ao `user_id` da loja, nenhum pedido será encontrado.

## Diagnóstico

### 1. Verificar Dados do Pedido
Execute no Supabase SQL Editor:

```sql
SELECT 
  o.id as pedido_id,
  o.customer_name,
  o.store_id,
  s.name as loja_nome,
  s.slug as loja_slug,
  s.user_id as dono_user_id
FROM orders o
JOIN stores s ON s.id = o.store_id
WHERE o.id = 'SEU_PEDIDO_ID'
ORDER BY o.created_at DESC
LIMIT 1;
```

**Resultado Esperado**:
```
pedido_id: 5287891d-7094-411f-a414-b3cdaa458664
customer_name: Paulo Henrique Morais Silva
store_id: f1e86383-302b-4fe5-a342-be5e91efedab
loja_nome: Supermercado teste
loja_slug: teste
dono_user_id: 940a5918-cb7a-4a52-9736-1dd4a6ec0443
```

### 2. Verificar Usuário Logado no Admin
Abra o console do navegador em `/admin` e veja os logs:

```javascript
🔍 [useRealtimeOrders] Auth data: 940a5918-cb7a-4a52-9736-1dd4a6ec0443
🏪 [useRealtimeOrders] Store query result: { store: {...}, storeError: null }
✅ [useRealtimeOrders] Found store: f1e86383-302b-4fe5-a342-be5e91efedab Supermercado teste
📦 [useRealtimeOrders] Orders query result: { count: 1, error: null, storeId: f1e86383-302b-4fe5-a342-be5e91efedab }
✅ [useRealtimeOrders] Orders loaded: 1
```

### 3. Verificar Todos os Usuários e Lojas
```sql
SELECT 
  u.id as user_id,
  u.email,
  s.id as store_id,
  s.name as store_name,
  s.slug as store_slug
FROM auth.users u
LEFT JOIN stores s ON s.user_id = u.id
ORDER BY u.created_at DESC;
```

## Cenários Possíveis

### Cenário 1: Admin Logado com Usuário Errado
**Problema**: Admin criou conta nova ao invés de usar a conta que criou a loja

**Solução**:
1. Fazer logout em `/admin`
2. Fazer login com o email correto (que criou a loja)
3. Verificar se pedidos aparecem

**Como Identificar**:
```sql
-- Ver qual email criou a loja 'teste'
SELECT 
  s.name,
  s.slug,
  u.email as owner_email
FROM stores s
JOIN auth.users u ON u.id = s.user_id
WHERE s.slug = 'teste';
```

### Cenário 2: Loja Sem user_id
**Problema**: Loja foi criada sem associar a um usuário

**Solução**:
```sql
-- Associar loja ao usuário correto
UPDATE stores 
SET user_id = 'USER_ID_DO_ADMIN'
WHERE slug = 'teste';
```

**Como Identificar**:
```sql
-- Ver lojas sem dono
SELECT id, name, slug, user_id
FROM stores
WHERE user_id IS NULL;
```

### Cenário 3: Múltiplos Usuários, Uma Loja
**Problema**: Admin criou nova conta mas loja pertence à conta antiga

**Solução Temporária**:
```sql
-- Transferir loja para novo usuário
UPDATE stores 
SET user_id = 'NOVO_USER_ID'
WHERE slug = 'teste';
```

**Solução Permanente**:
- Deletar conta duplicada
- Usar sempre a mesma conta

### Cenário 4: RLS Bloqueando Acesso
**Problema**: Row Level Security está impedindo acesso

**Solução**:
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- Temporariamente desabilitar RLS (APENAS PARA DEBUG)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Depois de testar, reabilitar
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

## Solução Definitiva

### Opção 1: Corrigir user_id da Loja
Se o admin está logado com o usuário correto, mas a loja tem `user_id` errado:

```sql
-- 1. Ver qual user_id o admin está usando
-- (veja no console do navegador os logs)

-- 2. Atualizar loja para esse user_id
UPDATE stores 
SET user_id = 'USER_ID_DO_ADMIN_LOGADO'
WHERE slug = 'teste';

-- 3. Verificar
SELECT id, name, slug, user_id 
FROM stores 
WHERE slug = 'teste';
```

### Opção 2: Admin Fazer Login com Conta Correta
Se a loja tem o `user_id` correto, mas admin está logado com conta errada:

```sql
-- 1. Ver qual email é dono da loja
SELECT 
  s.name,
  s.slug,
  u.email as owner_email
FROM stores s
JOIN auth.users u ON u.id = s.user_id
WHERE s.slug = 'teste';

-- 2. Admin faz logout e login com esse email
```

### Opção 3: Criar Nova Loja para o Admin Atual
Se admin quer usar conta atual mas loja está em outra conta:

```sql
-- 1. Ver user_id do admin atual (console do navegador)

-- 2. Criar nova loja para esse usuário
INSERT INTO stores (name, slug, user_id, active)
VALUES ('Minha Loja', 'minha-loja', 'USER_ID_ATUAL', true);

-- 3. Transferir pedidos para nova loja (opcional)
UPDATE orders 
SET store_id = 'ID_DA_NOVA_LOJA'
WHERE store_id = 'ID_DA_LOJA_ANTIGA';
```

## Verificação Pós-Correção

### 1. Console do Navegador
Abra `/admin` e verifique os logs:

```javascript
✅ [useRealtimeOrders] Found store: xxx Supermercado teste
✅ [useRealtimeOrders] Orders loaded: 1
```

### 2. Dashboard
Deve mostrar:
```
🔔 Novos Pedidos
1
[Card do pedido aparece aqui]
```

### 3. SQL
```sql
-- Verificar que tudo está correto
SELECT 
  o.id,
  o.customer_name,
  o.status,
  s.name as store_name,
  s.user_id as store_owner,
  u.email as owner_email
FROM orders o
JOIN stores s ON s.id = o.store_id
JOIN auth.users u ON u.id = s.user_id
WHERE o.id = 'SEU_PEDIDO_ID';
```

## Prevenção

### 1. Sempre Usar Mesma Conta
- Salvar credenciais de login
- Não criar múltiplas contas
- Usar recuperação de senha se esquecer

### 2. Verificar Associação ao Criar Loja
```typescript
// No código de criação de loja
const { data: { user } } = await supabase.auth.getUser();

const { data: store } = await supabase
  .from("stores")
  .insert({
    name: "Minha Loja",
    slug: "minha-loja",
    user_id: user.id,  // ✅ Sempre associar ao usuário logado
    active: true
  })
  .select()
  .single();

console.log('Loja criada para user:', user.id);
```

### 3. Logs de Debug
Os logs adicionados em `useRealtimeOrders` ajudam a identificar o problema:

```typescript
console.log('🔍 [useRealtimeOrders] Auth data:', authData.user?.id);
console.log('🏪 [useRealtimeOrders] Store query result:', { store, storeError });
console.log('✅ [useRealtimeOrders] Found store:', store.id, store.name);
console.log('📦 [useRealtimeOrders] Orders query result:', { count: data?.length });
```

## Checklist de Troubleshooting

- [ ] Verificar `store_id` do pedido no banco
- [ ] Verificar `user_id` da loja no banco
- [ ] Verificar qual `user_id` está logado no admin (console)
- [ ] Comparar `user_id` logado com `user_id` da loja
- [ ] Se diferentes, corrigir um dos dois
- [ ] Recarregar página `/admin`
- [ ] Verificar se pedidos aparecem
- [ ] Verificar logs no console
- [ ] Testar criar novo pedido
- [ ] Verificar se novo pedido aparece instantaneamente

## Comandos Úteis

### Ver Situação Atual
```sql
-- Resumo completo
SELECT 
  'Loja' as tipo,
  s.id,
  s.name,
  s.slug,
  s.user_id,
  u.email as owner_email,
  COUNT(o.id) as total_pedidos
FROM stores s
LEFT JOIN auth.users u ON u.id = s.user_id
LEFT JOIN orders o ON o.store_id = s.id
WHERE s.slug = 'teste'
GROUP BY s.id, s.name, s.slug, s.user_id, u.email;
```

### Corrigir Associação
```sql
-- Opção A: Atualizar loja para novo usuário
UPDATE stores 
SET user_id = 'NOVO_USER_ID'
WHERE slug = 'teste';

-- Opção B: Transferir pedidos para nova loja
UPDATE orders 
SET store_id = 'NOVA_STORE_ID'
WHERE store_id = 'ANTIGA_STORE_ID';
```

### Limpar Dados de Teste
```sql
-- Deletar pedidos de teste
DELETE FROM orders 
WHERE customer_name LIKE '%teste%' 
OR customer_name LIKE '%test%';

-- Deletar lojas duplicadas
DELETE FROM stores 
WHERE slug = 'teste-duplicado';

-- Deletar usuários sem loja
DELETE FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM stores WHERE user_id IS NOT NULL);
```

## Conclusão

O problema ocorre quando há descompasso entre:
- `user_id` do admin logado
- `user_id` associado à loja
- `store_id` dos pedidos

A solução é garantir que esses três IDs estejam alinhados. Use os logs de debug e queries SQL para identificar onde está o desalinhamento e corrija conforme os cenários acima.

**Dica**: Sempre use a mesma conta de admin e verifique os logs no console ao acessar `/admin` para identificar problemas rapidamente.
