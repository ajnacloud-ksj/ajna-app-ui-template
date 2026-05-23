import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listRoles, saveRole } from "./api"
import type { IRoleDefinition } from "./types"

export const rolesKeys = {
  all: ["roles"] as const,
  lists: () => [...rolesKeys.all, "list"] as const,
}

export function useRolesQuery() {
  return useQuery({
    queryKey: rolesKeys.lists(),
    queryFn: listRoles,
  })
}

export function useSaveRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      tenantId,
      role,
    }: {
      tenantId: string
      role: IRoleDefinition
    }) => saveRole(tenantId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesKeys.lists() })
    },
  })
}
