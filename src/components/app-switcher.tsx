import { ArrowRight, Grip } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useAuth } from "@/contexts/auth-context"

/**
 * Compact app-switcher ("waffle") for the top bar (cockpit#98).
 *
 * Deliberately makes NO API calls — cross-app token audiences are not
 * fleet-wide yet, so this is purely a navigation affordance: a single
 * "All apps" entry that links to the org door (the portal), which handles
 * login/entitlement and lists the org's apps.
 *
 * Door host resolution:
 * - VITE_PORTAL_ORG_HOST (build-time, optional) wins when set.
 * - Otherwise derived from the current host by dropping its first label:
 *   myapp.triviz.cloud → portal.triviz.cloud.
 * - localhost / bare hosts have no zone — fall back to the central dev portal.
 */

const FALLBACK_PORTAL_HOST = "portal.triviz.cloud"

export function resolvePortalUrl(
  hostname: string = window.location.hostname
): string {
  const configured = String(import.meta.env.VITE_PORTAL_ORG_HOST ?? "").trim()
  if (configured) {
    const host = configured.replace(/^https?:\/\//, "").replace(/\/+$/, "")
    if (host) return `https://${host}`
  }
  const host = hostname.toLowerCase().split(":")[0]
  const zone = host.split(".").slice(1).join(".")
  if (!zone || !zone.includes(".")) return `https://${FALLBACK_PORTAL_HOST}`
  return `https://portal.${zone}`
}

export default function AppSwitcher() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Navigation affordance for signed-in users only.
  if (!user) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Switch apps"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Grip className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg">
          <div className="p-1.5">
            <a
              href={resolvePortalUrl()}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
            >
              <span>All apps</span>
              <ArrowRight className="ml-2.5 h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
