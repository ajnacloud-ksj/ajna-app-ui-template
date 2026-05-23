import { AlertCircle, ArrowLeft, Edit2, Info, Loader2 } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { usePermissions } from "@/contexts/permissions-context"
import { useItemFieldsQuery, useItemQuery } from "@/features/items/hooks"

const ITEM_FIELD_LABELS: Record<string, string> = {
  code: "Code",
  name: "Name",
  description: "Description",
  category: "Category",
  quantity: "Quantity",
  price: "Price",
  is_active: "Active",
}

export default function ItemViewPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const { canWriteItems: canWrite } = usePermissions()

  const { data: item, isLoading, error } = useItemQuery(itemId || "")
  const { data: fieldConfig = [] } = useItemFieldsQuery()

  /** Helper to render a read-only metadata detail value */
  function renderDetailItem(
    fieldKey: string,
    value?: string | number | boolean | null
  ) {
    const label = ITEM_FIELD_LABELS[fieldKey] ?? fieldKey
    const displayVal =
      value === undefined || value === null || value === ""
        ? "—"
        : String(value).trim()

    return (
      <div className="space-y-1.5 border-b border-border/50 py-2 last:border-0">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground">
          {displayVal}
        </p>
      </div>
    )
  }

  // Group dynamic custom fields by section
  const customSections = fieldConfig
    .filter((f) => !f.hidden)
    .reduce<Record<string, typeof fieldConfig>>((acc, f) => {
      const sectionName = f.section || "Additional Fields"
      return { ...acc, [sectionName]: [...(acc[sectionName] ?? []), f] }
    }, {})

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              Item Details
            </h1>
            <p className="mt-0.5 font-mono text-sm text-muted-foreground">
              {item?.name || "Loading..."} · {item?.code}
            </p>
          </div>
        </div>

        {canWrite && item && (
          <Button
            size="sm"
            className="ml-auto gap-1.5 sm:ml-0"
            onClick={() => navigate(`/items/${itemId}/edit`)}
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Item
          </Button>
        )}
      </div>

      {/* ── Dynamic States ── */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Fetching item details...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold text-destructive">
            {error instanceof Error
              ? error.message
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
      ) : item ? (
        <div className="space-y-6">
          {/* ── Item Identifier Block ── */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-l-4 border-l-primary px-5 py-4">
              <h3 className="text-base font-semibold text-foreground">
                Item Identifier
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-1 px-5 pb-5 pt-1 md:grid-cols-2">
              {renderDetailItem("code", item.code)}
              {renderDetailItem("name", item.name)}
              {renderDetailItem("category", item.category)}
              {renderDetailItem("description", item.description)}
            </div>
          </div>

          {/* ── Item Details Block ── */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-l-4 border-l-primary px-5 py-4">
              <h3 className="text-base font-semibold text-foreground">
                Item Details
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-1 px-5 pb-5 pt-1 md:grid-cols-2">
              {renderDetailItem("quantity", item.quantity)}
              {renderDetailItem("price", item.price)}
              {renderDetailItem("is_active", item.is_active)}
            </div>
          </div>

          {/* ── Custom Tenant Fields Block ── */}
          {Object.entries(customSections).map(([sectionTitle, fields]) => {
            const hasVisibleData = fields.some(
              (f) => (item.custom_fields ?? {})[f.field_key]
            )

            return (
              <div
                key={sectionTitle}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="border-l-4 border-l-primary px-5 py-4">
                  <h3 className="text-base font-semibold text-foreground">
                    {sectionTitle}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-1 px-5 pb-5 pt-1 md:grid-cols-2">
                  {hasVisibleData ? (
                    fields
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((f) => {
                        const val = (item.custom_fields ?? {})[f.field_key]
                        return (
                          <div
                            key={f.field_key}
                            className="space-y-1.5 border-b border-border/50 py-2 last:border-0"
                          >
                            <Label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {f.label}
                            </Label>
                            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-foreground">
                              {val ? val.trim() : "—"}
                            </p>
                          </div>
                        )
                      })
                  ) : (
                    <div className="col-span-full flex items-center justify-center gap-2 py-6 text-center text-sm text-muted-foreground">
                      <Info className="h-4 w-4 text-muted-foreground/50" />
                      No data recorded for this section.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
