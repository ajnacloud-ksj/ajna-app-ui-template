import { api } from "@/lib/api"
import type { IFieldConfig, IFieldConfigFormData } from "./types"

interface IApiSuccess<T> {
  success: boolean
  data: T
  fields?: T
}

export async function getFieldConfig(
  entityType: string
): Promise<IFieldConfig[]> {
  const { data } = await api.get<
    IApiSuccess<IFieldConfig[]> | IFieldConfig[]
  >(`/field-config/${entityType}`)
  if (Array.isArray(data)) return data
  return (
    (data as IApiSuccess<IFieldConfig[]>).data ??
    (data as { fields?: IFieldConfig[] }).fields ??
    []
  )
}

export async function upsertFieldConfig(
  entityType: string,
  field: IFieldConfigFormData
): Promise<IFieldConfig> {
  // Body must be sent as array
  const { data } = await api.post<IApiSuccess<IFieldConfig[]> | IFieldConfig>(
    `/field-config/${entityType}`,
    [field]
  )
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as IApiSuccess<IFieldConfig[]>).data)
  ) {
    return (data as IApiSuccess<IFieldConfig[]>).data[0]
  }
  return data as IFieldConfig
}

export async function deleteFieldConfig(
  entityType: string,
  fieldKey: string
): Promise<void> {
  await api.delete(`/field-config/${entityType}/${encodeURIComponent(fieldKey)}`)
}
