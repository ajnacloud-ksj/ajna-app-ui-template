export interface IAuditChange {
  field: string
  before: string | number | boolean | null
  after: string | number | boolean | null
}

export interface IAuditFilter {
  field: string
  operator: string
  value: string
}

export interface IAuditEntry {
  event_id?: string
  timestamp: string
  operation: string
  table_name: string
  user_id: string
  user_email?: string
  role_id?: string
  outcome: string
  deny_reason?: string | null
  duration_ms?: number
  request_id?: string
  filters?: IAuditFilter[] | null
  changes?: IAuditChange[] | null
}
