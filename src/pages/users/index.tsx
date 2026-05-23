import {
  AlertTriangle,
  Key,
  Loader2,
  Lock,
  LockOpen,
  Plus,
  Settings,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePermissions } from "@/contexts/permissions-context"
import {
  useInviteUserMutation,
  useLockUserMutation,
  useResetPasswordMutation,
  useUnlockUserMutation,
  useUpdateUserRoleMutation,
  useUsersQuery,
} from "@/features/users/hooks"
import type { ITenantUser } from "@/features/users/types"

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrator" },
  { value: "user", label: "User" },
]

function roleLabel(role: string): string {
  return (
    ROLE_OPTIONS.find((r) => r.value === role)?.label ??
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function roleBadgeVariant(
  role: string
): "destructive" | "default" | "secondary" | "outline" {
  if (role === "admin") return "destructive"
  return "secondary"
}

// ── Invite Dialog ────────────────────────────────────────────────────────────

interface InviteDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: (tempPassword?: string) => void
}

function InviteDialog({ open, onClose, onSuccess }: InviteDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("user")
  const [permanent, setPermanent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inviteMutation = useInviteUserMutation()

  function handleClose() {
    setEmail("")
    setRole("user")
    setPermanent(false)
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const result = await inviteMutation.mutateAsync({
        email: email.trim(),
        role,
        permanent,
      })
      handleClose()
      onSuccess(result.temp_password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to a new user to join your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="permanent-pwd"
                type="checkbox"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
                className="cursor-pointer"
              />
              <label
                htmlFor="permanent-pwd"
                className="cursor-pointer text-sm text-muted-foreground"
              >
                Set permanent password — user can sign in immediately, no email
                required
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={inviteMutation.isPending || !email.trim()}
            >
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Inviting...
                </>
              ) : (
                "Send Invite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Change Role Dialog ────────────────────────────────────────────────────────

interface ChangeRoleDialogProps {
  open: boolean
  user: ITenantUser | null
  onClose: () => void
  onSuccess: () => void
}

function ChangeRoleDialog({
  open,
  user,
  onClose,
  onSuccess,
}: ChangeRoleDialogProps) {
  const [role, setRole] = useState(user?.role ?? "user")
  const [error, setError] = useState<string | null>(null)
  const updateRoleMutation = useUpdateUserRoleMutation()

  useEffect(() => {
    if (user) setRole(user.role)
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    try {
      await updateRoleMutation.mutateAsync({
        username: user.username,
        role,
      })
      onClose()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Changing role for <strong>{user?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={updateRoleMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Reset Password Dialog ─────────────────────────────────────────────────────

interface ResetPasswordDialogProps {
  open: boolean
  user: ITenantUser | null
  onClose: () => void
  onSuccess: (tempPassword?: string) => void
}

function ResetPasswordDialog({
  open,
  user,
  onClose,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [tab, setTab] = useState<"generate" | "set">("generate")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const resetMutation = useResetPasswordMutation()

  function handleClose() {
    setTab("generate")
    setNewPassword("")
    setConfirmPassword("")
    setError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!user) return

    if (tab === "set") {
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters")
        return
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match")
        return
      }
    }

    try {
      if (tab === "set") {
        await resetMutation.mutateAsync({
          username: user.username,
          opts: { new_password: newPassword },
        })
        handleClose()
        onSuccess()
      } else {
        const result = await resetMutation.mutateAsync({
          username: user.username,
          opts: { permanent: true },
        })
        handleClose()
        onSuccess(result.temp_password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Resetting password for <strong>{user?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Tab switcher */}
            <div className="flex rounded-lg border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("generate")
                  setError(null)
                }}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  tab === "generate"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Generate
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("set")
                  setError(null)
                }}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  tab === "set"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Set Password
              </button>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {tab === "generate" ? (
              <p className="text-sm text-muted-foreground">
                A new temporary password will be generated and shown to you
                once. Share it with the user — they can sign in immediately.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={resetMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={resetMutation.isPending}>
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : tab === "generate" ? (
                "Generate Password"
              ) : (
                "Set Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Temp Password Dialog ──────────────────────────────────────────────────────

interface TempPasswordDialogProps {
  open: boolean
  tempPassword: string
  title: string
  onClose: () => void
}

function TempPasswordDialog({
  open,
  tempPassword,
  title,
  onClose,
}: TempPasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Share this temporary password with the user. It will not be shown
            again.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-lg bg-muted px-4 py-3 font-mono text-base tracking-widest select-all break-all">
            {tempPassword}
          </div>
        </div>
        <DialogFooter className="border-t border-border pt-4">
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  destructive?: boolean
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  loading,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle
            className={destructive ? "text-destructive" : undefined}
          >
            {title}
          </DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ConfirmAction =
  | { type: "lock"; user: ITenantUser }
  | { type: "unlock"; user: ITenantUser }
  | null

export default function UsersPage() {
  const { canManageUsers: isAdmin } = usePermissions()

  const { data: users = [], isLoading, error } = useUsersQuery()
  const lockMutation = useLockUserMutation()
  const unlockMutation = useUnlockUserMutation()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [changeRoleTarget, setChangeRoleTarget] = useState<ITenantUser | null>(
    null
  )
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [resetTarget, setResetTarget] = useState<ITenantUser | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [tempPasswordTitle, setTempPasswordTitle] =
    useState("Temporary Password")

  function handleInviteSuccess(tmpPwd?: string) {
    if (tmpPwd) {
      setTempPasswordTitle("User Invited — Temporary Password")
      setTempPassword(tmpPwd)
    } else {
      toast.success("User invited successfully")
    }
  }

  function handleChangeRoleSuccess() {
    toast.success("Role updated")
  }

  function handleResetSuccess(tmpPwd?: string) {
    if (tmpPwd) {
      setTempPasswordTitle("Password Reset — Temporary Password")
      setTempPassword(tmpPwd)
    } else {
      toast.success("Password updated successfully")
    }
  }

  async function handleConfirmAction() {
    if (!confirmAction) return
    const { type, user: target } = confirmAction
    try {
      if (type === "lock") {
        await lockMutation.mutateAsync(target.username)
        toast.success(`${target.email} locked`)
      } else {
        await unlockMutation.mutateAsync(target.username)
        toast.success(`${target.email} unlocked`)
      }
      setConfirmAction(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed")
    }
  }

  const actionLoading = lockMutation.isPending || unlockMutation.isPending

  function buildConfirmProps(): Omit<ConfirmDialogProps, "open"> {
    if (!confirmAction) {
      return {
        title: "",
        message: "",
        loading: false,
        onClose: () => setConfirmAction(null),
        onConfirm: handleConfirmAction,
      }
    }
    const { type, user: target } = confirmAction
    if (type === "lock") {
      return {
        title: "Lock User",
        message: `Lock ${target.email}? They will no longer be able to sign in.`,
        confirmLabel: "Lock",
        destructive: true,
        loading: actionLoading,
        onClose: () => setConfirmAction(null),
        onConfirm: handleConfirmAction,
      }
    }
    return {
      title: "Unlock User",
      message: `Re-enable access for ${target.email}?`,
      confirmLabel: "Unlock",
      loading: actionLoading,
      onClose: () => setConfirmAction(null),
      onConfirm: handleConfirmAction,
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Users
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, roles, and access control.
          </p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setInviteOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Invite User
          </Button>
        )}
      </div>

      {/* ── Table Content ── */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading users...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold text-destructive">
            {error instanceof Error
              ? error.message
              : "Failed to load users"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-border bg-card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/25" />
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-foreground">
              No Users Found
            </h3>
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Invite users to join your organization.
            </p>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2 gap-1.5"
              onClick={() => setInviteOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Invite First User
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>Email / Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Created</TableHead>
                {isAdmin && (
                  <TableHead className="w-[120px] text-right">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.username}>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">
                      {u.email}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {u.username}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant(u.role)}>
                      {roleLabel(u.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.status === "CONFIRMED" ? "default" : "outline"}
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.enabled ? "default" : "destructive"}>
                      {u.enabled ? "Active" : "Locked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.created
                      ? new Date(u.created).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Change Role"
                          onClick={() => setChangeRoleTarget(u)}
                        >
                          <Settings className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={u.enabled ? "Lock" : "Unlock"}
                          onClick={() =>
                            setConfirmAction({
                              type: u.enabled ? "lock" : "unlock",
                              user: u,
                            })
                          }
                        >
                          {u.enabled ? (
                            <Lock className="h-4 w-4 text-amber-500" />
                          ) : (
                            <LockOpen className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Reset Password"
                          onClick={() => setResetTarget(u)}
                        >
                          <Key className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length > 0 && (
            <div className="border-t border-border bg-muted/20 px-4 py-2">
              <p className="text-xs text-muted-foreground">
                {users.length} user{users.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Dialogs ── */}
      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={handleInviteSuccess}
      />

      <ChangeRoleDialog
        open={Boolean(changeRoleTarget)}
        user={changeRoleTarget}
        onClose={() => setChangeRoleTarget(null)}
        onSuccess={handleChangeRoleSuccess}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        {...buildConfirmProps()}
      />

      <ResetPasswordDialog
        open={Boolean(resetTarget)}
        user={resetTarget}
        onClose={() => setResetTarget(null)}
        onSuccess={handleResetSuccess}
      />

      {tempPassword && (
        <TempPasswordDialog
          open={Boolean(tempPassword)}
          tempPassword={tempPassword}
          title={tempPasswordTitle}
          onClose={() => setTempPassword(null)}
        />
      )}
    </div>
  )
}
