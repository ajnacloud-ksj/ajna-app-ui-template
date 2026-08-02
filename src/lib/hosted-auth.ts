import type { IUserInfo, TUserRole } from "@/features/auth/types"

// ─── Hosted auth (Cognito Managed Login) — OAuth2 authorization-code + PKCE ──
//
// This module is FEATURE-FLAGGED: it activates only when the build-time var
// VITE_AUTH_DOMAIN is non-empty (e.g. "auth.triviz.cloud"). When the var is
// absent every export is inert and the classic password-form login path is
// completely unchanged.
//
// Env vars read here:
//   VITE_AUTH_DOMAIN          — hosted UI domain (no scheme), enables the flow
//   VITE_USER_POOL_CLIENT_ID  — the app's Cognito app-client id (already part
//                               of the deploy wiring; see .env.example)
//
// Uses only the Web Crypto API — no OIDC client libraries.

const AUTH_DOMAIN = String(import.meta.env.VITE_AUTH_DOMAIN ?? "").trim()
const CLIENT_ID = String(import.meta.env.VITE_USER_POOL_CLIENT_ID ?? "").trim()

// The access token key MUST stay "auth_token" — it is the key the axios
// request interceptor in lib/api.ts reads for the Authorization header.
export const ACCESS_TOKEN_KEY = "auth_token"
export const ID_TOKEN_KEY = "auth_id_token"
export const REFRESH_TOKEN_KEY = "auth_refresh_token"
const USER_KEY = "auth_user"

// PKCE state lives in sessionStorage: it only needs to survive the round-trip
// redirect to the hosted UI within the same tab.
const VERIFIER_KEY = "hosted_auth_pkce_verifier"
const STATE_KEY = "hosted_auth_state"

// Refresh the access token this long before its `exp` claim.
const REFRESH_MARGIN_MS = 60_000
const MIN_REFRESH_DELAY_MS = 5_000

export function isHostedAuthEnabled(): boolean {
  return AUTH_DOMAIN.length > 0
}

// ─── Encoding / crypto helpers ───────────────────────────────────────────────

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function randomUrlSafeString(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength))
  return base64UrlEncode(bytes)
}

async function computeCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  )
  return base64UrlEncode(new Uint8Array(digest))
}

export function decodeJwtPayload(
  token: string
): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(base64)) as Record<string, unknown>
  } catch {
    return null
  }
}

function redirectUri(): string {
  return `${window.location.origin}/auth/callback`
}

function requireClientId(): string {
  if (!CLIENT_ID) {
    throw new Error(
      "Hosted sign-in is misconfigured: VITE_USER_POOL_CLIENT_ID is missing. " +
        "Contact your administrator."
    )
  }
  return CLIENT_ID
}

// ─── Login redirect ──────────────────────────────────────────────────────────

/**
 * Start the authorization-code + PKCE flow: persist verifier + state in
 * sessionStorage, then redirect the browser to the hosted /oauth2/authorize.
 */
export async function beginHostedLogin(): Promise<void> {
  if (!isHostedAuthEnabled()) {
    throw new Error("Hosted sign-in is not enabled for this deployment.")
  }
  const clientId = requireClientId()

  const verifier = randomUrlSafeString(32) // 43-char base64url string
  const state = randomUrlSafeString(16)
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)

  const challenge = await computeCodeChallenge(verifier)
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri(),
    scope: "openid email profile",
    state,
    code_challenge_method: "S256",
    code_challenge: challenge,
  })
  window.location.assign(`https://${AUTH_DOMAIN}/oauth2/authorize?${params}`)
}

// ─── Token endpoint ──────────────────────────────────────────────────────────

interface ITokenResponse {
  access_token: string
  id_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
}

async function requestTokens(
  body: Record<string, string>
): Promise<ITokenResponse> {
  let res: Response
  try {
    res = await fetch(`https://${AUTH_DOMAIN}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
    })
  } catch {
    throw new Error(
      "Could not reach the sign-in service. Check your connection and try again."
    )
  }
  if (!res.ok) {
    let detail = ""
    try {
      const data = (await res.json()) as { error?: string }
      detail = data.error ?? ""
    } catch {
      // non-JSON error body — fall through with the bare status
    }
    throw new Error(
      `Sign-in token exchange failed (${res.status}${detail ? `: ${detail}` : ""}).`
    )
  }
  const data = (await res.json()) as ITokenResponse
  if (!data.access_token) {
    throw new Error("Sign-in token exchange returned no access token.")
  }
  return data
}

function storeTokens(tokens: ITokenResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  if (tokens.id_token) localStorage.setItem(ID_TOKEN_KEY, tokens.id_token)
  // Refresh grants do not return a new refresh token — keep the existing one.
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  }
}

// ─── User profile from the id_token ──────────────────────────────────────────

function roleFromClaims(claims: Record<string, unknown>): TUserRole {
  const explicit = claims["custom:role"]
  if (
    explicit === "super_admin" ||
    explicit === "admin" ||
    explicit === "user"
  ) {
    return explicit
  }
  const groups = Array.isArray(claims["cognito:groups"])
    ? (claims["cognito:groups"] as unknown[]).map(String)
    : []
  if (groups.some((g) => g.includes("super_admin"))) return "super_admin"
  if (groups.some((g) => g.endsWith("admin"))) return "admin"
  return "user"
}

/**
 * Best-effort IUserInfo from id_token claims. Display-only: authoritative
 * permissions still come from GET /auth/permissions (server-side RBAC).
 */
function userFromIdToken(idToken: string | undefined): IUserInfo {
  const claims = idToken ? (decodeJwtPayload(idToken) ?? {}) : {}
  const email = typeof claims.email === "string" ? claims.email : ""
  const cognitoUsername =
    typeof claims["cognito:username"] === "string"
      ? (claims["cognito:username"] as string)
      : ""
  const tenantClaim = claims["custom:tenant_id"] ?? claims["custom:tenant"]
  return {
    user_id: typeof claims.sub === "string" ? claims.sub : "",
    username: email || cognitoUsername,
    email,
    role: roleFromClaims(claims),
    tenant_id: typeof tenantClaim === "string" ? tenantClaim : null,
    company_name: null,
    company_slug: typeof tenantClaim === "string" ? tenantClaim : null,
  }
}

// ─── Callback handling ───────────────────────────────────────────────────────

/**
 * Complete the flow on /auth/callback: validate state, exchange the code for
 * tokens (PKCE — no client secret), persist tokens + a best-effort user
 * profile. Throws a user-readable Error on any failure.
 */
export async function completeHostedLogin(
  query: URLSearchParams
): Promise<void> {
  const storedState = sessionStorage.getItem(STATE_KEY)
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  // Single-use: clear immediately so a replayed callback cannot re-exchange.
  sessionStorage.removeItem(STATE_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)

  const oauthError = query.get("error")
  if (oauthError) {
    throw new Error(
      `Sign-in was rejected: ${query.get("error_description") || oauthError}`
    )
  }
  const code = query.get("code")
  if (!code) {
    throw new Error(
      "The sign-in callback did not include an authorization code."
    )
  }
  const state = query.get("state")
  if (!storedState || state !== storedState) {
    throw new Error(
      "Sign-in state mismatch (stale or invalid callback). Please try again."
    )
  }
  if (!verifier) {
    throw new Error(
      "Sign-in session data is missing — the login was not started in this " +
        "browser tab. Please try again."
    )
  }

  const tokens = await requestTokens({
    grant_type: "authorization_code",
    client_id: requireClientId(),
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  })
  storeTokens(tokens)
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(userFromIdToken(tokens.id_token))
  )
}

// ─── Silent refresh ──────────────────────────────────────────────────────────

let refreshTimer: number | null = null

/**
 * Renew the access token with the stored refresh token. Returns true on
 * success (new tokens stored + next refresh scheduled), false otherwise.
 */
export async function refreshHostedTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!isHostedAuthEnabled() || !refreshToken || !CLIENT_ID) return false
  try {
    const tokens = await requestTokens({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    })
    storeTokens(tokens)
    scheduleHostedTokenRefresh()
    return true
  } catch (err) {
    // Log for diagnosis; callers fall back to interactive login on failure.
    console.error("Hosted-auth silent refresh failed:", err)
    return false
  }
}

/**
 * Proactively refresh the access token shortly before its `exp`. Idempotent —
 * safe to call whenever the token changes. No-op when the flag is off or no
 * refresh token is stored.
 */
export function scheduleHostedTokenRefresh(): void {
  if (!isHostedAuthEnabled()) return
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer)
    refreshTimer = null
  }
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!accessToken || !refreshToken) return

  const payload = decodeJwtPayload(accessToken)
  const exp = typeof payload?.exp === "number" ? payload.exp : null
  if (!exp) return

  const delay = Math.max(
    exp * 1000 - Date.now() - REFRESH_MARGIN_MS,
    MIN_REFRESH_DELAY_MS
  )
  refreshTimer = window.setTimeout(() => {
    void refreshHostedTokens()
  }, delay)
}

// ─── Logout ──────────────────────────────────────────────────────────────────

/**
 * Clear hosted-auth tokens and redirect to the central /oauth2/logout so the
 * Managed Login session dies too. The caller (auth-context) clears
 * auth_token / auth_user itself.
 */
export function hostedLogoutRedirect(): void {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer)
    refreshTimer = null
  }
  localStorage.removeItem(ID_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: `${window.location.origin}/`,
  })
  window.location.assign(`https://${AUTH_DOMAIN}/oauth2/logout?${params}`)
}
