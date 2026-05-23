import { yupResolver } from "@hookform/resolvers/yup"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import {
  useCreateItemMutation,
  useItemFieldsQuery,
} from "@/features/items/hooks"
import { itemFormSchema } from "@/features/items/schema"
import type { IItemFormData } from "@/features/items/types"
import ItemForm from "./form"

export default function ItemCreatePage() {
  const navigate = useNavigate()

  const { data: fieldConfig = [] } = useItemFieldsQuery()
  const createMutation = useCreateItemMutation()

  const form = useForm<IItemFormData>({
    resolver: yupResolver(itemFormSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      description: "",
      category: "",
      quantity: "",
      price: "",
      is_active: "",
      custom_fields: {},
    },
  })

  async function onSubmit(data: IItemFormData) {
    try {
      await createMutation.mutateAsync(data)
      toast.success("Item created successfully!")
      navigate(`/items`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create item!")
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={() => navigate(`/items`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            New Item
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Register a new item in your catalog.
          </p>
        </div>
      </div>

      {/* ── Form Container ── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <ItemForm control={form.control} customFieldConfig={fieldConfig} />

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/items`)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Save Item
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
