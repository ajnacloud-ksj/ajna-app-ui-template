import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Database,
  Eye,
  Filter,
  History,
  Info,
  Loader2,
  Mail,
  Search,
  Sliders,
  XCircle,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
import { useAuditLogsQuery } from "@/features/audit-logs/hooks"
import type { IAuditEntry } from "@/features/audit-logs/types"

export default function AuditLogsListPage() {
  const { data: logs = [], isLoading, error } = useAuditLogsQuery()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterOperation, setFilterOperation] = useState<string>("ALL")
  const [filterEntity, setFilterEntity] = useState<string>("ALL")
  const [filterOutcome, setFilterOutcome] = useState<string>("ALL")
  const [selectedLog, setSelectedLog] = useState<IAuditEntry | null>(null)

  // Helper to format date
  function formatTimestamp(tsString: string) {
    try {
      const date = new Date(tsString)
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })
    } catch {
      return tsString
    }
  }

  // Extract the primary record ID from the IbexDB filters array
  function recordIdFromFilters(entry: IAuditEntry): string {
    if (!entry.filters || entry.filters.length === 0) return ""
    const id = entry.filters.find(
      (f) => f.field === "id" && f.operator === "eq"
    )
    return id?.value ?? entry.filters[0]?.value ?? ""
  }

  // Safe logs array check
  const logsArray = useMemo((): IAuditEntry[] => {
    if (Array.isArray(logs)) return logs
    if (
      logs &&
      typeof logs === "object" &&
      "events" in logs &&
      Array.isArray((logs as any).events)
    ) {
      return (logs as any).events
    }
    return []
  }, [logs])

  // Filter logic
  const filteredLogs = useMemo(() => {
    return logsArray.filter((log) => {
      // Search term (searches user email, operation, table name, or record ID)
      const term = searchTerm.trim().toLowerCase()
      if (term) {
        const matchesEmail = log.user_email?.toLowerCase().includes(term)
        const matchesUserId = log.user_id?.toLowerCase().includes(term)
        const matchesOperation = log.operation?.toLowerCase().includes(term)
        const matchesTable = log.table_name?.toLowerCase().includes(term)
        const recordId = recordIdFromFilters(log)
        const matchesRecordId = recordId.toLowerCase().includes(term)

        if (
          !matchesEmail &&
          !matchesUserId &&
          !matchesOperation &&
          !matchesTable &&
          !matchesRecordId
        ) {
          return false
        }
      }

      // Filter Operation
      if (
        filterOperation !== "ALL" &&
        log.operation.toUpperCase() !== filterOperation
      ) {
        return false
      }

      // Filter Table Entity
      if (filterEntity !== "ALL" && log.table_name !== filterEntity) {
        return false
      }

      // Filter Outcome
      if (
        filterOutcome !== "ALL" &&
        log.outcome.toLowerCase() !== filterOutcome.toLowerCase()
      ) {
        return false
      }

      return true
    })
  }, [logsArray, searchTerm, filterOperation, filterEntity, filterOutcome])

  // Dynamic Badge Color mapping
  function getOperationBadge(op: string) {
    const upper = op.toUpperCase()
    if (upper === "WRITE" || upper === "INSERT" || upper === "CREATE") {
      return (
        <Badge className="border-success/30 bg-success/15 text-success hover:bg-success/20">
          WRITE
        </Badge>
      )
    }
    if (upper === "UPDATE") {
      return (
        <Badge className="border-blue-500/30 bg-blue-500/15 text-blue-500 hover:bg-blue-500/20">
          UPDATE
        </Badge>
      )
    }
    if (upper === "DELETE") {
      return (
        <Badge className="border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/20">
          DELETE
        </Badge>
      )
    }
    return <Badge variant="outline">{op}</Badge>
  }

  function getOutcomeBadge(outcome: string) {
    const lower = outcome.toLowerCase()
    if (lower === "success" || lower === "ok") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Success
        </span>
      )
    }
    if (lower === "error" || lower === "failure" || lower === "fail") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
          <XCircle className="h-3.5 w-3.5" />
          Failure
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
        <AlertCircle className="h-3.5 w-3.5" />
        Denied
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Audit Log
        </h1>
        <p className="text-sm text-muted-foreground">
          System transaction log and record history.
        </p>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Audit Log Filters
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {/* Operator Search */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Search Changelog
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search operator, record ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8.5 h-9 text-xs"
              />
            </div>
          </div>

          {/* Operation Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Operation Scope
            </label>
            <Select value={filterOperation} onValueChange={setFilterOperation}>
              <SelectTrigger className="h-9 bg-card text-xs">
                <SelectValue placeholder="All Operations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Operations</SelectItem>
                <SelectItem value="WRITE">WRITE / INSERT</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table Entity Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Target Table
            </label>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="h-9 bg-card text-xs">
                <SelectValue placeholder="All Tables" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tables</SelectItem>
                <SelectItem value="app_items">Items</SelectItem>
                <SelectItem value="app_tenant_config">Tenant Config</SelectItem>
                <SelectItem value="app_tenant_field_config">
                  Field Config
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Outcome Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Outcome
            </label>
            <Select value={filterOutcome} onValueChange={setFilterOutcome}>
              <SelectTrigger className="h-9 bg-card text-xs">
                <SelectValue placeholder="All Outcomes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Outcomes</SelectItem>
                <SelectItem value="success">SUCCESS</SelectItem>
                <SelectItem value="failure">FAILURE</SelectItem>
                <SelectItem value="denied">DENIED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── Table / Content ── */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="animate-pulse text-sm font-medium text-muted-foreground">
              Loading audit logs...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold text-destructive">
            {error instanceof Error
              ? error.message
              : "Failed to load audit trails!"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-border bg-card p-12 text-center">
          <History className="mx-auto h-12 w-12 text-muted-foreground/25" />
          <h3 className="text-base font-semibold text-foreground">
            No Auditing Records
          </h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {searchTerm ||
            filterOperation !== "ALL" ||
            filterEntity !== "ALL" ||
            filterOutcome !== "ALL"
              ? "No compliance logs matched your filters. Try clearing search fields."
              : "System transaction logs are currently empty."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[185px]">Timestamp</TableHead>
                <TableHead className="w-[180px]">Operator</TableHead>
                <TableHead className="w-[100px]">Operation</TableHead>
                <TableHead className="w-[150px]">Table Name</TableHead>
                <TableHead className="w-[130px]">Record ID</TableHead>
                <TableHead>Outcome Justification</TableHead>
                <TableHead className="w-[100px]">Outcome</TableHead>
                <TableHead className="w-[60px] text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, idx) => {
                const recordId = recordIdFromFilters(log)
                return (
                  <TableRow
                    key={log.event_id ?? idx}
                    className="cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell className="max-w-[170px] truncate text-xs font-semibold text-foreground">
                      {log.user_email ?? log.user_id ?? "—"}
                    </TableCell>
                    <TableCell>{getOperationBadge(log.operation)}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-[11px] font-semibold text-foreground">
                      {log.table_name}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate font-mono text-[11px] font-semibold text-foreground">
                      {recordId || "—"}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                      {log.deny_reason || "Operational audit trigger."}
                    </TableCell>
                    <TableCell>{getOutcomeBadge(log.outcome)}</TableCell>
                    <TableCell
                      className="w-[60px] text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-muted"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Detailed Changeset Dialog ── */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 border-b border-border pb-3 text-lg font-bold">
              <History className="h-5 w-5 text-primary" />
              Changelog Entry
            </DialogTitle>
            <DialogDescription>
              Detailed view of record properties and query parameters.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-5 py-2">
              {/* Event Meta Info Card */}
              <div className="grid grid-cols-1 gap-4 rounded-xl border border-border/80 bg-muted/30 p-4 text-xs md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      Operator:
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedLog.user_email ?? selectedLog.user_id ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      Timestamp:
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatTimestamp(selectedLog.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Database className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="font-medium text-foreground">
                      Target Object:
                    </span>
                    <span className="font-mono text-foreground">
                      {selectedLog.table_name} (
                      {recordIdFromFilters(selectedLog) || "—"})
                    </span>
                  </div>
                  {selectedLog.role_id && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sliders className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-medium text-foreground">
                        Operator Role:
                      </span>
                      <span className="font-semibold uppercase text-foreground">
                        {selectedLog.role_id}
                      </span>
                    </div>
                  )}
                </div>

                {selectedLog.deny_reason && (
                  <div className="flex items-start gap-2 border-t border-border pt-2.5 text-muted-foreground md:col-span-2">
                    <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    <div>
                      <span className="block font-medium text-foreground">
                        Verification justification reason:
                      </span>
                      <p className="mt-0.5 font-medium text-muted-foreground">
                        {selectedLog.deny_reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Database query filter descriptors */}
                {selectedLog.filters && selectedLog.filters.length > 0 && (
                  <div className="border-t border-border/80 pt-2.5 md:col-span-2">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Target Resource Query Constraints
                    </span>
                    <div className="grid grid-cols-1 gap-2 font-mono text-[11px] sm:grid-cols-2">
                      {selectedLog.filters.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded bg-muted/40 px-2 py-1"
                        >
                          <span className="font-semibold text-foreground">
                            {f.field}
                          </span>
                          <span className="text-muted-foreground">
                            {f.operator}
                          </span>
                          <span className="max-w-[150px] truncate text-primary">
                            {f.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Changeset Diff Table */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Modified Parameters Changelog
                  </h4>
                </div>

                {!selectedLog.changes || selectedLog.changes.length === 0 ? (
                  <div className="rounded-xl border border-border/80 bg-muted/20 p-6 text-center text-xs font-medium text-muted-foreground">
                    No data properties modified during this operational trace.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border text-xs">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="font-bold">
                            Property Key
                          </TableHead>
                          <TableHead className="font-bold">
                            Prior Value (Before)
                          </TableHead>
                          <TableHead className="font-bold">
                            Current Value (After)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedLog.changes.map((change, idx) => (
                          <TableRow key={idx} className="hover:bg-transparent">
                            <TableCell className="py-2.5 font-mono text-xs font-semibold text-foreground">
                              {change.field}
                            </TableCell>
                            <TableCell className="border-l border-destructive/20 bg-destructive/5 py-2.5 pl-2 font-mono text-destructive text-muted-foreground line-through">
                              {change.before === null ||
                              change.before === "" ? (
                                <span className="italic text-muted-foreground/50 line-through">
                                  empty
                                </span>
                              ) : (
                                String(change.before)
                              )}
                            </TableCell>
                            <TableCell className="border-l border-success/20 bg-success/5 py-2.5 pl-2 font-mono font-bold text-foreground text-success">
                              {change.after === null || change.after === "" ? (
                                <span className="italic text-muted-foreground/50">
                                  empty
                                </span>
                              ) : (
                                String(change.after)
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
