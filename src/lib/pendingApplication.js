// If a Supabase project requires email confirmation, signUp() returns no
// session, so the partner_applications insert (which needs an authenticated
// request under RLS) can't happen yet. We stash the form here and flush it
// the moment the user's session becomes available (see AuthContext).
const KEY = 'ds_pending_application'

export function savePendingApplication(payload) {
  try {
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // localStorage unavailable — the applicant will need to re-submit after confirming email.
  }
}

export function loadPendingApplication() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearPendingApplication() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
