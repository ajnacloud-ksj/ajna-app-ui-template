import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react"
import { useAuth } from "./auth-context"
import { apiFetchPermissions } from "@/features/auth/api"
import type { IPermissions, IRoleDefinition } from "@/features/auth/types"

const DEFAULT_PERMISSIONS: IPermissions = {
  canReadItems: false,
  canWriteItems: false,
  canExportItems: false,
  canImportItems: false,
  canManageUsers: false,
  canConfigureFields: false,
  canViewAuditLog: false,
  canConfigureTenant: false,
  canEditRoles: false,
  role: null,
  loading: true,
}

function tableAccess(
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

function derivePermissions(
  role: IRoleDefinition
): Omit<IPermissions, "role" | "loading"> {
  const roleId = role.role_id
  const isSuperAdmin = roleId === "super_admin"
  const isOrgAdmin = isSuperAdmin || roleId === "admin"

  // super_admin is a platform-level role with no row policy in tenant tables.
  // IbexDB rejects writes from super_admin even though the app role list allows it.
  // Treat super_admin as read-only for all tenant master data.
  const canWriteTenantData =
    !isSuperAdmin && tableAccess(role, "app_items", "w")

  return {
    canReadItems: tableAccess(role, "app_items", "r"),
    canWriteItems: canWriteTenantData,
    canExportItems: isOrgAdmin || canWriteTenantData,
    canImportItems: !isSuperAdmin && isOrgAdmin,
    canManageUsers: isOrgAdmin,
    canConfigureFields: isOrgAdmin,
    canViewAuditLog: isOrgAdmin,
    canConfigureTenant:
      !isSuperAdmin && tableAccess(role, "app_tenant_config", "w"),
    canEditRoles: isOrgAdmin,
  }
}

const PermissionsContext = createContext<IPermissions>(DEFAULT_PERMISSIONS)

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [role, setRole] = useState<IRoleDefinition | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setRole(null)
      setLoading(false)
      return
    }
    setLoading(true)
    apiFetchPermissions()
      .then(setRole)
      .catch(() => setRole(null))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const value = useMemo<IPermissions>(() => {
    if (loading || !role) return { ...DEFAULT_PERMISSIONS, loading }
    return { ...derivePermissions(role), role, loading: false }
  }, [role, loading])

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions(): IPermissions {
  return useContext(PermissionsContext)
}
