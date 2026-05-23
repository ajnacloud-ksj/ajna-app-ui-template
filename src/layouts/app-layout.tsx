import { useAuth } from "@/contexts/auth-context"
import { usePermissions } from "@/contexts/permissions-context"
import { useTheme } from "@/contexts/theme-provider"
import {
  Bell,
  Boxes,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  History,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sliders,
  Sun,
  User,
  Users,
  X,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"

function extractTenantFromHost(): string {
  const host = window.location.hostname.toLowerCase().split(":")[0]
  if (host === "localhost" || host === "127.0.0.1") return ""
  const parts = host.split(".")
  return parts.length >= 3 ? parts[0] : ""
}

interface INavItem {
  label: string
  path: string
  icon: React.ReactNode
}

interface INavSection {
  id: string
  label: string
  items: INavItem[]
}

const APP_NAME = "{{app-name}}"

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { canManageUsers, canEditRoles, canViewAuditLog } = usePermissions()
  const { theme, setTheme } = useTheme()

  const slug = extractTenantFromHost()
  const tenantName = slug
    ? slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : APP_NAME

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
    setIsProfileOpen(false)
  }, [location.pathname])

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ── Navigation Sections ──
  const sections: INavSection[] = []

  const masterData: INavSection = {
    id: "master",
    label: "Master Data",
    items: [
      {
        label: "Items",
        path: `/items`,
        icon: <Boxes className="h-4 w-4" />,
      },
    ],
  }

  const reports: INavSection = {
    id: "reports",
    label: "Reports",
    items: [
      {
        label: "Audit Log",
        path: `/audit-log`,
        icon: <History className="h-4 w-4" />,
      },
    ],
  }

  const admin: INavSection = {
    id: "admin",
    label: "Administration",
    items: [
      ...(canManageUsers
        ? [
            {
              label: "User Management",
              path: `/users`,
              icon: <Users className="h-4 w-4" />,
            },
          ]
        : []),
      ...(canEditRoles
        ? [
            {
              label: "Role Permissions",
              path: `/role-permissions`,
              icon: <Shield className="h-4 w-4" />,
            },
          ]
        : []),
      ...(canManageUsers
        ? [
            {
              label: "Field Config",
              path: `/field-config`,
              icon: <Sliders className="h-4 w-4" />,
            },
          ]
        : []),
    ],
  }

  if (user) {
    sections.push(masterData)
    if (canViewAuditLog) sections.push(reports)
    if (canManageUsers || canEditRoles) sections.push(admin)
  }

  function handleLogout() {
    logout()
    navigate("/auth/login")
  }

  function toggleTheme() {
    if (theme === "dark") setTheme("light")
    else setTheme("dark")
  }

  // ── Derive breadcrumbs from location ──
  const pathSegments = location.pathname.split("/").filter(Boolean)

  const sidebarWidth = collapsed ? "w-[60px]" : "w-[260px]"

  // ── Sidebar Content (shared between desktop and mobile) ──
  function renderSidebarContent(isMobile = false) {
    return (
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
        {/* ── Brand Header ── */}
        <div className="flex h-16 flex-shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <LayoutGrid className="h-4.5 w-4.5" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
                {APP_NAME}
              </span>
              <span className="truncate text-[10px] leading-none text-sidebar-muted-foreground">
                {tenantName}
              </span>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {/* Home Link */}
          <div>
            <Link
              to="/"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              {(!collapsed || isMobile) && <span>Home</span>}
            </Link>
          </div>

          {/* Grouped Sections */}
          {sections.map((section) => (
            <div key={section.id}>
              {(!collapsed || isMobile) && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted-foreground/70">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      }`}
                      title={collapsed && !isMobile ? item.label : undefined}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {(!collapsed || isMobile) && <span>{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Sidebar Footer ── */}
        <div className="flex-shrink-0 border-t border-sidebar-border p-3">
          {/* Collapse toggle (desktop only) */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center rounded-lg py-2 text-sidebar-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium">
                  <ChevronLeft className="h-4 w-4" />
                  <span>Collapse</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 top-0 w-[280px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 z-10 text-sidebar-muted-foreground hover:text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden flex-shrink-0 flex-col md:flex ${sidebarWidth} sticky top-0 h-screen border-r border-sidebar-border transition-all duration-200`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 md:px-6">
          {/* Left: Mobile menu + breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:flex">
              <Link to="/" className="transition-colors hover:text-foreground">
                {tenantName}
              </Link>
              {pathSegments.map((segment, i) => {
                const path = `/${pathSegments.slice(0, i + 1).join("/")}`
                const isLast = i === pathSegments.length - 1
                const label = segment
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())

                return (
                  <span key={path} className="flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                    {isLast ? (
                      <span className="font-semibold text-foreground">
                        {label}
                      </span>
                    ) : (
                      <Link
                        to={path}
                        className="transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    )}
                  </span>
                )
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
            <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
            </button>

            <div className="mx-1 h-6 w-px bg-border" />

            {/* Profile Dropdown */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-accent"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary">
                    {(user.email ?? user.username ?? "U").charAt(0)}
                  </div>
                  <div className="hidden flex-col text-left md:flex">
                    <span className="text-xs font-semibold leading-tight text-foreground">
                      {user.username}
                    </span>
                    <span className="text-[10px] capitalize leading-none text-muted-foreground">
                      {user.role.replace("_", " ")}
                    </span>
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
                    <div className="border-b border-border px-3 py-3">
                      <p className="truncate text-sm font-semibold">
                        {user.email ?? user.username}
                      </p>
                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {user.role.replace("_", " ")} · {tenantName}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => navigate("/profile")}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <User className="mr-2.5 h-4 w-4 text-muted-foreground" />
                        My Profile
                      </button>
                      <button
                        onClick={() => navigate("/settings")}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <Settings className="mr-2.5 h-4 w-4 text-muted-foreground" />
                        Settings
                      </button>
                    </div>
                    <div className="border-t border-border p-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut className="mr-2.5 h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl animate-page-enter px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
