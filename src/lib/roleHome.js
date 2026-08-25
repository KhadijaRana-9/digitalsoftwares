// Single source of truth for "which dashboard does this role land on".
// Used by AuthContext (reactive homePath, for guards/nav) and by Login
// (a direct post-signIn lookup, since the context's own profile fetch is
// async and hasn't necessarily resolved yet in the same tick signIn() does).
export function roleHomePath(role) {
  if (role === 'admin' || role === 'super_admin') return '/admin/dashboard'
  if (role === 'customer') return '/customer/dashboard'
  if (role === 'partner') return '/partner/dashboard'
  return '/login'
}
