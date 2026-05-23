import { api } from "@/lib/api"
import type { IAuditEntry } from "./types"

export async function apiFetchAuditLogs(): Promise<IAuditEntry[]> {
  const { data } = await api.get<{ events: IAuditEntry[] }>("/audit/changelog")
  return data.events ?? []
}
