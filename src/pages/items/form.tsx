import { Info } from "lucide-react"
import { type Control } from "react-hook-form"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form"
import type { IFieldConfig, IItemFormData } from "@/features/items/types"

interface ItemFormProps {
  control: Control<IItemFormData>
  readOnly?: boolean
  customFieldConfig?: IFieldConfig[]
}

interface IFieldMeta {
  label: string
  required: boolean
  rows?: number
}

/** Static field metadata for the built-in item fields. */
const ITEM_FIELD_META: Record<
  keyof Omit<IItemFormData, "custom_fields">,
  IFieldMeta
> = {
  code: { label: "Code", required: true },
  name: { label: "Name", required: true },
  description: { label: "Description", required: false, rows: 4 },
  category: { label: "Category", required: false },
  quantity: { label: "Quantity", required: false },
  price: { label: "Price", required: false },
  is_active: { label: "Active", required: false },
}

const ITEM_PLACEHOLDERS: Record<string, string> = {
  code: "e.g. SKU-10045",
  name: "e.g. Wireless Keyboard",
  description: "e.g. A compact mechanical keyboard with low-profile keys.",
  category: "e.g. Electronics",
  quantity: "e.g. 120",
  price: "e.g. 49.99",
  is_active: "e.g. true",
}

export default function ItemForm({
  control,
  readOnly = false,
  customFieldConfig = [],
}: ItemFormProps) {
  /** Helper to render a standard built-in input */
  function renderField(
    fieldKey: keyof Omit<IItemFormData, "custom_fields">,
    type: "text" | "textarea" = "text"
  ) {
    const meta = ITEM_FIELD_META[fieldKey]
    const placeholder = ITEM_PLACEHOLDERS[fieldKey] || ""

    return (
      <FormField
        control={control}
        name={fieldKey}
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {meta.label}
              {meta.required && (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </FormLabel>
            <FormControl>
              {type === "textarea" ? (
                <Textarea
                  {...field}
                  rows={meta.rows || 3}
                  disabled={readOnly}
                  placeholder={placeholder}
                  className="min-h-[80px] resize-y text-sm"
                />
              ) : (
                <Input
                  {...field}
                  disabled={readOnly}
                  placeholder={placeholder}
                />
              )}
            </FormControl>
            <FormMessage className="text-xs font-medium text-destructive" />
          </FormItem>
        )}
      />
    )
  }

  // Group dynamic custom fields by section
  const customSections = customFieldConfig
    .filter((f) => !f.hidden)
    .reduce<Record<string, IFieldConfig[]>>((acc, f) => {
      const sectionName = f.section || "Additional Fields"
      return { ...acc, [sectionName]: [...(acc[sectionName] ?? []), f] }
    }, {})

  return (
    <div className="space-y-6">
      {/* ── Item Identifier Section ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-l-4 border-l-primary px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">
            Item Identifier
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Core descriptors for this record
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 px-5 pb-5 pt-2 md:grid-cols-2">
          {renderField("code")}
          {renderField("name")}
          {renderField("category")}
          {renderField("description", "textarea")}
        </div>
      </div>

      {/* ── Item Details Section ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-l-4 border-l-primary px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">
            Item Details
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Inventory and status metadata
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 px-5 pb-5 pt-2 md:grid-cols-2">
          {renderField("quantity")}
          {renderField("price")}
          {renderField("is_active")}
        </div>
      </div>

      {/* ── Dynamic Custom Tenant Fields ── */}
      {Object.entries(customSections).map(([sectionTitle, fields]) => (
        <div
          key={sectionTitle}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="border-l-4 border-l-primary px-5 py-4">
            <h3 className="text-base font-semibold text-foreground">
              {sectionTitle}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tenant configured custom extensions
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 px-5 pb-5 pt-2 md:grid-cols-2">
            {fields
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((f) => {
                const isBool = f.field_type === "boolean"
                const isCheck = f.field_type === "checkbox"
                const isSelect =
                  f.field_type === "select" || f.field_type === "dropdown"
                const isRadio = f.field_type === "radio"
                const isTextArea = f.field_type === "text"

                // Parse options if comma-separated
                const options = f.options
                  ? f.options
                      .split(",")
                      .map((o) => o.trim())
                      .filter(Boolean)
                  : []

                if (isBool) {
                  return (
                    <FormField
                      key={f.field_key}
                      control={control}
                      name={`custom_fields.${f.field_key}` as any}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-xl border border-border p-4">
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-semibold text-foreground">
                              {f.label}
                            </FormLabel>
                            {f.helper_text && (
                              <FormDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Info className="h-3 w-3 flex-shrink-0" />
                                {f.helper_text}
                              </FormDescription>
                            )}
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value === "true"}
                              onCheckedChange={(checked) =>
                                field.onChange(checked ? "true" : "false")
                              }
                              disabled={readOnly}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )
                }

                if (isCheck) {
                  return (
                    <FormField
                      key={f.field_key}
                      control={control}
                      name={`custom_fields.${f.field_key}` as any}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value === "true"}
                              onCheckedChange={(checked) =>
                                field.onChange(checked ? "true" : "false")
                              }
                              disabled={readOnly}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-semibold text-foreground">
                              {f.label}
                            </FormLabel>
                            {f.helper_text && (
                              <FormDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Info className="h-3 w-3 flex-shrink-0" />
                                {f.helper_text}
                              </FormDescription>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  )
                }

                if (isSelect && options.length > 0) {
                  return (
                    <FormField
                      key={f.field_key}
                      control={control}
                      name={`custom_fields.${f.field_key}` as any}
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            {f.label}
                            {f.required && (
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                            disabled={readOnly}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select option..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {options.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {f.helper_text && (
                            <FormDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Info className="h-3 w-3 flex-shrink-0" />
                              {f.helper_text}
                            </FormDescription>
                          )}
                          <FormMessage className="text-xs font-medium text-destructive" />
                        </FormItem>
                      )}
                    />
                  )
                }

                if (isRadio && options.length > 0) {
                  return (
                    <FormField
                      key={f.field_key}
                      control={control}
                      name={`custom_fields.${f.field_key}` as any}
                      render={({ field }) => (
                        <FormItem className="space-y-2 rounded-xl border border-border p-4">
                          <FormLabel className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            {f.label}
                            {f.required && (
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value || ""}
                              value={field.value || ""}
                              disabled={readOnly}
                              className="flex flex-col gap-2"
                            >
                              {options.map((opt) => (
                                <FormItem
                                  key={opt}
                                  className="flex items-center space-x-2 space-y-0"
                                >
                                  <FormControl>
                                    <RadioGroupItem
                                      value={opt}
                                      className="h-4 w-4"
                                    />
                                  </FormControl>
                                  <FormLabel className="cursor-pointer text-sm font-normal text-foreground">
                                    {opt}
                                  </FormLabel>
                                </FormItem>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          {f.helper_text && (
                            <FormDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Info className="h-3 w-3 flex-shrink-0" />
                              {f.helper_text}
                            </FormDescription>
                          )}
                          <FormMessage className="text-xs font-medium text-destructive" />
                        </FormItem>
                      )}
                    />
                  )
                }

                // Default fallback: text input or textarea
                return (
                  <FormField
                    key={f.field_key}
                    control={control}
                    name={`custom_fields.${f.field_key}` as any}
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          {f.label}
                          {f.required && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </FormLabel>
                        <FormControl>
                          {isTextArea ? (
                            <Textarea
                              {...field}
                              rows={3}
                              disabled={readOnly}
                              placeholder="Enter details..."
                              className="min-h-[80px] resize-y text-sm"
                            />
                          ) : (
                            <Input
                              {...field}
                              disabled={readOnly}
                              placeholder={`Enter ${f.label.toLowerCase()}...`}
                            />
                          )}
                        </FormControl>
                        {f.helper_text && (
                          <FormDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Info className="h-3 w-3 flex-shrink-0" />
                            {f.helper_text}
                          </FormDescription>
                        )}
                        <FormMessage className="text-xs font-medium text-destructive" />
                      </FormItem>
                    )}
                  />
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
