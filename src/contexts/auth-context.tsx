import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import type { IUserInfo, ILoginResponse } from "@/features/auth/types"
import { loginApi } from "@/features/auth/api"

export interface IAuthContextValue {
  user: IUserInfo | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<IAuthContextValue | null>(null)

const TOKEN_KEY = "auth_token"
const USER_KEY = "auth_user"

function loadStoredAuth(): { token: string | null; user: IUserInfo | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const raw = localStorage.getItem(USER_KEY)
    if (token && raw) {
      return { token, user: JSON.parse(raw) as IUserInfo }
    }
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
  return { token: null, user: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => loadStoredAuth().token
  )
  const [user, setUser] = useState<IUserInfo | null>(
    () => loadStoredAuth().user
  )

  const login = useCallback(async (username: string, password: string) => {
    const data: ILoginResponse = await loginApi(username, password)
    const raw = data.user

    // Cognito returns UUID as username; prefer email as display name
    const sanitizedUser: IUserInfo = {
      ...raw,
      username: raw.username?.includes("@")
        ? raw.username
        : raw.email || raw.username,
      company_slug: raw.tenant_id ?? null,
    }

    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(sanitizedUser))

    setToken(data.access_token)
    setUser(sanitizedUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem("active_tenant")
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<IAuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      login,
      logout,
    }),
    [user, token, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): IAuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
