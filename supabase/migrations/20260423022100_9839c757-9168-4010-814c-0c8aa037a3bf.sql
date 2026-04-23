drop policy if exists "profiles: usuário atualiza o próprio" on public.profiles;

create policy "profiles: usuário atualiza o próprio"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and is_super_admin = (select p.is_super_admin from public.profiles p where p.id = auth.uid())
);