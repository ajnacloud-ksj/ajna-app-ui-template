import {
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Eye,
  Loader2,
  Lock,
  Save,
  XCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePermissions } from "@/contexts/permissions-context"
import { useRolesQuery, useSaveRoleMutation } from "@/features/roles/hooks"
import type { IRoleDefinition } from "@/features/roles/types"

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_ORDER = ["super_admin", "admin", "user"]

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  user: "User",
}

const ROLE_BADGE_VARIANT: Record<
  string,
  "destructive" | "default" | "secondary" | "outline"
> = {
  super_admin: "destructive",
  admin: "default",
  user: "secondary",
}

const TABLE_LABELS: Record<string, string> = {
  app_items: "Items (Master Data)",
  app_tenant_config: "Tenant Configuration",
}

// ── Capability definitions ────────────────────────────────────────────────────

function canAccessTable(
  role: IRoleDefinition,
  shortName: string,
  mode: "r" | "w"
): boolean {
  const entry = Object.entries(role.table_access ?? {}).find(([k]) =>
    k.endsWith(shortName)
  )
  const access = entry ? entry[1] : (role.default_access ?? "")
  return mode === "r" ? access.includes("r") : access.includes("w")
}

const CAPABILITIES = [
  {
    id: "read_items",
    label: "View Items",
    description: "Browse and search item master data",
    check: (role: IRoleDefinition) => canAccessTable(role, "app_items", "r"),
  },
  {
    id: "write_items",
    label: "Manage Items",
    description: "Create, edit and delete items",
    check: (role: IRoleDefinition) => canAccessTable(role, "app_items", "w"),
  },
  {
    id: "manage_users",
    label: "Manage Users",
    description: "Invite, change roles and remove users",
    check: (_role: IRoleDefinition, roleId: string) =>
      ["super_admin", "admin"].includes(roleId),
  },
  {
    id: "field_config",
    label: "Configure Fields",
    description: "Customise item field labels and visibility",
    check: (_role: IRoleDefinition, roleId: string) =>
      ["super_admin", "admin"].includes(roleId),
  },
  {
    id: "audit_log",
    label: "View Audit Log",
    description: "See who changed what and when",
    check: (_role: IRoleDefinition, roleId: string) =>
      ["super_admin", "admin"].includes(roleId),
  },
  {
    id: "tenant_config",
    label: "Tenant Configuration",
    description: "Edit tenant settings and branding",
    check: (role: IRoleDefinition) =>
      canAccessTable(role, "app_tenant_config", "w"),
  },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function cycleAccess(current: string): string {
  if (current.includes("w")) return "none"
  if (current.includes("r")) return "rw"
  return "r"
}

function accessLabel(access: string): string {
  if (access.includes("w")) return "rw"
  if (access.includes("r")) return "r"
  return "none"
}

// ── Table Access Grid (editable) ──────────────────────────────────────────────

interface TableAccessGridProps {
  roles: IRoleDefinition[]
  canEdit: boolean
  tenantId: string | null
}

function TableAccessGrid({ roles, canEdit, tenantId }: TableAccessGridProps) {
  const saveMutation = useSaveRoleMutation()

  const tableKeys = Array.from(
    new Set(roles.flatMap((r) => Object.keys(r.table_access ?? {})))
  )

  const [draft, setDraft] = useState<Record<string, Record<string, string>>>(
    {}
  )
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const init: Record<string, Record<string, string>> = {}
    for (const r of roles) {
      init[r.role_id] = { ...(r.table_access ?? {}) }
    }
    setDraft(init)
  }, [roles])

  if (tableKeys.length === 0) return null

  function getAccess(roleId: string, key: string): string {
    return draft[roleId]?.[key] ?? "none"
  }

  function toggle(roleId: string, key: string) {
    setDraft((prev) => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] ?? {}),
        [key]: cycleAccess(prev[roleId]?.[key] ?? "none"),
      },
    }))
    setSaveSuccess((prev) => ({ ...prev, [roleId]: false }))
  }

  function isDirty(role: IRoleDefinition): boolean {
    const orig = role.table_access ?? {}
    const cur = draft[role.role_id] ?? {}
    return JSON.stringify(orig) !== JSON.stringify(cur)
  }

  async function handleSave(role: IRoleDefinition) {
    if (!tenantId) return
    try {
      const updated: IRoleDefinition = {
        ...role,
        table_access: draft[role.role_id] ?? role.table_access,
      }
      await saveMutation.mutateAsync({ tenantId, role: updated })
      setSaveSuccess((prev) => ({ ...prev, [role.role_id]: true }))
      toast.success(`${ROLE_LABELS[role.role_id] ?? role.role_name} saved`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save role"
      )
    }
  }

  const readonlyRoleIds = ["super_admin"]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-foreground">
          Table-Level Access (IbexDB Enforcement)
        </h2>
        {canEdit && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Edit2 className="h-3 w-3" />
            Editable
          </Badge>
        )}
      </div>

      {canEdit && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          Click any cell to cycle access: <strong>none → r → rw → none</strong>
          . Then click Save for that role column. Super Admin always has full
          access and cannot be edited.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[200px]">Table</TableHead>
              {roles.map((r) => (
                <TableHead key={r.role_id} className="text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <Badge
                      variant={ROLE_BADGE_VARIANT[r.role_id] ?? "outline"}
                    >
                      {ROLE_LABELS[r.role_id] ?? r.role_name}
                    </Badge>
                    {canEdit && !readonlyRoleIds.includes(r.role_id) && (
                      <Button
                        variant={isDirty(r) ? "default" : "outline"}
                        size="sm"
                        className="h-6 px-2 text-xs"
                        disabled={
                          !isDirty(r) ||
                          (saveMutation.isPending &&
                            saveMutation.variables?.role.role_id === r.role_id)
                        }
                        onClick={() => handleSave(r)}
                      >
                        {saveMutation.isPending &&
                        saveMutation.variables?.role.role_id === r.role_id ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Saving
                          </>
                        ) : saveSuccess[r.role_id] ? (
                          "Saved!"
                        ) : (
                          <>
                            <Save className="mr-1 h-3 w-3" />
                            Save
                          </>
                        )}
                      </Button>
                    )}
                    {canEdit && readonlyRoleIds.includes(r.role_id) && (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableKeys.map((key) => {
              const shortName = key.split(".").pop() ?? key
              return (
                <TableRow key={key}>
                  <TableCell className="py-2">
                    <p className="text-sm font-medium text-foreground">
                      {TABLE_LABELS[shortName] ?? shortName}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {key}
                    </p>
                  </TableCell>
                  {roles.map((r) => {
                    const isReadonly =
                      !canEdit || readonlyRoleIds.includes(r.role_id)
                    const access = isReadonly
                      ? (r.table_access?.[key] ?? r.default_access ?? "none")
                      : getAccess(r.role_id, key)
                    const canRead = access.includes("r")
                    const canWrite = access.includes("w")
                    const label = accessLabel(access)

                    return (
                      <TableCell
                        key={r.role_id}
                        className={`py-2 text-center ${
                          isReadonly
                            ? ""
                            : "cursor-pointer transition-colors hover:bg-muted/50"
                        }`}
                        onClick={
                          isReadonly ? undefined : () => toggle(r.role_id, key)
                        }
                      >
                        {canWrite ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400"
                            title={
                              isReadonly
                                ? "Read + Write"
                                : "Read + Write — click to change"
                            }
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            {label}
                          </span>
                        ) : canRead ? (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400"
                            title={
                              isReadonly
                                ? "Read only"
                                : "Read only — click to change"
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {label}
                          </span>
                        ) : (
                          <span
                            title={
                              isReadonly
                                ? "No access"
                                : "No access — click to grant read"
                            }
                          >
                            <XCircle className="mx-auto h-4 w-4 text-muted-foreground/40" />
                          </span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RolePermissionsPage() {
  const { canEditRoles, role: currentRole } = usePermissions()
  const tenantId = currentRole?.tenant_id ?? null
  const { data: allRoles = [], isLoading, error } = useRolesQuery()

  const ordered = ROLE_ORDER.map((id) =>
    allRoles.find((r) => r.role_id === id)
  ).filter(Boolean) as IRoleDefinition[]

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Role Permissions
        </h1>
        <p className="text-sm text-muted-foreground">
          {canEditRoles
            ? "View and edit role permissions. Table-level access is enforced server-side by IbexDB."
            : "Read-only view of what each role can do. Permissions are enforced server-side by IbexDB."}
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm font-semibold text-destructive">
            {error instanceof Error ? error.message : "Failed to load roles"}
          </p>
        </div>
      )}

      {/* ── Capability Matrix ── */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Capability Matrix
        </h2>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">Capability</TableHead>
                {isLoading
                  ? ROLE_ORDER.map((id) => (
                      <TableHead key={id} className="text-center">
                        <div className="mx-auto h-5 w-20 animate-pulse rounded bg-muted" />
                      </TableHead>
                    ))
                  : ordered.map((r) => (
                      <TableHead key={r.role_id} className="text-center">
                        <Badge
                          variant={ROLE_BADGE_VARIANT[r.role_id] ?? "outline"}
                        >
                          {ROLE_LABELS[r.role_id] ?? r.role_name}
                        </Badge>
                      </TableHead>
                    ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-2">
                        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                        <div className="mt-1 h-3 w-56 animate-pulse rounded bg-muted/60" />
                      </TableCell>
                      {ROLE_ORDER.map((id) => (
                        <TableCell key={id} className="py-2 text-center">
                          <div className="mx-auto h-4 w-4 animate-pulse rounded-full bg-muted" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : CAPABILITIES.map((cap) => (
                    <TableRow key={cap.id}>
                      <TableCell className="py-2">
                        <p className="text-sm font-medium text-foreground">
                          {cap.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cap.description}
                        </p>
                      </TableCell>
                      {ordered.map((r) => {
                        const allowed = cap.check(r, r.role_id)
                        return (
                          <TableCell key={r.role_id} className="py-2 text-center">
                            {allowed ? (
                              <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="mx-auto h-4 w-4 text-muted-foreground/30" />
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          green = allowed &nbsp;·&nbsp; grey = not permitted for this role
        </p>
      </div>

      {/* ── Table-level grid (editable for admins) ── */}
      {!isLoading && ordered.length > 0 && (
        <TableAccessGrid
          roles={ordered}
          canEdit={canEditRoles}
          tenantId={tenantId}
        />
      )}
    </div>
  )
}
