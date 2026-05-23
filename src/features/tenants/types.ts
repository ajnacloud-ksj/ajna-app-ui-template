export type TTenantStatus = "active" | "suspended" | "inactive"

export interface ITenant {
  id: string
  tenant_id: string
  company_name: string
  contact_email: string
  contact_phone: string
  logo_url?: string
  accent_color?: string
  tagline?: string
  plan: string
  status: TTenantStatus
  created_at: string
  updated_at: string
}

export interface ITenantFormData {
  tenant_id: string
  company_name: string
  contact_email: string
  contact_phone: string
  plan: string
  status?: TTenantStatus
}
