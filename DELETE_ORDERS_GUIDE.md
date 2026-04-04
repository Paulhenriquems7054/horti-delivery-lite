# 🗑️ Guia de Exclusão de Pedidos

## Visão Geral

O sistema agora permite que admins excluam pedidos de teste e, opcionalmente, pedidos já concluídos. Isso é útil para:
- Limpar pedidos de teste durante desenvolvimento
- Remover pedidos duplicados
- Manter o histórico limpo (opcional para pedidos concluídos)

## Funcionalidades

### 1. Exclusão de Pedidos em Andamento
**Status permitidos**: Pendente, Separando, Na Rota

**Como funciona**:
- Botão de lixeira (🗑️) aparece em cada card de pedido
- Primeiro clique: Pede confirmação (ícone muda para ⚠️)
- Segundo clique (em 3 segundos): Confirma e exclui
- Após 3 segundos sem confirmar: Cancela automaticamente

**Localização**: Ao lado dos botões de ação em cada coluna do Kanban

### 2. Exclusão de Pedidos Concluídos (Opcional)
**Status**: Entregue

**Como ativar**:
1. No painel admin, acima do Kanban
2. Encontre o toggle "Permitir excluir pedidos concluídos"
3. Ative o switch
4. Agora pedidos concluídos mostram botão de exclusão

**Por que é opcional?**
- Pedidos concluídos são parte do histórico financeiro
- Exclusão pode afetar relatórios e analytics
- Recomendado manter desativado em produção

## Interface

### Toggle de Configuração
```
┌─────────────────────────────────────────────────┐
│ 🗑️ Permitir excluir pedidos concluídos         │
│    Ative para poder deletar pedidos já         │
│    entregues                              [OFF] │
└─────────────────────────────────────────────────┘
```

### Botão de Exclusão (Pedidos em Andamento)
```
┌──────────────────────────────┐
│ João Silva          R$ 45,90 │
│ #abc123                      │
│ Rua das Flores, 123          │
│                              │
│ [Preparar 🍳] [🗑️] [📞]      │
└──────────────────────────────┘
```

### Botão de Exclusão (Pedidos Concluídos - Quando Ativado)
```
┌──────────────────────────────┐
│ Maria Santos        R$ 67,50 │
│ #def456                      │
│ Av. Principal, 456           │
│                              │
│ [🗑️ Excluir]                 │
└──────────────────────────────┘
```

### Confirmação de Exclusão
```
Primeiro clique:
┌──────────────────────────────┐
│ [⚠️]  ← Ícone muda            │
└──────────────────────────────┘
Toast: "Clique novamente para confirmar a exclusão"

Segundo clique (em 3s):
┌──────────────────────────────┐
│ [⟳]  ← Spinner de loading    │
└──────────────────────────────┘
Toast: "Pedido excluído com sucesso"
```

## Fluxo de Exclusão

### Pedidos em Andamento (Sempre Permitido)
```
1. Admin vê pedido em "Pendente", "Separando" ou "Na Rota"
   ↓
2. Clica no botão 🗑️
   ↓
3. Botão muda para ⚠️ (vermelho)
   ↓
4. Toast: "Clique novamente para confirmar"
   ↓
5. Admin clica novamente (em 3 segundos)
   ↓
6. Pedido é excluído
   ↓
7. Toast: "Pedido excluído com sucesso"
   ↓
8. Card desaparece do Kanban
```

### Pedidos Concluídos (Requer Ativação)
```
1. Admin ativa toggle "Permitir excluir pedidos concluídos"
   ↓
2. Botão "Excluir" aparece em pedidos concluídos
   ↓
3. Admin clica em "Excluir"
   ↓
4. Botão muda para "⚠️ Confirmar" (vermelho)
   ↓
5. Toast: "Clique novamente para confirmar"
   ↓
6. Admin clica em "Confirmar" (em 3 segundos)
   ↓
7. Pedido é excluído
   ↓
8. Toast: "Pedido excluído com sucesso"
```

### Tentativa de Excluir Concluído (Sem Ativação)
```
1. Admin tenta excluir pedido concluído
   ↓
2. Toggle está desativado
   ↓
3. Toast de erro: "Exclusão de pedidos concluídos está desabilitada"
   ↓
4. Pedido não é excluído
```

## Comportamento Técnico

### Cascade Delete
Quando um pedido é excluído, os itens relacionados são automaticamente removidos:

```sql
-- Pedido
DELETE FROM orders WHERE id = 'xxx';

-- Itens (deletados automaticamente por CASCADE)
-- DELETE FROM order_items WHERE order_id = 'xxx';

-- Tracking (deletado automaticamente por CASCADE)
-- DELETE FROM order_tracking WHERE order_id = 'xxx';
```

### Realtime Update
Quando um pedido é excluído:
1. Banco de dados remove o registro
2. Supabase Realtime notifica todos os clientes conectados
3. Admin vê o card desaparecer instantaneamente
4. Outros admins (se houver) também veem a atualização

### Segurança
- Apenas admins autenticados podem excluir
- Filtro por `store_id` garante que admin só exclui pedidos da própria loja
- RLS (Row Level Security) no Supabase valida permissões

## Estados do Botão

### Estado Normal
```typescript
<Trash2 className="h-3.5 w-3.5" />
// Cor: text-red-600
// Fundo: bg-red-50
```

### Estado de Confirmação
```typescript
<AlertTriangle className="h-3.5 w-3.5" />
// Cor: text-white
// Fundo: bg-red-500
```

### Estado de Loading
```typescript
<RefreshCw className="h-3.5 w-3.5 animate-spin" />
// Cor: text-white (se confirmando) ou text-red-600
// Fundo: bg-red-500 (se confirmando) ou bg-red-50
```

## Código Relevante

### Hook de Exclusão
```typescript
// src/hooks/useOrders.ts
export async function deleteOrder(orderId: string) {
  // order_items serão deletados automaticamente por CASCADE
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId);
  if (error) throw error;
}
```

### Lógica de Confirmação
```typescript
// src/pages/Admin.tsx
const handleDeleteOrder = async (orderId: string, orderStatus: string) => {
  // Verifica se pode deletar pedidos concluídos
  if (orderStatus === "delivered" && !allowDeleteDelivered) {
    toast.error("Exclusão de pedidos concluídos está desabilitada");
    return;
  }

  // Pede confirmação
  if (confirmDelete !== orderId) {
    setConfirmDelete(orderId);
    toast.warning("Clique novamente para confirmar a exclusão");
    setTimeout(() => setConfirmDelete(null), 3000);
    return;
  }

  // Exclui
  setDeletingOrder(orderId);
  try {
    await deleteOrder(orderId);
    toast.success("Pedido excluído com sucesso");
    setConfirmDelete(null);
  } catch (error) {
    toast.error("Erro ao excluir pedido");
  } finally {
    setDeletingOrder(null);
  }
};
```

## Casos de Uso

### 1. Limpar Pedidos de Teste
**Cenário**: Durante desenvolvimento, admin cria vários pedidos de teste

**Solução**:
1. Acesse `/admin`
2. Encontre os pedidos de teste
3. Clique no botão 🗑️ em cada um
4. Confirme a exclusão
5. Pedidos são removidos

### 2. Remover Pedido Duplicado
**Cenário**: Cliente fez pedido duas vezes por engano

**Solução**:
1. Identifique o pedido duplicado
2. Verifique qual manter (geralmente o mais recente)
3. Exclua o pedido duplicado
4. Mantenha apenas um pedido válido

### 3. Limpar Histórico Antigo (Opcional)
**Cenário**: Admin quer remover pedidos muito antigos já concluídos

**Solução**:
1. Ative "Permitir excluir pedidos concluídos"
2. Vá para coluna "Concluído"
3. Exclua pedidos antigos um por um
4. Desative o toggle após terminar

## Boas Práticas

### ✅ Recomendado
- Excluir pedidos de teste durante desenvolvimento
- Remover pedidos duplicados imediatamente
- Manter toggle de exclusão de concluídos DESATIVADO em produção
- Fazer backup antes de excluir pedidos em massa

### ❌ Não Recomendado
- Excluir pedidos concluídos em produção (afeta relatórios)
- Deixar toggle de exclusão de concluídos sempre ativado
- Excluir pedidos sem verificar se são duplicados
- Excluir pedidos sem confirmar com o cliente

## Alternativas à Exclusão

### Para Pedidos Concluídos
Ao invés de excluir, considere:

1. **Arquivar** (futuro): Mover para tabela de arquivos
2. **Marcar como cancelado**: Mudar status para "cancelled"
3. **Filtrar na visualização**: Ocultar pedidos antigos na UI
4. **Exportar e limpar**: Exportar para Excel antes de excluir

### Para Pedidos de Teste
1. **Usar ambiente de staging**: Testar em banco separado
2. **Prefixo no nome**: Nomear como "TESTE - João Silva"
3. **Limpar periodicamente**: Excluir todos os testes de uma vez

## Impacto da Exclusão

### O que é Afetado
- ✅ Pedido é removido do banco
- ✅ Itens do pedido são removidos (CASCADE)
- ✅ Tracking é removido (CASCADE)
- ✅ Card desaparece do Kanban
- ✅ Contadores são atualizados
- ✅ Receita é recalculada

### O que NÃO é Afetado
- ❌ Produtos não são deletados
- ❌ Cliente não é notificado
- ❌ Cupom usado não é restaurado
- ❌ Logs de auditoria (se implementados)

## Troubleshooting

### Botão de Exclusão Não Aparece em Concluídos
**Causa**: Toggle está desativado
**Solução**: Ative "Permitir excluir pedidos concluídos"

### Erro ao Excluir
**Causa**: Constraint de foreign key ou permissão
**Solução**: 
1. Verifique se admin tem permissão
2. Verifique RLS no Supabase
3. Veja console para erro específico

### Confirmação Expira Muito Rápido
**Causa**: Timeout de 3 segundos
**Solução**: Ajuste o timeout no código:
```typescript
setTimeout(() => setConfirmDelete(null), 5000); // 5 segundos
```

### Pedido Não Desaparece Após Exclusão
**Causa**: Realtime não está funcionando
**Solução**:
1. Recarregue a página
2. Verifique conexão com Supabase
3. Verifique se Realtime está habilitado

## Segurança e Auditoria

### Logs Recomendados
Para produção, considere adicionar logs de auditoria:

```typescript
// Antes de excluir
await logAuditEvent("delete_order", storeId, {
  order_id: orderId,
  customer_name: order.customer_name,
  total: order.total,
  status: order.status,
  deleted_by: adminUserId,
  deleted_at: new Date().toISOString()
});

// Depois exclui
await deleteOrder(orderId);
```

### Backup Antes de Excluir
Para pedidos importantes:

```typescript
// Exportar pedido antes de excluir
const orderBackup = await supabase
  .from("orders")
  .select("*, order_items(*)")
  .eq("id", orderId)
  .single();

// Salvar em arquivo ou tabela de backup
await saveBackup(orderBackup);

// Depois exclui
await deleteOrder(orderId);
```

## Conclusão

A funcionalidade de exclusão de pedidos oferece flexibilidade para admins gerenciarem pedidos de teste e, opcionalmente, pedidos concluídos. O sistema de confirmação dupla e o toggle de proteção garantem que exclusões acidentais sejam minimizadas.

**Recomendação**: Mantenha a exclusão de pedidos concluídos desativada em produção e use apenas para limpar pedidos de teste durante desenvolvimento.
