# Guia de Demonstração para o Cliente 🎯

## Status do Sistema: ✅ PRONTO PARA DEMONSTRAÇÃO

O sistema Horti Delivery Lite está completo e funcional para demonstração ao cliente.

---

## 🌐 URLs de Acesso

### Produção (Vercel)
- **Landing Page**: https://horti-delivery.vercel.app
- **Loja do Cliente**: https://horti-delivery.vercel.app/basket (substitua "basket" pelo slug da loja)
- **Login Admin**: https://horti-delivery.vercel.app/login
- **Painel Admin**: https://horti-delivery.vercel.app/admin

### Exemplo com Loja de Teste
Se você tem uma loja com slug "supermercado-teste":
- Cliente: https://horti-delivery.vercel.app/supermercado-teste
- Admin: https://horti-delivery.vercel.app/admin (após login)

---

## 📱 Fluxo de Demonstração Completo

### PARTE 1: Experiência do Cliente (15 min)

#### 1.1 Navegação Inicial
1. Acesse a landing page
2. Mostre o logo e identidade visual
3. Clique em "Começar Agora" ou acesse diretamente `/:slug`

#### 1.2 Visualização de Produtos
✅ **Funcionalidades a demonstrar:**
- Catálogo de produtos com imagens
- Preço por kg SEMPRE visível
- Toggle entre "Por Peso (kg)" e "Por Unidade"
- Modo escuro/claro (botão no canto superior)

#### 1.3 Montagem do Pedido
✅ **Cenário 1: Compra por Peso**
- Selecione "Por Peso (kg)"
- Escolha quantidade em kg (ex: 0.5 kg de tomate)
- Veja o valor calculado no carrinho
- Total do carrinho mostra valor real

✅ **Cenário 2: Compra por Unidade**
- Selecione "Por Unidade"
- Escolha quantidade (ex: 3 unidades de maçã)
- Veja "A pesar" no carrinho (sem valor)
- Total mostra apenas itens por peso

✅ **Cenário 3: Pedido Misto**
- Adicione 2 produtos por peso
- Adicione 2 produtos por unidade
- Mostre que o carrinho separa os dois tipos
- Total = apenas itens por peso

#### 1.4 Finalização do Pedido
1. Clique em "Finalizar Pedido"
2. Preencha dados:
   - Nome do cliente
   - Telefone (WhatsApp)
   - Endereço completo
   - Bairro (taxa de entrega calculada automaticamente)
3. Confirme o pedido
4. Veja a tela de confirmação com:
   - Número do pedido
   - Lista completa de itens
   - Link de rastreamento

#### 1.5 Rastreamento em Tempo Real
1. Clique no link de rastreamento OU
2. Acesse manualmente: `/:slug/pedido/:orderId?phone=xxx`
3. Mostre a timeline de status:
   - 🔵 Pendente
   - 🟡 Preparando
   - 🚚 Saiu para entrega
   - ✅ Entregue
4. Mostre atualização em tempo real (mude status no admin)

---

### PARTE 2: Painel do Admin (20 min)

#### 2.1 Login
1. Acesse `/login`
2. Faça login com credenciais do admin
3. Mostre o painel principal

#### 2.2 Kanban de Pedidos
✅ **Funcionalidades a demonstrar:**

**Visualização:**
- 4 colunas: Pendente, Preparando, Saiu para Entrega, Entregue
- Cards com informações do pedido
- Drag & drop entre colunas
- Modo escuro/claro

**Ações em cada pedido:**
1. **⚖️ Pesar Itens** (para produtos por unidade)
   - Clique no botão de balança
   - Insira peso real de cada item
   - Sistema calcula valor final
   - Total do pedido atualiza automaticamente

2. **📸 Registrar Cupom Fiscal**
   - Clique no botão de câmera
   - Tire foto do cupom OU faça upload
   - Insira valor total do cupom
   - Valor atualiza no pedido
   - Cliente vê foto no rastreamento

3. **💬 Chamar no WhatsApp**
   - Clique no botão do WhatsApp
   - Abre conversa direta com cliente
   - Mensagem pré-formatada com detalhes do pedido

4. **🗑️ Excluir Pedido**
   - Clique uma vez (botão fica vermelho)
   - Clique novamente em 3 segundos para confirmar
   - Pedidos concluídos: toggle para habilitar exclusão

#### 2.3 Gerenciamento de Produtos
1. Clique em "🛒 Produtos" no menu
2. Mostre as seções:

**Configurações do Catálogo:**
- Título principal da loja
- Valor mínimo para pedido
- Botão salvar alterações

**Taxas de Entrega / Bairros:**
- Adicionar bairro + taxa
- Lista de bairros cadastrados
- Excluir bairros

**Adicionar Mercadoria:**
- Formulário individual (nome, medida, preço, foto)
- Importação em massa (CSV/TXT)

**Itens Visíveis aos Clientes:**
- Lista de produtos na cesta ativa
- Editar produto (inline)
- Remover da cesta
- Upload de foto

**Todos os Produtos da Loja:**
- Clique em "Mostrar Todos"
- Produtos "Na Cesta" (verde) com edição/exclusão
- Produtos "Fora da Cesta" (amarelo) com:
  - Botão + para adicionar à cesta
  - Botão de edição (lápis azul)
  - Botão de exclusão (lixeira vermelha)

#### 2.4 Rastreamento de Pedidos
1. Clique em "📦 Rastrear Pedido"
2. Insira código do pedido
3. Veja detalhes completos
4. Mostre que funciona sem login

---

## 🎨 Recursos Visuais a Destacar

### Design Responsivo
- ✅ Funciona perfeitamente em celular
- ✅ Funciona perfeitamente em tablet
- ✅ Funciona perfeitamente em desktop

### Modo Escuro/Claro
- ✅ Toggle em todas as páginas
- ✅ Preferência salva no navegador
- ✅ Cores adaptativas em todos os componentes

### Feedback Visual
- ✅ Toasts de sucesso/erro
- ✅ Loading states
- ✅ Animações suaves
- ✅ Cores intuitivas (verde=sucesso, vermelho=erro, amarelo=atenção)

---

## 🔥 Diferenciais do Sistema

### 1. Venda Dupla (Peso + Unidade)
- Cliente escolhe como quer comprar
- Preço por kg sempre visível
- Pesagem posterior para compras por unidade

### 2. Rastreamento em Tempo Real
- Cliente acompanha status do pedido
- Atualização automática via Supabase Realtime
- Sem necessidade de login

### 3. Gestão Completa de Produtos
- Visualização de TODO o catálogo
- Edição inline rápida
- Organização por categorias (na cesta / fora da cesta)

### 4. Registro de Cupom Fiscal
- Foto do cupom anexada ao pedido
- Valor real registrado
- Cliente vê comprovante no rastreamento

### 5. Sistema de Pesagem
- Admin pesa produtos vendidos por unidade
- Cálculo automático do valor final
- Histórico de pesagens

### 6. Multi-tenant
- Cada loja tem seu próprio slug
- Dados isolados por loja
- Admin vê apenas pedidos da sua loja

---

## ⚠️ Pontos de Atenção na Demonstração

### 1. Fluxo de Pesagem
**Explique claramente:**
- Cliente compra "3 unidades de maçã"
- Carrinho mostra "A pesar" (sem valor)
- Admin pesa as 3 maçãs (ex: 0.8 kg)
- Sistema calcula: 0.8 kg × preço/kg = valor final
- Total do pedido atualiza

### 2. Cupom Fiscal
**Explique o propósito:**
- Admin vai ao mercado/fornecedor
- Compra os produtos do pedido
- Tira foto do cupom fiscal
- Registra valor real pago
- Cliente vê transparência total

### 3. Taxas de Entrega
**Mostre a automação:**
- Admin cadastra bairros + taxas
- Cliente seleciona bairro no checkout
- Taxa é adicionada automaticamente
- Total final = produtos + taxa de entrega

### 4. Exclusão de Pedidos
**Explique a segurança:**
- Duplo clique para confirmar
- Timeout de 3 segundos
- Pedidos concluídos: toggle para proteger
- Evita exclusões acidentais

---

## 📊 Dados de Teste Sugeridos

### Produtos de Exemplo
1. Tomate (R$ 8,90/kg) - venda dupla
2. Alface (R$ 3,50/un) - venda dupla
3. Banana (R$ 6,50/kg) - venda dupla
4. Maçã (R$ 12,00/kg) - venda dupla

### Bairros de Exemplo
- Centro: R$ 5,00
- Jardim América: R$ 8,00
- Vila Nova: R$ 10,00

### Pedido de Teste Completo
**Cliente:** João Silva
**Telefone:** (11) 98765-4321
**Endereço:** Rua das Flores, 123
**Bairro:** Centro

**Itens:**
- 1 kg de Tomate (por peso) = R$ 8,90
- 2 unidades de Alface (por unidade) = A pesar
- 0.5 kg de Banana (por peso) = R$ 3,25
- 3 unidades de Maçã (por unidade) = A pesar

**Total inicial:** R$ 12,15 (apenas itens por peso)
**Taxa de entrega:** R$ 5,00
**Total com frete:** R$ 17,15

**Após pesagem:**
- 2 Alfaces = 0.6 kg × R$ 3,50 = R$ 2,10
- 3 Maçãs = 0.9 kg × R$ 12,00 = R$ 10,80

**Total final:** R$ 30,05 + R$ 5,00 = R$ 35,05

---

## ✅ Checklist Pré-Demonstração

### Preparação do Ambiente
- [ ] Verificar se o site está no ar (Vercel)
- [ ] Testar login do admin
- [ ] Cadastrar produtos de exemplo
- [ ] Cadastrar bairros com taxas
- [ ] Limpar pedidos de teste antigos
- [ ] Testar modo escuro/claro

### Preparação de Dados
- [ ] Ter pelo menos 5 produtos cadastrados
- [ ] Ter pelo menos 3 bairros cadastrados
- [ ] Ter 1 pedido de exemplo em cada status
- [ ] Ter fotos de produtos (URLs válidas)

### Teste de Funcionalidades
- [ ] Criar pedido como cliente
- [ ] Mover pedido entre colunas (admin)
- [ ] Pesar itens de um pedido
- [ ] Registrar cupom fiscal
- [ ] Enviar mensagem WhatsApp
- [ ] Rastrear pedido (cliente)
- [ ] Editar produto
- [ ] Excluir produto

### Dispositivos
- [ ] Testar em celular (Chrome/Safari)
- [ ] Testar em desktop (Chrome)
- [ ] Testar modo escuro em ambos

---

## 🎯 Roteiro de Demonstração (30 min)

### Minutos 0-5: Introdução
- Apresente o conceito do sistema
- Mostre a landing page
- Explique o modelo de negócio

### Minutos 5-15: Jornada do Cliente
- Navegue pela loja
- Monte um pedido misto (peso + unidade)
- Finalize o pedido
- Mostre o rastreamento

### Minutos 15-25: Painel Admin
- Mostre o Kanban de pedidos
- Demonstre pesagem de itens
- Demonstre registro de cupom
- Mova pedido entre status
- Mostre atualização em tempo real no rastreamento

### Minutos 25-30: Gestão de Produtos
- Adicione um produto novo
- Edite um produto existente
- Mostre "Todos os Produtos da Loja"
- Configure taxas de entrega

---

## 💡 Dicas para uma Boa Demonstração

1. **Prepare um script**: Não improvise, tenha um roteiro claro
2. **Use dados realistas**: Nomes de produtos, preços e endereços reais
3. **Mostre erros**: Demonstre validações (ex: campo obrigatório)
4. **Destaque diferenciais**: Venda dupla, rastreamento, pesagem
5. **Seja transparente**: Explique limitações se houver
6. **Peça feedback**: Pergunte o que o cliente acha
7. **Mostre mobile**: A maioria dos clientes usa celular
8. **Teste antes**: Faça um dry-run completo antes

---

## 📞 Suporte Durante Demonstração

Se algo der errado durante a demonstração:

1. **Site fora do ar**: Verifique status do Vercel
2. **Erro de login**: Verifique credenciais no Supabase
3. **Produtos não aparecem**: Verifique store_id no banco
4. **Pedidos não aparecem**: Verifique user_id do admin
5. **Imagens quebradas**: Use URLs de imagens válidas

---

## 🚀 Próximos Passos Após Demonstração

Se o cliente aprovar:

1. **Configuração da loja dele:**
   - Criar slug personalizado
   - Cadastrar produtos reais
   - Configurar bairros e taxas
   - Upload de logo/imagens

2. **Treinamento:**
   - Treinar equipe no painel admin
   - Documentar processos internos
   - Criar manual de uso

3. **Go-live:**
   - Divulgar link da loja
   - Monitorar primeiros pedidos
   - Ajustar conforme feedback

---

## ✅ Sistema 100% Funcional

Todas as funcionalidades foram testadas e estão operacionais:
- ✅ Venda por peso e unidade
- ✅ Carrinho inteligente
- ✅ Checkout completo
- ✅ Rastreamento em tempo real
- ✅ Kanban de pedidos
- ✅ Sistema de pesagem
- ✅ Registro de cupom fiscal
- ✅ Gestão completa de produtos
- ✅ Modo escuro/claro
- ✅ Responsivo (mobile/desktop)
- ✅ Multi-tenant

**O sistema está pronto para uso em produção! 🎉**
