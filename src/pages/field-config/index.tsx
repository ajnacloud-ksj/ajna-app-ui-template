import {
  AlertTriangle,
  Edit2,
  Loader2,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useDeleteFieldConfigMutation,
  useFieldConfigQuery,
  useUpsertFieldConfigMutation,
} from "@/features/field-config/hooks"
import type { IFieldConfig, IFieldConfigFormData } from "@/features/field-config/types"

const ENTITY_TYPES = [{ value: "items", label: "Items" }]

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select (dropdown)" },
  { value: "boolean", label: "Boolean (Yes/No)" },
]

const EMPTY_FORM: IFieldConfigFormData = {
  field_key: "",
  label: "",
  field_type: "text",
  required: false,
  hidden: false,
  order: 0,
  section: "",
  helper_text: "",
  options: "",
}

export default function FieldConfigPage() {
  const [entityType, setEntityType] = useState("items")

  const {
    data: fields = [],
    isLoading,
    error,
  } = useFieldConfigQuery(entityType)
  const upsertMutation = useUpsertFieldConfigMutation(entityType)
  const deleteMutation = useDeleteFieldConfigMutation(entityType)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [form, setForm] = useState<IFieldConfigFormData>({ ...EMPTY_FORM })

  const [deleteKey, setDeleteKey] = useState<string | null>(null)

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [fields]
  )

  function openAddDialog() {
    setEditingKey(null)
    setForm({ ...EMPTY_FORM, order: fields.length })
    setDialogOpen(true)
  }

  function openEditDialog(f: IFieldConfig) {
    setEditingKey(f.field_key)
    setForm({
      field_key: f.field_key,
      label: f.label,
      field_type: f.field_type,
      required: f.required,
      hidden: f.hidden,
      order: f.order,
      section: f.section ?? "",
      helper_text: f.helper_text ?? "",
      options: f.options ?? "",
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.field_key.trim() || !(form.label ?? "").trim()) return
    try {
      await upsertMutation.mutateAsync(form)
      toast.success(editingKey ? "Field updated." : "Field added.")
      setDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save field")
    }
  }

  async function handleDelete() {
    if (!deleteKey) return
    try {
      await deleteMutation.mutateAsync(deleteKey)
      toast.success("Field deleted.")
      setDeleteKey(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete field")
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Field Configuration
          </h1>
          <p className="text-sm text-muted-foreground">
            Add custom fields to entities for your company. These fields appear
            in forms and are stored per record.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Field
        </Button>
      </div>

      {/* ── Entity Type Tabs ── */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
        {ENTITY_TYPES.map((et) => (
          <button
            key={et.value}
            type="button"
            onClick={() => setEntityType(et.value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              entityType === et.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* ── Table Content ── */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading fields...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold text-destructive">
            {error instanceof Error ? error.message : "Failed to load fields"}
          </p>
        </div>
      ) : sortedFields.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-12 text-center">
          <Settings2 className="mx-auto h-12 w-12 text-muted-foreground/25" />
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-foreground">
              No Custom Fields
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              No custom fields configured for this entity type.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 gap-1.5"
            onClick={openAddDialog}
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Field
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14">Order</TableHead>
                <TableHead>Field Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Section</TableHead>
                <TableHead className="w-20">Required</TableHead>
                <TableHead className="w-20">Hidden</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFields.map((f) => (
                <TableRow key={f.field_key}>
                  <TableCell className="text-sm text-muted-foreground">
                    {f.order}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs font-medium text-foreground">
                      {f.field_key}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{f.label}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{f.field_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {f.section || "—"}
                  </TableCell>
                  <TableCell>
                    {f.required ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground/50">
                        No
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {f.hidden ? (
                      <Badge variant="secondary">Hidden</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground/50">
                        No
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(f)}
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteKey(f.field_key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Add/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingKey ? "Edit Field" : "Add Custom Field"}
            </DialogTitle>
            <DialogDescription>
              {editingKey
                ? "Update the field configuration."
                : "Add a custom field to store additional data on this entity."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="field-key">Field Key</Label>
              <Input
                id="field-key"
                value={form.field_key}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    field_key: e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, "_"),
                  }))
                }
                disabled={!!editingKey}
                placeholder="snake_case_key"
              />
              <p className="text-xs text-muted-foreground">
                Unique key used in the database (snake_case). Cannot be changed
                after creation.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="field-label">Label</Label>
              <Input
                id="field-label"
                value={form.label ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, label: e.target.value }))
                }
                placeholder="Display label"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Field Type</Label>
              <Select
                value={form.field_type ?? "text"}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, field_type: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.field_type === "select" && (
              <div className="space-y-1.5">
                <Label htmlFor="field-options">Options (comma-separated)</Label>
                <Input
                  id="field-options"
                  value={form.options ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, options: e.target.value }))
                  }
                  placeholder="Option A,Option B,Option C"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="field-section">Section</Label>
              <Input
                id="field-section"
                value={form.section ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, section: e.target.value }))
                }
                placeholder="Groups related fields visually (optional)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="field-helper">Helper Text</Label>
              <Input
                id="field-helper"
                value={form.helper_text ?? ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, helper_text: e.target.value }))
                }
                placeholder="Hint shown below the field (optional)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="field-order">Order</Label>
              <Input
                id="field-order"
                type="number"
                value={form.order ?? 0}
                onChange={(e) =>
                  setForm((p) => ({ ...p, order: Number(e.target.value) }))
                }
              />
            </div>

            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.required ?? false}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, required: e.target.checked }))
                  }
                  className="cursor-pointer"
                />
                Required
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.hidden ?? false}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, hidden: e.target.checked }))
                  }
                  className="cursor-pointer"
                />
                Hidden
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={upsertMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={
                upsertMutation.isPending ||
                !form.field_key.trim() ||
                !(form.label ?? "").trim()
              }
            >
              {upsertMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : editingKey ? (
                "Update"
              ) : (
                "Add Field"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog
        open={!!deleteKey}
        onOpenChange={(open) => !open && setDeleteKey(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Field
            </DialogTitle>
            <DialogDescription>
              Delete field <strong>{deleteKey}</strong>? This removes the field
              definition but existing data in records is preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-border pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteKey(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
