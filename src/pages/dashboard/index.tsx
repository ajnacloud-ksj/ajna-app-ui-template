import {
  Activity,
  ArrowRight,
  Boxes,
  History,
  Package,
  ShieldCheck,
  Sliders,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"

import { useAuth } from "@/contexts/auth-context"
import { usePermissions } from "@/contexts/permissions-context"
import { useItemsQuery } from "@/features/items/hooks"

export default function Dashboard() {
  const { user } = useAuth()
  const { canManageUsers, canViewAuditLog } = usePermissions()
  const { data: items = [] } = useItemsQuery()

  // Example metrics — wire to real aggregates as the app grows.
  const metrics = [
    {
      label: "Total Items",
      value: items.length.toString(),
      icon: <Package className="h-5 w-5" />,
      change: "Registered records",
    },
    {
      label: "Active",
      value: "—",
      icon: <Activity className="h-5 w-5" />,
      change: "Currently active",
    },
    {
      label: "Categories",
      value: "—",
      icon: <Boxes className="h-5 w-5" />,
      change: "Distinct categories",
    },
    {
      label: "Status",
      value: "OK",
      icon: <ShieldCheck className="h-5 w-5" />,
      change: "All systems normal",
    },
  ]

  const quickActions = [
    {
      label: "New Item",
      path: `/items/new`,
      icon: <Boxes className="h-4 w-4" />,
    },
    ...(canViewAuditLog
      ? [
          {
            label: "View Audit Log",
            path: `/audit-log`,
            icon: <History className="h-4 w-4" />,
          },
        ]
      : []),
    ...(canManageUsers
      ? [
          {
            label: "User Management",
            path: `/users`,
            icon: <Users className="h-4 w-4" />,
          },
          {
            label: "Field Config",
            path: `/field-config`,
            icon: <Sliders className="h-4 w-4" />,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-8">
      {/* ── Welcome Section ── */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back{user?.username ? `, ${user.username}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here's an overview of your workspace.
        </p>
      </div>

      {/* ── Metrics Row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="space-y-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </span>
              <span className="text-muted-foreground/50">{metric.icon}</span>
            </div>
            <div>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {metric.value}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {metric.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/40"
            >
              <span className="text-primary">{action.icon}</span>
              <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                {action.label}
              </span>
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 transition-colors group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Recent Activity
        </h2>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {items.length > 0 ? (
            items.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                to={`/items/${p.id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {p.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {p.code}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {p.category || "—"}
                </span>
              </Link>
            ))
          ) : (
            <div className="px-5 py-8 text-center">
              <Boxes className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">
                No items registered yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Start by creating your first item to see activity here.
              </p>
              <Link
                to={`/items/new`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Create first item
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
