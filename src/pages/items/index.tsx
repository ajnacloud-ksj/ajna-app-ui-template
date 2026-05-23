import {
  AlertTriangle,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  Loader2,
  PackageOpen,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePermissions } from "@/contexts/permissions-context"
import {
  useDeleteItemMutation,
  useExportItemsMutation,
  useImportItemsMutation,
  useItemsQuery,
} from "@/features/items/hooks"

export default function ItemListPage() {
  const navigate = useNavigate()
  const {
    canWriteItems: canWrite,
    canExportItems,
    canImportItems,
  } = usePermissions()

  const { data: items = [], isLoading, error } = useItemsQuery()
  const exportMutation = useExportItemsMutation()
  const importMutation = useImportItemsMutation()
  const deleteMutation = useDeleteItemMutation()

  const [searchTerm, setSearchTerm] = useState("")
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importMode, setImportMode] = useState<"create" | "upsert">("create")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Client-side quick filter
  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      (p) =>
        p.code?.toLowerCase().includes(term) ||
        p.name?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    )
  }, [items, searchTerm])

  async function handleExport() {
    try {
      await exportMutation.mutateAsync(undefined)
      toast.success("Items exported and download started!")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export items!"
      )
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportDialogOpen(true)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleImportSubmit() {
    if (!selectedFile) return
    try {
      const res = await importMutation.mutateAsync({
        file: selectedFile,
        mode: importMode,
      })

      if (res.failed > 0) {
        toast.error(
          `Import partially completed: ${res.succeeded} success, ${res.failed} failed.`
        )
      } else {
        toast.success(`Successfully imported ${res.succeeded} items!`)
      }
      setImportDialogOpen(false)
      setSelectedFile(null)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to import CSV file!"
      )
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success("Item deleted successfully!")
      setDeleteConfirmId(null)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete item!"
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Items
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your catalog of items, categories, and configuration.
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {canExportItems && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Export
            </Button>
          )}

          {canImportItems && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          )}

          {canWrite && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => navigate(`/items/new`)}
            >
              <Plus className="h-4 w-4" />
              New Item
            </Button>
          )}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search code, name, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
          {filteredItems.length} of {items.length} items
        </span>
      </div>

      {/* ── Table Content ── */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Fetching items...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold text-destructive">
            {error instanceof Error
              ? error.message
              : "An error occurred fetching items!"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-12 text-center">
          <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground/25" />
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-foreground">
              No Items Found
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              {searchTerm
                ? "No items match your search query. Try broadening your search terms."
                : "Start by registering your first item to build your catalog."}
            </p>
          </div>
          {canWrite && !searchTerm && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 gap-1.5"
              onClick={() => navigate(`/items/new`)}
            >
              <Plus className="h-3.5 w-3.5" />
              Register First Item
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-[130px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/items/${p.id}`)}
                >
                  <TableCell className="font-mono text-sm font-semibold">
                    {p.code}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {p.name}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {p.category || (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {p.quantity || (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {p.price || (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell
                    className="w-[130px] text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/items/${p.id}`)}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {canWrite && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/items/${p.id}/edit`)}
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteConfirmId(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Import Confirmation Dialog ── */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-success" />
              Import Items
            </DialogTitle>
            <DialogDescription>
              Onboard items in bulk. Confirm how database collisions should be
              resolved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/50 p-3 text-sm">
              <p className="font-semibold text-foreground">Selected File</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {selectedFile?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Size: {selectedFile ? (selectedFile.size / 1024).toFixed(2) : 0}{" "}
                KB
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Import Strategy
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode("create")}
                  className={`flex flex-col space-y-1 rounded-lg border p-3 text-left transition-all ${
                    importMode === "create"
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="text-sm font-semibold">Strict Create</span>
                  <span className="text-xs leading-snug text-muted-foreground">
                    Fails if a Code already exists.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("upsert")}
                  className={`flex flex-col space-y-1 rounded-lg border p-3 text-left transition-all ${
                    importMode === "upsert"
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <span className="text-sm font-semibold">Upsert Merge</span>
                  <span className="text-xs leading-snug text-muted-foreground">
                    Overwrite values if code is matched.
                  </span>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border pt-4 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImportDialogOpen(false)
                setSelectedFile(null)
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleImportSubmit}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Importing...
                </>
              ) : (
                "Confirm & Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This process cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2 border-t border-border pt-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                deleteConfirmId && handleDeleteItem(deleteConfirmId)
              }
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Item"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
