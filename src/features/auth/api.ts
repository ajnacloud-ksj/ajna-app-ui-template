import { api } from "@/lib/api"
import type { ILoginResponse, IRoleDefinition, ITenant } from "./types"

export async function loginApi(
  username: string,
  password: string
): Promise<ILoginResponse> {
  const { data } = await api.post<ILoginResponse>("/auth/login", {
    username,
    password,
  })
  return data
}

export async function apiFetchPermissions(): Promise<IRoleDefinition> {
  const { data } = await api.get<IRoleDefinition>("/auth/permissions")
  return data
}

export async function listTenants(): Promise<ITenant[]> {
  const { data } = await api.get<{ data: ITenant[] }>("/admin/tenants")
  return data.data
}
