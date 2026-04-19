

## Goal
Build the complete public storefront for FlorFlow: catalog, product detail, cart, checkout with WhatsApp fallback. Mobile-first, tenant-scoped, mock data ready to swap for Supabase.

## Architecture

**Cart state** — `src/contexts/CartContext.tsx`
- Items: `{ productId, name, unit_price_cents, quantity, image_url? }`
- Actions: add / remove / updateQty / clear / setNotes (cart-level observations)
- Persisted in `localStorage` with key `florflow:cart:<store.slug>` → strict tenant isolation
- Provider mounted inside `PublicStoreLayout` (so it only exists once a store is resolved)

**Mock orders** — extend `src/lib/mockData.ts` with `createOrder(storeId, payload)` returning a generated order id; pushes into in-memory `orders` + `orderItems` + `customers`.

## Routes (added in `App.tsx` under `/loja/:slug`)

```text
/loja/:slug                       Home (hero + destaques + categorias)
/loja/:slug/produtos              Catálogo completo + filtro categoria + busca
/loja/:slug/categoria/:catSlug    Catálogo filtrado por categoria
/loja/:slug/produto/:productId    Detalhe do produto + qty + add to cart
/loja/:slug/carrinho              Carrinho com edição + observações
/loja/:slug/checkout              Form (nome, tel, endereço, data, obs) + resumo
/loja/:slug/pedido/:orderId       Confirmação + CTA WhatsApp
```

## Components (`src/components/store/`)
- `ProductCard` — card reutilizável (home + catálogo)
- `CategoryPills` — chips de categorias clicáveis
- `CartIconButton` — botão no header com badge de quantidade
- `CartDrawer` — Sheet lateral com mini-carrinho e CTAs
- `QuantityStepper` — controle −/+
- `WhatsAppButton` — botão flutuante + variante inline (usa `settings.whatsapp`)
- `OrderSummary` — resumo sticky no checkout
- `EmptyState` — para carrinho vazio / sem produtos

## Header (`PublicStoreLayout`)
- Adicionar link "Produtos" e ícone do carrinho com badge
- Menu mobile (Sheet) com hamburger
- Botão WhatsApp flutuante fixo (bottom-right) presente em todas as páginas públicas

## Checkout
Form com `react-hook-form` + `zod`:
- Nome (obrigatório, 2-100 chars)
- Telefone (obrigatório, regex BR)
- Bairro / endereço simplificado (obrigatório)
- Data de entrega (Shadcn DatePicker, opcional, ≥ hoje)
- Observações livres (textarea, ≤ 500 chars) com chips de sugestões: "Entregar depois das 18h", "É presente", "Não tocar a campainha", "Deixar com a portaria" → clicar adiciona ao textarea
- Resumo: itens + subtotal + total via `formatBRL`

Dois CTAs:
1. **Finalizar pedido** → `createOrder()`, limpa carrinho, navega para `/pedido/:id` com toast
2. **Enviar pelo WhatsApp** → monta mensagem formatada (itens, total, dados, obs) e abre `https://wa.me/<numero>?text=<encoded>` em nova aba

## Confirmação
Mostra número do pedido, itens, total, dados de entrega, status "Pedido recebido", botão WhatsApp para acompanhar, link "Voltar à loja".

## Design / UX
- Mobile-first: grid 1 col → 2 → 3, sticky CTAs no mobile (carrinho/checkout)
- Mantém paleta verde sálvia + terracota e tipografia *Fraunces* / *Inter* já configuradas
- Cards com `shadow-soft → shadow-elegant` no hover, bordas suaves, gradient backgrounds existentes
- Imagens: produtos sem `image_url` mostram fallback botânico estilizado (gradiente + ícone), preparado para receber URL real depois

## Segurança / qualidade
- Validação zod em todos os inputs (length limits + trim)
- `encodeURIComponent` na URL do WhatsApp
- Sem `dangerouslySetInnerHTML`
- Cart isolado por `store.slug` no localStorage → zero vazamento entre lojas

## Fora de escopo (próximas etapas)
- Pagamento real (requer Lovable Cloud + Stripe)
- Persistência de pedidos em DB
- Login do cliente final / histórico de pedidos
- Upload real de imagens de produto

