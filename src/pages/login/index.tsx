import { yupResolver } from "@hookform/resolvers/yup"
import { LayoutGrid, Loader2, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Navigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuth } from "@/contexts/auth-context"
import { loginSchema, type TLoginFormData } from "@/features/auth/schema"
import { beginHostedLogin, isHostedAuthEnabled } from "@/lib/hosted-auth"
import {
  getCachedTenantConfig,
  resolveTenant,
  type TenantResolution,
} from "@/features/tenant-config/api"
import {
  TenantDisabledPage,
  TenantNotFoundPage,
  TenantProvisioningPage,
} from "@/pages/login/tenant-state"

const APP_NAME = "{{app-name}}"

// Portal-originated arrivals carry ?sso=1: the login page then auto-starts the
// hosted sign-in (same call as the button) instead of waiting for a click.
// One attempt per arrival — the sessionStorage flag stops an error bounce-back
// from looping. Direct visits (no ?sso=1) keep the click-to-sign-in behavior.
const SSO_AUTO_TRIED_KEY = "hosted_auth_auto_tried"

function isSsoAutoStartRequested(): boolean {
  return new URLSearchParams(window.location.search).get("sso") === "1"
}

function extractSlugFromHost(): string {
  const host = window.location.hostname.toLowerCase()
  if (host === "localhost" || host === "127.0.0.1") return ""
  const parts = host.split(".")
  return parts.length >= 3 ? parts[0] : ""
}

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const slug = extractSlugFromHost()
  const [resolution, setResolution] = useState<TenantResolution | null>(() => {
    const cached = slug ? getCachedTenantConfig(slug) : null
    return cached ? { state: "ok", config: cached } : null
  })
  const [ready, setReady] = useState(!slug || resolution !== null)

  const form = useForm<TLoginFormData>({
    resolver: yupResolver(loginSchema) as any,
    defaultValues: {
      username: "",
      password: "",
    },
  })

  useEffect(() => {
    if (!slug) return
    resolveTenant(slug).then((result) => {
      setResolution((prev) => {
        // Fail open: never downgrade a working cached view on a transport blip.
        if (result.state === "error" && prev?.state === "ok") return prev
        return result
      })
      setReady(true)
    })
  }, [slug])

  // Hosted auth (VITE_AUTH_DOMAIN set): portal-originated arrivals (?sso=1)
  // auto-start the hosted sign-in redirect — but only once the tenant is
  // resolved to a loginable state, and at most once per arrival. Direct
  // visits render the page and wait for the button click.
  const hostedAuth = isHostedAuthEnabled()
  const ssoRequested = isSsoAutoStartRequested()
  const [autoStarting, setAutoStarting] = useState(false)
  const canLogin =
    ready &&
    !isAuthenticated &&
    resolution?.state !== "unknown" &&
    resolution?.state !== "not_ready" &&
    resolution?.state !== "disabled"
  useEffect(() => {
    if (!ssoRequested) {
      // Direct visit: re-arm the one-shot guard for a future portal arrival.
      sessionStorage.removeItem(SSO_AUTO_TRIED_KEY)
      return
    }
    if (!hostedAuth || !canLogin) return
    if (sessionStorage.getItem(SSO_AUTO_TRIED_KEY)) return
    sessionStorage.setItem(SSO_AUTO_TRIED_KEY, "1")
    setAutoStarting(true)
    beginHostedLogin().catch((err) => {
      const msg =
        err instanceof Error ? err.message : "Could not start sign-in."
      setAutoStarting(false)
      setError(msg)
      toast.error(msg)
    })
  }, [hostedAuth, canLogin, ssoRequested])

  const provisioning = resolution?.state === "not_ready"
  useEffect(() => {
    if (!provisioning) return
    const id = window.setInterval(() => {
      resolveTenant(slug).then((result) => {
        // While provisioning, ignore transient lookup errors to avoid
        // flip-flopping; adopt any definitive state (ok/unknown/disabled).
        if (result.state !== "error") setResolution(result)
      })
    }, 5000)
    return () => window.clearInterval(id)
  }, [provisioning, slug])

  if (!ready) return null

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (resolution?.state === "unknown") {
    return <TenantNotFoundPage />
  }
  if (resolution?.state === "not_ready") {
    return <TenantProvisioningPage />
  }
  if (resolution?.state === "disabled") {
    return (
      <TenantDisabledPage
        message={resolution.message}
        branding={resolution.config}
      />
    )
  }

  // "ok" renders the branded login; "error" (or no slug) fails open to the
  // default-branded login form — a tenant-lookup outage must never lock the door.
  const branding = resolution?.state === "ok" ? resolution.config : null

  const displayName = branding?.display_name ?? APP_NAME
  const primaryColor = branding?.primary_color ?? null

  async function onSubmit(data: TLoginFormData) {
    setError(null)
    setLoading(true)
    try {
      await login(data.username, data.password)
      toast.success("Logged in successfully!")
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Invalid username or password!"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Brand Statement ── */}
      <div
        className="relative hidden overflow-hidden bg-primary lg:flex lg:w-[55%]"
        style={primaryColor ? { backgroundColor: primaryColor } : undefined}
      >
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 60 0 L 0 0 0 60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#grid)"
              className="text-primary-foreground"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground xl:p-16">
          {/* Top: Brand */}
          <div className="flex items-center gap-3">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={displayName}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15">
                <LayoutGrid className="h-5 w-5" />
              </div>
            )}
            <div>
              <span className="text-lg font-bold tracking-tight">
                {displayName}
              </span>
              <span className="block text-xs text-primary-foreground/70">
                {branding?.tagline ?? "Powered by Ajna"}
              </span>
            </div>
          </div>

          {/* Center: Statement */}
          <div className="max-w-lg space-y-6">
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
              Your workspace,
              <br />
              simplified.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-primary-foreground/80">
              A secure, multi-tenant platform with role-based access, custom
              fields, and a complete audit trail — built on the Ajna platform.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure, role-based access control</span>
            </div>
          </div>

          {/* Bottom: Note */}
          <p className="max-w-sm text-xs text-primary-foreground/40">
            Multi-tenant SaaS with per-tenant configuration, server-side
            permissions, and a full changelog.
          </p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile-only brand */}
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            {branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={displayName}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                style={
                  primaryColor ? { backgroundColor: primaryColor } : undefined
                }
              >
                <LayoutGrid className="h-5 w-5" />
              </div>
            )}
            <div>
              <span className="text-base font-bold tracking-tight text-foreground">
                {displayName}
              </span>
              <span className="block text-xs text-muted-foreground">
                {branding?.tagline ?? "Powered by Ajna"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground">
              Access your organization's dashboard
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          {hostedAuth ? (
            <div className="space-y-5">
              {autoStarting && !error && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirecting to secure sign-in…</span>
                </div>
              )}
              <Button
                type="button"
                className="h-11 w-full text-sm font-semibold"
                onClick={() => {
                  setError(null)
                  beginHostedLogin().catch((err) => {
                    const msg =
                      err instanceof Error
                        ? err.message
                        : "Could not start sign-in."
                    setError(msg)
                    toast.error(msg)
                  })
                }}
              >
                Continue to sign in
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-foreground">
                        Username / Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter your username or email"
                          disabled={loading}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-medium text-destructive" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-semibold text-foreground">
                          Password
                        </FormLabel>
                        <a
                          href="#"
                          className="text-xs text-muted-foreground transition-colors hover:text-primary"
                        >
                          Forgot password?
                        </a>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          disabled={loading}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-medium text-destructive" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="h-11 w-full text-sm font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          )}

          <p className="pt-4 text-center text-xs text-muted-foreground">
            Built on the Ajna platform
          </p>
        </div>
      </div>
    </div>
  )
}
