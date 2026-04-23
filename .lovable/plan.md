

# Corrigir hidratação de memberships após login

## Causa raiz

A policy `SELECT` da tabela `store_members` usa `is_store_member(store_id)`, que por sua vez faz `SELECT FROM store_members`. Isso cria uma dependência circular: para ler a própria linha de membership, o usuário precisaria já ser reconhecido como membro pela mesma policy que está tentando avaliar. Resultado: a query do frontend retorna `[]` mesmo com a linha existindo (confirmado via service role: a linha do usuário `56ef4a2c…` na loja `floricultura-das-flores` existe).

O código do `AuthContext` está correto — listener primeiro, `setTimeout(0)` para evitar deadlock, embed `store:stores(...)`. O problema é exclusivamente RLS.

## Correção (1 migration SQL)

Substituir a policy de `SELECT` em `store_members` por uma regra direta, sem chamar `is_store_member`:

```sql
drop policy "store_members: membros da loja podem ver" on public.store_members;

-- O usuário sempre vê as próprias linhas de membership (necessário para hidratar a sessão).
create policy "store_members: usuário vê os próprios"
on public.store_members
for select
to authenticated
using (user_id = auth.uid());

-- Membros da mesma loja podem ver os colegas (sem recursão: usa a policy acima
-- para resolver is_store_member em outra avaliação de query).
create policy "store_members: membros da mesma loja"
on public.store_members
for select
to authenticated
using (is_store_member(store_id));
```

A segunda policy mantém o comportamento original para listar colegas de loja; a primeira quebra o ciclo permitindo que o usuário enxergue ao menos a própria linha — que é o que `AuthContext.hydrate()` precisa.

Policies são OR, então as duas coexistem sem conflito.

## Verificação após aplicar

1. Logout + login com `floriculturadasflores@teste.com`.
2. `AdminDashboard` deve carregar com a loja "Floricultura das Flores" no header em vez da mensagem "não está vinculado".
3. `useActiveStore()` retorna `{ slug: "floricultura-das-flores", … }`.

## Não muda

`AuthContext.tsx`, `useActiveStore.ts`, `AdminLayout.tsx`, função `is_store_member`, demais policies, schema das tabelas. Apenas a policy de SELECT em `store_members`.

