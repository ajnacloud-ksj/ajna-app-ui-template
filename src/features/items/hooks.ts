import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getItemFieldConfig,
  exportItemsAndDownload,
  importItemsFile,
} from "./api"
import type { IItemFormData } from "./types"

// ── Query Key Factory ──────────────────────────────────────────────────────────
export const itemsKeys = {
  all: ["items"] as const,
  lists: () => [...itemsKeys.all, "list"] as const,
  details: () => [...itemsKeys.all, "detail"] as const,
  detail: (id: string) => [...itemsKeys.details(), id] as const,
  fields: () => [...itemsKeys.all, "fields"] as const,
}

// ── Custom Hooks ──────────────────────────────────────────────────────────────

export function useItemsQuery() {
  return useQuery({
    queryKey: itemsKeys.lists(),
    queryFn: listItems,
  })
}

export function useItemQuery(itemId: string, enabled = true) {
  return useQuery({
    queryKey: itemsKeys.detail(itemId),
    queryFn: () => getItem(itemId),
    enabled: enabled && !!itemId,
  })
}

export function useItemFieldsQuery() {
  return useQuery({
    queryKey: itemsKeys.fields(),
    queryFn: getItemFieldConfig,
  })
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: IItemFormData) => createItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsKeys.lists() })
    },
  })
}

export function useUpdateItemMutation(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: IItemFormData) => updateItem(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: itemsKeys.detail(itemId),
      })
    },
  })
}

export function useDeleteItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => deleteItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemsKeys.lists() })
    },
  })
}

export function useExportItemsMutation() {
  return useMutation({
    mutationFn: (filename?: string) => exportItemsAndDownload(filename),
  })
}

export function useImportItemsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, mode }: { file: File; mode: "create" | "upsert" }) =>
      importItemsFile(file, mode),
    onSuccess: (data) => {
      if (data.succeeded > 0) {
        queryClient.invalidateQueries({ queryKey: itemsKeys.lists() })
      }
    },
  })
}
