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
  } catch {}
  return null
}

async function fetchTenantConfig(slug: string): Promise<TenantConfig | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/tenant/${encodeURIComponent(slug)}/config`
    )
    if (!res.ok) return null
    const data = await res.json()
    const config = (data?.data ?? data) as TenantConfig
    if (config?.tenant_id) {
      try { sessionStorage.setItem(CACHE_PREFIX + slug, JSON.stringify(config)) } catch {}
    }
    return config
  } catch {
    return null
  }
}

export async function getTenantConfig(slug: string): Promise<TenantConfig | null> {
  const cached = getCachedTenantConfig(slug)
  if (cached) {
    fetchTenantConfig(slug)
    return cached
  }
  return fetchTenantConfig(slug)
}
