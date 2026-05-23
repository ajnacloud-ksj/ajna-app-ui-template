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
