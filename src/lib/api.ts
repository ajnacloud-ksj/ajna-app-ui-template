import axios, { type AxiosError } from "axios"

// Support both VITE_API_URL (deploy/static-site) and VITE_API_BASE (docker compose).
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE

if (!API_BASE) {
  throw new Error(
    "VITE_API_URL (or VITE_API_BASE) environment variable is missing!"
  )
}

export const api = axios.create({
  baseURL: API_BASE,
})

function extractTenantFromHost(): string {
  const host = window.location.hostname.toLowerCase().split(":")[0]
  // Local dev has no tenant subdomain — fall back to an explicit VITE_TENANT_ID so the
  // backend scopes to the intended tenant (mirrors production subdomain -> X-Tenant-ID),
  // essential for multi-tenant users whose JWT would otherwise resolve arbitrarily.
  if (host === "localhost" || host === "127.0.0.1") {
    return (import.meta.env.VITE_TENANT_ID || "").toLowerCase().replace(/-/g, "_")
  }
  const parts = host.split(".")
  if (parts.length < 3) return ""
  // Normalize to match IbexDB tenant ID convention (hyphens → underscores)
  return parts[0].replace(/-/g, "_")
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const tenant = extractTenantFromHost()
  if (tenant) {
    config.headers["X-Tenant-ID"] = tenant
  }
  return config
})

const USER_FACING_ERRORS: Record<number, string> = {
  400: "The request could not be completed. Please check your input and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You don't have permission to perform this action. Contact your administrator.",
  404: "The requested resource was not found.",
  409: "This record already exists or conflicts with existing data.",
  422: "The submitted data is invalid. Please review and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again shortly.",
  502: "Service is temporarily unavailable. Please try again shortly.",
  503: "Service is temporarily unavailable. Please try again shortly.",
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; detail?: string }>) => {
    const status = error.response?.status
    const serverMessage =
      error.response?.data?.error || error.response?.data?.detail

    const message =
      serverMessage ||
      (status ? USER_FACING_ERRORS[status] : undefined) ||
      "An unexpected error occurred. Please try again."

    return Promise.reject(new Error(message))
  }
)
