import { api } from "@/lib/api"
import type { IRoleDefinition } from "./types"

export async function listRoles(): Promise<IRoleDefinition[]> {
  const { data } = await api.get<
    { roles?: IRoleDefinition[] } | IRoleDefinition[]
  >("/admin/rbac/roles")
  if (Array.isArray(data)) return data
  return (data as { roles?: IRoleDefinition[] }).roles ?? []
}

export async function saveRole(
  tenantId: string,
  role: IRoleDefinition
): Promise<void> {
  await api.post("/admin/rbac/roles", { tenant_id: tenantId, role })
}
