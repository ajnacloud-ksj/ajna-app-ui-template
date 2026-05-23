import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getFieldConfig, upsertFieldConfig, deleteFieldConfig } from "./api"
import type { IFieldConfigFormData } from "./types"

export const fieldConfigKeys = {
  all: ["field-config"] as const,
  entity: (entityType: string) =>
    [...fieldConfigKeys.all, entityType] as const,
}

export function useFieldConfigQuery(entityType: string) {
  return useQuery({
    queryKey: fieldConfigKeys.entity(entityType),
    queryFn: () => getFieldConfig(entityType),
    enabled: !!entityType,
  })
}

export function useUpsertFieldConfigMutation(entityType: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (field: IFieldConfigFormData) =>
      upsertFieldConfig(entityType, field),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: fieldConfigKeys.entity(entityType),
      })
    },
  })
}

export function useDeleteFieldConfigMutation(entityType: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fieldKey: string) => deleteFieldConfig(entityType, fieldKey),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: fieldConfigKeys.entity(entityType),
      })
    },
  })
}
