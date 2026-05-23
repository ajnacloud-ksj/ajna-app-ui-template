import { yupResolver } from "@hookform/resolvers/yup"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  useItemFieldsQuery,
  useItemQuery,
  useUpdateItemMutation,
} from "@/features/items/hooks"
import { itemFormSchema } from "@/features/items/schema"
import type { IItemFormData } from "@/features/items/types"
import ItemForm from "./form"

export default function ItemEditPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()

  const {
    data: item,
    isLoading: itemLoading,
    error: itemError,
  } = useItemQuery(itemId || "")

  const { data: fieldConfig = [] } = useItemFieldsQuery()
  const updateMutation = useUpdateItemMutation(itemId || "")

  const form = useForm<IItemFormData>({
    resolver: yupResolver(itemFormSchema) as any,
  })

  const { reset } = form

  // Keep form values in sync once item details are resolved
  useEffect(() => {
    if (item) {
      // The backend stores quantity/price/is_active as integer/float/boolean, but the
      // form holds every built-in field as a string — coerce on the way in.
      const asString = (v: unknown): string =>
        v === null || v === undefined ? "" : String(v)
      reset({
        code: item.code ?? "",
        name: item.name ?? "",
        description: item.description ?? "",
        category: item.category ?? "",
        quantity: asString(item.quantity),
        price: asString(item.price),
        is_active: asString(item.is_active),
        custom_fields: item.custom_fields ?? {},
      })
    }
  }, [item, reset])

  async function onSubmit(data: IItemFormData) {
    try {
      await updateMutation.mutateAsync(data)
      toast.success("Item updated successfully!")
      navigate(`/items/${itemId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update item!")
    }
  }

  const isLoading = itemLoading

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={() => navigate(`/items/${itemId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Edit Item
          </h1>
          <p className="mt-0.5 font-mono text-sm text-muted-foreground">
            {item?.name || "Loading..."} · {item?.code}
          </p>
        </div>
      </div>

      {/* ── Dynamic States ── */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading item...
            </p>
          </div>
        </div>
      ) : itemError ? (
        <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold text-destructive">
            {itemError instanceof Error
              ? itemError.message
              : "Failed to load item details!"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ItemForm control={form.control} customFieldConfig={fieldConfig} />

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(`/items/${itemId}`)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="gap-1.5"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
