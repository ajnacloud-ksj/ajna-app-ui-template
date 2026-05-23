export type TUserRole = "super_admin" | "admin" | "user"

export interface IUserInfo {
  user_id: string
  username: string
  email: string
  role: TUserRole
  tenant_id: string | null
  company_name: string | null
  /** Derived from tenant_id — used as the URL slug */
  company_slug?: string | null
}

export interface ILoginRequest {
  username: string
  password: string
}

export interface ILoginResponse {
  access_token: string
  token_type: string
  user: IUserInfo
}

export interface IRoleDefinition {
  role_id: string
  role_name: string
  default_access: string
  table_access: Record<string, string>
  column_mask: Record<string, unknown>
  row_filters: unknown[]
  is_default: boolean
  tenant_id?: string
}

export interface IPermissions {
  // Items (example domain entity)
  canReadItems: boolean
  canWriteItems: boolean
  canExportItems: boolean
  canImportItems: boolean
  // Admin capabilities
  canManageUsers: boolean
  canConfigureFields: boolean
  canViewAuditLog: boolean
  canConfigureTenant: boolean
  canEditRoles: boolean

  /** Raw role definition from RBAC — for advanced use. */
  role: IRoleDefinition | null
  loading: boolean
}

export interface ITenant {
  id: string
  tenant_id: string
  company_name: string
  contact_email: string
  contact_phone: string
  logo_url: string
  accent_color: string
  tagline: string
  plan: string
  status: "active" | "suspended" | "inactive"
  created_at: string
  updated_at: string
}
