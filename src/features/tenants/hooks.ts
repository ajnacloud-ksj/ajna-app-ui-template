import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  apiListTenants,
  apiGetTenant,
  apiCreateTenant,
  apiUpdateTenant,
  apiBootstrapTenant,
} from "./api"
import type { ITenantFormData } from "./types"

const TENANTS_QUERY_KEY = ["tenants"] as const

export function useTenantsQuery() {
  return useQuery({
    queryKey: TENANTS_QUERY_KEY,
    queryFn: apiListTenants,
  })
}

export function useTenantQuery(tenantId: string) {
  return useQuery({
    queryKey: [...TENANTS_QUERY_KEY, tenantId],
    queryFn: () => apiGetTenant(tenantId),
    enabled: !!tenantId,
  })
}

export function useCreateTenantMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: apiCreateTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
    },
  })
}

export function useUpdateTenantMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string
      payload: Partial<ITenantFormData>
    }) => apiUpdateTenant(tenantId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: [...TENANTS_QUERY_KEY, variables.tenantId],
      })
    },
  })
}

export function useBootstrapTenantMutation() {
  return useMutation({
    mutationFn: apiBootstrapTenant,
  })
}
