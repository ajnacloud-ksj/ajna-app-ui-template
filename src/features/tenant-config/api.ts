export interface TenantConfig {
  tenant_id: string
  display_name?: string
  logo_url?: string
  primary_color?: string
  tagline?: string
  app_name?: string
}

const API_BASE = import.meta.env.VITE_API_URL as string

const CACHE_PREFIX = "__tc_"

export function getCachedTenantConfig(slug: string): TenantConfig | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + slug)
    if (raw) return JSON.parse(raw) as TenantConfig
  } catch {
    // sessionStorage unavailable / corrupt entry — treat as cache miss.
  }
  return null
}

/**
 * Machine-readable tenant lookup states from
 * GET /public/tenant/{slug}/config:
 * - `ok`        → 200 with a config payload
 * - `unknown`   → 404 { status: "unknown" } — no such workspace
 * - `not_ready` → 404 { status: "not_ready" } — still provisioning
 * - `disabled`  → 403 { status: "disabled", error: "<message>" }
 * - `error`     → 5xx / network failure / unrecognized response.
 *   Callers MUST fail open on `error` (default branding + login form):
 *   a cockpit blip must never lock the door.
 */
export type TenantResolution =
  | { state: "ok"; config: TenantConfig }
  | { state: "unknown" }
  | { state: "not_ready" }
  | { state: "disabled"; message: string; config?: Partial<TenantConfig> }
  | { state: "error" }

function clearCachedTenantConfig(slug: string): void {
  try {
    sessionStorage.removeItem(CACHE_PREFIX + slug)
  } catch {
    // sessionStorage unavailable — nothing to clear.
  }
}

export async function resolveTenant(slug: string): Promise<TenantResolution> {
  let res: Response
  try {
    res = await fetch(
      `${API_BASE}/public/tenant/${encodeURIComponent(slug)}/config`
    )
  } catch {
    // Network failure — fail open, never treat as "unknown".
    return { state: "error" }
  }

  let data: any = null
  try {
    data = await res.json()
  } catch {
    // Non-JSON body — fall through to status-code handling below.
  }

  if (res.ok) {
    const config = (data?.data ?? data) as TenantConfig | null
    if (config?.tenant_id) {
      // Only successful 200 configs are ever cached — never negatives.
      try {
        sessionStorage.setItem(CACHE_PREFIX + slug, JSON.stringify(config))
      } catch {
        // sessionStorage unavailable — skip caching.
      }
      return { state: "ok", config }
    }
    // 200 without a usable payload — fail open.
    return { state: "error" }
  }

  const status = (data?.status ?? data?.data?.status) as string | undefined

  if (res.status === 404 && status === "unknown") {
    clearCachedTenantConfig(slug)
    return { state: "unknown" }
  }
  if (res.status === 404 && status === "not_ready") {
    return { state: "not_ready" }
  }
  if (res.status === 403 && status === "disabled") {
    clearCachedTenantConfig(slug)
    const message =
      (data?.error as string | undefined) ??
      (data?.message as string | undefined) ??
      "This workspace has been disabled."
    const config = (data?.config ?? data?.data?.config) as
      Partial<TenantConfig> | undefined
    return { state: "disabled", message, config }
  }

  // 5xx, missing/unrecognized status, or anything else — fail open.
  return { state: "error" }
}

async function fetchTenantConfig(slug: string): Promise<TenantConfig | null> {
  const resolution = await resolveTenant(slug)
  return resolution.state === "ok" ? resolution.config : null
}

export async function getTenantConfig(
  slug: string
): Promise<TenantConfig | null> {
  const cached = getCachedTenantConfig(slug)
  if (cached) {
    fetchTenantConfig(slug)
    return cached
  }
  return fetchTenantConfig(slug)
}
