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

export type IFieldConfigFormData = Partial<IFieldConfig> & {
  field_key: string
}
