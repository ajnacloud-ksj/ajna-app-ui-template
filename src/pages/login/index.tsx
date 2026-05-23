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
import {
  getCachedTenantConfig,
  getTenantConfig,
  type TenantConfig,
} from "@/features/tenant-config/api"

const APP_NAME = "{{app-name}}"

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
  const [branding, setBranding] = useState<TenantConfig | null>(() =>
    slug ? getCachedTenantConfig(slug) : null
  )
  const [ready, setReady] = useState(!slug || branding !== null)

  const form = useForm<TLoginFormData>({
    resolver: yupResolver(loginSchema) as any,
    defaultValues: {
      username: "",
      password: "",
    },
  })

  useEffect(() => {
    if (ready) return
    getTenantConfig(slug).then((config) => {
      if (config) setBranding(config)
      setReady(true)
    })
  }, [])

  if (!ready) return null

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

          <p className="pt-4 text-center text-xs text-muted-foreground">
            Built on the Ajna platform
          </p>
        </div>
      </div>
    </div>
  )
}
