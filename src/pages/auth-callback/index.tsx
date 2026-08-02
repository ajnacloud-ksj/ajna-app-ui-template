import { Loader2, ShieldAlert } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { completeHostedLogin, isHostedAuthEnabled } from "@/lib/hosted-auth"

/**
 * OAuth2 authorization-code + PKCE callback (hosted auth).
 *
 * The hosted UI redirects here with ?code=…&state=…. We validate state,
 * exchange the code for tokens, then hard-navigate to "/" so AuthProvider
 * re-hydrates from localStorage.
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(() =>
    isHostedAuthEnabled()
      ? null
      : "Hosted sign-in is not enabled for this deployment."
  )
  const ran = useRef(false)

  useEffect(() => {
    // The authorization code and stored PKCE state are single-use — guard
    // against React StrictMode double-invocation.
    if (ran.current) return
    ran.current = true

    if (!isHostedAuthEnabled()) return

    completeHostedLogin(searchParams)
      .then(() => {
        // Full navigation (not client-side) so AuthProvider re-reads
        // auth_token / auth_user from localStorage on boot.
        window.location.replace("/")
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "Sign-in failed. Please try again."
        )
      })
  }, [searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Sign-in failed
          </h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link
            to="/auth/login"
            className="inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Return to login and try again
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Completing sign-in…</span>
      </div>
    </div>
  )
}
