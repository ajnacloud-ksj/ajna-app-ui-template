import { api } from "@/lib/api"
import type { ITenant, ITenantFormData } from "./types"

interface IApiSuccess<T> {
  success: boolean
  data: T
}

export async function apiListTenants(): Promise<ITenant[]> {
  const { data } = await api.get<IApiSuccess<ITenant[]>>("/admin/tenants")
  return data.data ?? []
}

export async function apiGetTenant(tenantId: string): Promise<ITenant> {
  const { data } = await api.get<IApiSuccess<ITenant>>(
    `/admin/tenants/${tenantId}`
  )
  return data.data
}

export async function apiCreateTenant(
  payload: ITenantFormData
): Promise<ITenant> {
  const { data } = await api.post<IApiSuccess<ITenant>>(
    "/admin/tenants",
    payload
  )
  return data.data
}

export async function apiUpdateTenant(
  tenantId: string,
  payload: Partial<ITenantFormData>
): Promise<{ message: string }> {
  const { data } = await api.put<IApiSuccess<{ message: string }>>(
    `/admin/tenants/${tenantId}`,
    payload
  )
  return data.data
}

export async function apiBootstrapTenant(tenantId: string): Promise<unknown> {
  const { data } = await api.post<IApiSuccess<unknown>>(
    `/admin/tenants/${tenantId}/bootstrap`
  )
  return data.data
}
