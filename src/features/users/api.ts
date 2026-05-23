import { api } from "@/lib/api"
import type {
  ITenantUser,
  IInviteUserPayload,
  IInviteUserResult,
  IResetPasswordPayload,
  IResetPasswordResult,
} from "./types"

interface IApiSuccess<T> {
  success: boolean
  data: T
}

export async function listUsers(): Promise<ITenantUser[]> {
  const { data } = await api.get<
    | IApiSuccess<{ users: ITenantUser[]; total: number; tenant_id: string }>
    | { users: ITenantUser[]; total: number; tenant_id: string }
  >("/users")
  if ("data" in data && data.data) return data.data.users ?? []
  if ("users" in data) return (data as { users: ITenantUser[] }).users ?? []
  return []
}

export async function inviteUser(
  payload: IInviteUserPayload
): Promise<IInviteUserResult> {
  const { data } = await api.post<IInviteUserResult>("/users/invite", payload)
  return data
}

export async function updateUserRole(
  username: string,
  role: string
): Promise<void> {
  await api.put(`/users/${encodeURIComponent(username)}/role`, { role })
}

export async function lockUser(username: string): Promise<void> {
  await api.post(`/users/${encodeURIComponent(username)}/lock`)
}

export async function unlockUser(username: string): Promise<void> {
  await api.post(`/users/${encodeURIComponent(username)}/unlock`)
}

export async function resetUserPassword(
  username: string,
  opts: IResetPasswordPayload = {}
): Promise<IResetPasswordResult> {
  const { data } = await api.post<IResetPasswordResult>(
    `/users/${encodeURIComponent(username)}/reset-password`,
    { permanent: true, ...opts }
  )
  return data
}
