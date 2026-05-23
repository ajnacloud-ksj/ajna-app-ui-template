import {
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom"

import ProtectedRoute from "@/components/protected-route"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { PermissionsProvider } from "@/contexts/permissions-context"
import QueryProvider from "@/contexts/query-provider"
import { ThemeProvider } from "@/contexts/theme-provider"
import AppLayout from "@/layouts/app-layout"
import LoginPage from "@/pages/login"
import Dashboard from "@/pages/dashboard"
import NotFoundPage from "@/pages/not-found"
import ItemListPage from "@/pages/items"
import ItemCreatePage from "@/pages/items/create"
import ItemViewPage from "@/pages/items/view"
import ItemEditPage from "@/pages/items/edit"
import AuditLogsListPage from "@/pages/audit-log"
import UsersPage from "@/pages/users"
import FieldConfigPage from "@/pages/field-config"
import RolePermissionsPage from "@/pages/role-permissions"

function AllRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* ── Authenticated app ── */}
      <Route
        path="/"
        element={
          <ProtectedRoute visitCondition={!!user} route="/auth/login">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        <Route path="items">
          <Route index element={<ItemListPage />} />
          <Route path="new" element={<ItemCreatePage />} />
          <Route path=":itemId" element={<ItemViewPage />} />
          <Route path=":itemId/edit" element={<ItemEditPage />} />
        </Route>

        <Route path="audit-log" element={<AuditLogsListPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="field-config" element={<FieldConfigPage />} />
        <Route path="role-permissions" element={<RolePermissionsPage />} />
      </Route>

      {/* ── Auth ── */}
      <Route
        path="/auth"
        element={
          <ProtectedRoute visitCondition={!user} route="/">
            <Outlet />
          </ProtectedRoute>
        }
      >
        <Route path="login" element={<LoginPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <QueryProvider>
          <PermissionsProvider>
            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
              <AllRoutes />
              <Toaster richColors />
            </ThemeProvider>
          </PermissionsProvider>
        </QueryProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
