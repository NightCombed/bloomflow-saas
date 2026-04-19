/**
 * Tenant resolution strategy:
 *  - Production: subdomain  (rosa-bela.florflow.app)
 *  - Dev/preview: ?store=slug  (lovable.app preview, localhost)
 *  - Future: custom domain table lookup (already typed in Store.custom_domain)
 *
 * Reserved subdomains are NOT treated as tenants (www, app, admin, api, etc.)
 */

const RESERVED = new Set([
  "www", "app", "admin", "api", "auth", "static", "cdn", "id-preview",
  "preview", "localhost",
]);

const ROOT_HOSTS = new Set(["florflow.app", "lovable.app", "lovableproject.com"]);

export function resolveTenantSlug(): string | null {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);

  // 1) Dev override via query string — always wins
  const qs = url.searchParams.get("store");
  if (qs) return qs;

  // 2) Subdomain detection
  const host = url.hostname;
  const parts = host.split(".");

  // Strip known root suffix
  let candidate: string | null = null;
  if (parts.length >= 3) {
    candidate = parts[0];
  }

  if (!candidate) return null;
  if (RESERVED.has(candidate)) return null;
  if (ROOT_HOSTS.has(host)) return null;

  // Lovable preview ids look like "id-preview--xxxx" — never a tenant
  if (candidate.startsWith("id-preview")) return null;

  return candidate;
}
