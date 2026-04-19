

## Problema
O fix anterior ainda dispara o bloqueio porque o `href` é atualizado **dentro** do `onClick` após um `await form.trigger()`. O `await` quebra o "user activation" do clique — quando o navegador finalmente segue o link, já não considera mais como ação direta do usuário, e bloqueia.

Além disso, se o form for inválido chamamos `e.preventDefault()` — ok — mas no caminho válido o link navega com o `href` antigo (placeholder `https://wa.me/<numero>` sem mensagem), porque a mutação do `href` ocorre depois do await e o browser pode já ter capturado o href original.

## Correção

Trocar a estratégia: **manter o `href` sempre atualizado em tempo real** via `useMemo`/efeito reativo aos campos do form, em vez de atualizar no `onClick`.

Passos em `src/pages/public/PublicCheckout.tsx`:

1. Usar `form.watch()` para observar `name`, `phone`, `address`, `deliveryDate`, `notes` em tempo real.
2. Computar `whatsappHref` com `useMemo` — sempre contém a URL `https://wa.me/<numero>?text=<mensagem-atual>` (mesmo que o form esteja parcialmente preenchido).
3. Renderizar o `<a href={whatsappHref} target="_blank" rel="noopener noreferrer">` sem `onClick` assíncrono.
4. Validação leve **síncrona** no `onClick`: se campos obrigatórios estiverem vazios, `e.preventDefault()` + toast. Sem `await`, sem `form.trigger()` — assim o user activation é preservado.
5. Remover `whatsappLinkRef` (não é mais necessário).
6. Se `settings?.whatsapp` não existir, não renderizar o link (já é o caso).

Resultado: o clique segue o link instantaneamente, sem await, sem mutação de href no meio do gesto → navegadores modernos (Chrome, Safari, Firefox, Safari iOS) não bloqueiam.

## Arquivo afetado
- `src/pages/public/PublicCheckout.tsx` (apenas)

