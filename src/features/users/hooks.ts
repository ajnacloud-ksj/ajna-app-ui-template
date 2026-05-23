import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listUsers,
  inviteUser,
  updateUserRole,
  lockUser,
  unlockUser,
  resetUserPassword,
} from "./api"
import type { IInviteUserPayload, IResetPasswordPayload } from "./types"

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
}

export function useUsersQuery() {
  return useQuery({
    queryKey: usersKeys.lists(),
    queryFn: listUsers,
  })
}

export function useInviteUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: IInviteUserPayload) => inviteUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ username, role }: { username: string; role: string }) =>
      updateUserRole(username, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}

export function useLockUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => lockUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}

export function useUnlockUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (username: string) => unlockUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({
      username,
      opts,
    }: {
      username: string
      opts: IResetPasswordPayload
    }) => resetUserPassword(username, opts),
  })
}
