
## Diagnóstico confirmado

A query do frontend está sendo chamada com o usuário já autenticado.

Evidências observadas no request para `store_members`:
- filtro enviado: `user_id=eq.56ef4a2c-3c56-4fe1-9c83-8eaadd701d08`
- header `Authorization: Bearer ...`
- o JWT tem `sub = 56ef4a2c-3c56-4fe1-9c83-8eaadd701d08`
- portanto, a hidratação não está rodando “cedo demais”; ela já roda com sessão válida

## O que está falhando de fato

O resultado da query não está chegando ao frontend porque o Supabase está respondendo `403 permission denied for table store_members`.

Também há `403 permission denied for table profiles` na outra parte da hidratação.

Isso mostra que o problema atual não é:
- ausência da linha em `store_members`
- `auth.uid()` nulo no momento da chamada
- falha no join com `stores`

O problema é de acesso SQL à tabela exposta via PostgREST:
- a policy RLS existe
- mas o papel `authenticated` não está conseguindo ler `store_members` e `profiles`

## Por que a loja ativa não é populada

Hoje o `AuthContext` faz isso:

```ts
const [profileRes, membersRes] = await Promise.all([...]);
const rows = (membersRes.data ?? []);
setMemberships(rows ...);
```

Como o request volta com erro:
- `membersRes.data` vem `null`
- o código converte isso silenciosamente para `[]`
- `setMemberships([])` é executado
- `useActiveStore()` retorna `null`
- o painel mostra “Você ainda não está vinculado a nenhuma loja.”

Ou seja: o estado não é populado não porque a linha não exista, mas porque a consulta falha e o erro está sendo engolido.

## O que ajustar

### 1) Corrigir privilégios SQL das tabelas usadas na hidratação
Aplicar migration para conceder leitura ao papel autenticado nas tabelas necessárias:

```sql
grant select on table public.profiles to authenticated;
grant select on table public.store_members to authenticated;
```

As policies RLS continuam sendo o filtro real de quais linhas cada usuário pode ver.

### 2) Melhorar o `AuthContext` para não mascarar erro como “sem loja”
Ajustar a hidratação para:
- checar `profileRes.error` e `membersRes.error`
- registrar/logar erro de hidratação
- não transformar erro de permissão em estado vazio silencioso
- opcionalmente expor um `authError` ou fallback visual do tipo “erro ao carregar vínculo da loja”

## Arquivos envolvidos

- `src/contexts/AuthContext.tsx`
- `src/hooks/useActiveStore.ts`
- `supabase/migrations/...sql`

## Resultado esperado após a correção

1. Login continua criando/restaurando sessão normalmente.
2. A query `store_members` continua sendo chamada com o JWT do usuário autenticado.
3. O backend passa a responder com os dados, não com `403`.
4. `memberships` deixa de ser `[]`.
5. `useActiveStore()` retorna a loja `floricultura-das-flores`.
6. O header e o dashboard passam a mostrar a loja ativa.

## Detalhe técnico importante

Neste momento, o frontend não mantém um `store_id ativo` separado na sessão; a loja ativa é derivada de `memberships[0]`. Então, corrigindo a leitura de `store_members`, o estado atual já volta a funcionar sem precisar introduzir uma nova estrutura de sessão.
