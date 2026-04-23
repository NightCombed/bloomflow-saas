drop policy if exists "store_members: membros da loja podem ver" on public.store_members;

create policy "store_members: usuário vê os próprios"
on public.store_members
for select
to authenticated
using (user_id = auth.uid());

create policy "store_members: membros da mesma loja"
on public.store_members
for select
to authenticated
using (public.is_store_member(store_id));