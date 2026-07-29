import { Ban, LayoutGrid, Loader2, SearchX } from "lucide-react"
import type { ReactNode } from "react"

import type { TenantConfig } from "@/features/tenant-config/api"

/**
 * Full-screen state pages shown in place of the login form when the
 * tenant slug resolves to a non-ok state (unknown / not_ready / disabled).
 * Visual shell mirrors the login page: bg-background, centered max-w-sm
 * column, same brand block treatment.
 */

interface TenantStateShellProps {
  icon: ReactNode
  branding?: Partial<TenantConfig> | null
  title: string
  children: ReactNode
}

function TenantStateShell({
  icon,
  branding,
  title,
  children,
}: TenantStateShellProps) {
  const primaryColor = branding?.primary_color ?? null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm space-y-8 text-center">
        {branding?.logo_url ? (
          <img
            src={branding.logo_url}
            alt={branding.display_name ?? "Workspace"}
            className="mx-auto h-10 w-auto object-contain"
          />
        ) : (
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground"
            style={primaryColor ? { backgroundColor: primaryColor } : undefined}
          >
            {icon}
          </div>
        )}

        <div className="space-y-2">
          {branding?.display_name && (
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {branding.display_name}
            </p>
          )}
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          {children}
        </div>

        <p className="pt-4 text-center text-xs text-muted-foreground">
          Built on the Ajna platform
        </p>
      </div>
    </div>
  )
}

export function TenantNotFoundPage() {
  return (
    <TenantStateShell
      icon={<SearchX className="h-6 w-6" />}
      title="Workspace not found"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        No workspace exists at this address. Check the URL or contact your
        administrator.
      </p>
    </TenantStateShell>
  )
}

export function TenantProvisioningPage() {
  return (
    <TenantStateShell
      icon={<LayoutGrid className="h-6 w-6" />}
      title="Your workspace is being set up"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        This usually takes a few minutes. The page will refresh automatically
        once your workspace is ready.
      </p>
      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Checking again shortly…</span>
      </div>
    </TenantStateShell>
  )
}

interface TenantDisabledPageProps {
  message?: string
  branding?: Partial<TenantConfig> | null
}

export function TenantDisabledPage({
  message,
  branding,
}: TenantDisabledPageProps) {
  return (
    <TenantStateShell
      icon={<Ban className="h-6 w-6" />}
      branding={branding}
      title="Workspace unavailable"
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        {message ??
          "This workspace has been disabled. Contact your administrator."}
      </p>
    </TenantStateShell>
  )
}
