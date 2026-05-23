import { useQuery } from "@tanstack/react-query"
import { apiFetchAuditLogs } from "./api"

// ── Query Key Factory ──────────────────────────────────────────────────────────
export const auditLogsKeys = {
  all: ["audit-logs"] as const,
  lists: () => [...auditLogsKeys.all, "list"] as const,
}

// ── Custom Hooks ──────────────────────────────────────────────────────────────
export function useAuditLogsQuery() {
  return useQuery({
    queryKey: auditLogsKeys.lists(),
    queryFn: apiFetchAuditLogs,
  })
}
