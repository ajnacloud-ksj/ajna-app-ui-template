export interface IItem {
  id: string
  code: string
  name: string
  description?: string
  category?: string
  /** Backend `items` schema types these as integer / float / boolean. */
  quantity?: number
  price?: number
  is_active?: boolean
  /** Tenant-specific custom fields — keyed by field_key, value always string */
  custom_fields?: Record<string, string>
}

export interface IItemFormData {
  code: string
  name: string
  description: string
  category: string
  quantity: string
  price: string
  is_active: string
  custom_fields?: Record<string, string>
}

export interface IFieldConfig {
  field_key: string
  label: string
  field_type: string
  required: boolean
  hidden: boolean
  order: number
  helper_text?: string
  section?: string
  options?: string
}

export interface IExportResult {
  url: string
  expires_in: number
  format: string
  row_count?: number
  table: string
  tenant_id: string
}

export interface IImportResult {
  success: boolean
  mode: string
  table: string
  total: number
  succeeded: number
  failed: number
  errors: { index: number; id: string; error: string }[]
}
