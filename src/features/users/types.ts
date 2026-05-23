export interface ITenantUser {
  username: string
  email: string
  role: string
  status: string
  enabled: boolean
  created: string
}

export interface IInviteUserPayload {
  email: string
  role: string
  permanent?: boolean
}

export interface IInviteUserResult {
  email: string
  role: string
  temp_password?: string
}

export interface IResetPasswordPayload {
  permanent?: boolean
  new_password?: string
}

export interface IResetPasswordResult {
  temp_password?: string
}
