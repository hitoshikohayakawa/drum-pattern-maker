const LOCAL_OWNER_KEY = 'dpm_local_owner_user_id'

export function getLocalOwnerUserId() {
  if (typeof window === 'undefined') return 'local-preview-user'

  const existing = window.localStorage.getItem(LOCAL_OWNER_KEY)
  if (existing) return existing

  const nextId = `local-${window.crypto?.randomUUID?.() || String(Date.now())}`
  window.localStorage.setItem(LOCAL_OWNER_KEY, nextId)
  return nextId
}
