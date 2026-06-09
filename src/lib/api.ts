import axios, { type AxiosError } from "axios"

// Support both VITE_API_URL (deploy/static-site) and VITE_API_BASE (docker compose).
const API_HOST = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE

if (!API_HOST) {
  throw new Error(
    "VITE_API_URL (or VITE_API_BASE) environment variable is missing!"
  )
}

// The Ajna API is versioned under /v1 (the SDK serves /v1/auth/login, /v1/{table}, …) and the
// route paths in this app are bare (e.g. "/auth/login"), so the axios baseURL must carry the /v1
// prefix. Normalise to EXACTLY one trailing /v1 — idempotent whether the injected host already
// ends in /v1 or not — so the same code works against a bare host (https://api.example.com) and a
// pre-suffixed one (https://api.example.com/v1) without producing /v1/v1.
const API_BASE = `${String(API_HOST).replace(/\/+$/, '').replace(/\/v1$/, '')}/v1`

export const api = axios.create({
  baseURL: API_BASE,
})

function extractTenantFromHost(): string {
  // Tenant = first label of the host, everywhere the same:
  //   acme.pharmaqr.triviz.cloud   -> "acme"  (production)
  //   acme.pharmaqr.localhost:5173 -> "acme"  (local dev: *.localhost resolves to 127.0.0.1)
  // No environment branches: local dev uses the same subdomain model as production.
  const parts = window.location.hostname.toLowerCase().split(":")[0].split(".")
  if (parts.length < 3) return ""
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
