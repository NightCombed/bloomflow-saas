

# Ajustes finais antes da migração

Três refinamentos pontuais ao plano aprovado. Tudo o mais (schema, RLS, RPC, fases de migração) permanece igual.

## 1. `order_number` seguro por loja (anti-colisão)

Criar tabela auxiliar de contadores com lock transacional dentro da RPC:

```sql
create table public.store_order_counters (
  store_id uuid primary key references stores(id) on delete cascade,
  last_number integer not null default 0
);
```

Dentro de `create_public_order`, antes de inserir o pedido:

```sql
insert into store_order_counters (store_id, last_number)
values (v_store_id, 1)
on conflict (store_id)
do update set last_number = store_order_counters.last_number + 1
returning last_number into v_next;

v_order_number := lpad(v_next::text, 5, '0');  -- ex: "00042"
```

O `ON CONFLICT DO UPDATE` adquire row-level lock automaticamente, garantindo atomicidade mesmo em inserts concorrentes. Sem race condition, sem `MAX()+1` manual, sem sequence global vazando contagem entre lojas.

A constraint `unique(store_id, order_number)` em `orders` continua como segunda barreira.

## 2. Tabela `stores` — superfície pública mínima

Confirmar que `stores` contém apenas: `id`, `name`, `slug`, `status`, `created_at`, `updated_at`. Nada de telefone, e-mail, billing, tokens, owner direto.

Política RLS:
- `SELECT` público (necessário para resolver `/loja/:slug`)
- `UPDATE`/`DELETE` apenas para membros (`is_store_member(id)`)
- `INSERT` apenas via fluxo de onboarding autenticado (sem policy pública)

Dados de contato sensíveis ficam em `store_settings` (também SELECT público, mas separável no futuro se precisarmos esconder algum campo).

## 3. Storage — leitura pública, upload autenticado

Buckets `product-images` e `store-logos` marcados como `public = true` (leitura via CDN sem auth).

Policies em `storage.objects`:

```sql
-- Upload: apenas autenticados
create policy "auth upload product-images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images');

-- Update/Delete: apenas autenticados
create policy "auth modify product-images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images');

create policy "auth delete product-images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images');
```

Mesmas três policies para `store-logos`. Leitura pública herdada do flag `public=true` do bucket.

Refinamento por `store_id` no path (`{store_id}/{file}`) fica para fase futura — agora basta exigir auth.

## Inalterado

Schema das 9 tabelas, RLS via `is_store_member`, assinatura da RPC `create_public_order`, fases de migração (Auth → Catálogo → Frete → Pedidos → Cleanup), seed das lojas demo, escopo (sem pagamento, sem login de cliente).

## Resultado

Plano pronto para execução: numeração de pedidos à prova de concorrência, superfície pública da `stores` validada como mínima, e upload de imagens restrito a usuários autenticados.

