import { api } from "@/lib/api"
import type {
  IItem,
  IItemFormData,
  IFieldConfig,
  IImportResult,
} from "./types"

interface IApiSuccess<T> {
  success: boolean
  data: T
  count?: number
}

/** Some endpoints wrap responses in { success: true, data: T }; others return T directly. */
function unwrap<T>(response: IApiSuccess<T> | T): T {
  if (
    response &&
    typeof response === "object" &&
    "success" in response &&
    "data" in response
  ) {
    return (response as IApiSuccess<T>).data
  }
  return response as T
}

/**
 * The form keeps all built-in fields as strings (simplest input handling), but the
 * backend `items` schema types `quantity` as integer, `price` as float, and
 * `is_active` as boolean. Coerce on the way out so the SDK schema validator accepts
 * the payload. Empty optional fields are omitted rather than sent as null/NaN.
 */
function toApiPayload(form: IItemFormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    code: form.code,
    name: form.name,
  }
  if (form.description) payload.description = form.description
  if (form.category) payload.category = form.category
  if (form.quantity !== "" && form.quantity != null) {
    const n = Number(form.quantity)
    if (!Number.isNaN(n)) payload.quantity = Math.trunc(n)
  }
  if (form.price !== "" && form.price != null) {
    const n = Number(form.price)
    if (!Number.isNaN(n)) payload.price = n
  }
  if (form.is_active !== "" && form.is_active != null) {
    payload.is_active = form.is_active === "true"
  }
  if (form.custom_fields) payload.custom_fields = form.custom_fields
  return payload
}

export async function listItems(): Promise<IItem[]> {
  const { data } = await api.get<IApiSuccess<IItem[]>>("/items")
  return data.data
}

export async function getItem(itemId: string): Promise<IItem> {
  const { data } = await api.get<IApiSuccess<IItem> | IItem>(`/items/${itemId}`)
  return unwrap(data)
}

export async function createItem(payload: IItemFormData): Promise<IItem> {
  const { data } = await api.post<IApiSuccess<IItem> | IItem>(
    "/items",
    toApiPayload(payload)
  )
  return unwrap(data)
}

export async function updateItem(
  itemId: string,
  payload: IItemFormData
): Promise<IItem> {
  const { data } = await api.put<IApiSuccess<IItem> | IItem>(
    `/items/${itemId}`,
    toApiPayload(payload)
  )
  return unwrap(data)
}

export async function deleteItem(itemId: string): Promise<void> {
  await api.delete(`/items/${itemId}`)
}

export async function getItemFieldConfig(): Promise<IFieldConfig[]> {
  const { data } = await api.get<IApiSuccess<IFieldConfig[]> | IFieldConfig[]>(
    "/field-config/items"
  )
  if (Array.isArray(data)) return data
  if ("data" in data) return data.data
  return []
}

export async function exportItemsAndDownload(filename?: string): Promise<void> {
  const name = filename ?? `items_${new Date().toISOString().slice(0, 10)}.csv`
  const { data: blob } = await api.post<Blob>(
    "/items/export",
    { filename: name },
    { responseType: "blob" }
  )

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function importItemsFile(
  file: File,
  mode: "create" | "upsert" = "create"
): Promise<IImportResult> {
  const form = new FormData()
  form.append("file", file)
  form.append("mode", mode)

  const { data } = await api.post<IImportResult>("/items/import", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return data
}
