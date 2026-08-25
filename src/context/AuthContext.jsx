import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { loadPendingApplication, clearPendingApplication } from '../lib/pendingApplication.js'
import { roleHomePath } from '../lib/roleHome.js'

const AuthContext = createContext(null)

async function flushPendingApplication(user) {
  const pending = loadPendingApplication()
  if (!pending || pending.email !== user.email) return
  const { data: existing } = await supabase
    .from('partner_applications')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (existing) {
    clearPendingApplication()
    return
  }
  const { error } = await supabase.from('partner_applications').insert({ ...pending, user_id: user.id })
  if (!error) clearPendingApplication()
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [customerRecord, setCustomerRecord] = useState(null)
  const [permissions, setPermissions] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setPartnerProfile(null)
      setCustomerRecord(null)
      setPermissions(new Set())
      return
    }
    const [{ data: profileRow }, { data: partnerRow }, { data: customerRow }] = await Promise.all([
      supabase.from('profiles').select('*, admin_role:roles(*)').eq('id', userId).maybeSingle(),
      supabase
        .from('partner_profiles')
        .select('*, tier:partner_tiers(*)')
        .eq('id', userId)
        .maybeSingle(),
      supabase.from('customers').select('*').eq('user_id', userId).maybeSingle(),
    ])
    setProfile(profileRow ?? null)
    setPartnerProfile(partnerRow ?? null)
    setCustomerRecord(customerRow ?? null)

    if (profileRow?.role === 'admin' && profileRow.admin_role_id) {
      const { data: permRows } = await supabase
        .from('role_permissions')
        .select('permission:permissions(key)')
        .eq('role_id', profileRow.admin_role_id)
      setPermissions(new Set((permRows ?? []).map((r) => r.permission?.key).filter(Boolean)))
    } else {
      setPermissions(new Set())
    }
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session ?? null)
      if (data.session?.user) {
        await flushPendingApplication(data.session.user)
        await loadProfile(data.session.user.id)
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        await flushPendingApplication(newSession.user)
        await loadProfile(newSession.user.id)
      } else {
        setProfile(null)
        setPartnerProfile(null)
      }
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [loadProfile])

  const signUp = useCallback(async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return { data, error }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    setPartnerProfile(null)
    setCustomerRecord(null)
  }, [])

  const sendPasswordReset = useCallback(async (email) => {
    const redirectTo = `${window.location.origin}/reset-password`
    return supabase.auth.resetPasswordForEmail(email, { redirectTo })
  }, [])

  const updatePassword = useCallback(async (password) => {
    return supabase.auth.updateUser({ password })
  }, [])

  const refreshProfile = useCallback(() => {
    if (session?.user?.id) return loadProfile(session.user.id)
    return Promise.resolve()
  }, [session, loadProfile])

  const isSuperAdmin = profile?.role === 'super_admin'
  const isStaff = profile?.role === 'admin' || isSuperAdmin
  const homePath = roleHomePath(profile?.role)

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    partnerProfile,
    role: profile?.role ?? null,
    // isAdmin means "internal staff" (admin or super_admin) — kept broad to
    // match the SQL is_admin() helper so route guards and nav stay in sync
    // with what RLS actually allows.
    isAdmin: isStaff,
    isStaff,
    isSuperAdmin,
    isPartner: profile?.role === 'partner',
    isCustomer: profile?.role === 'customer',
    customerRecord,
    // A suspended partner still has a partner_profiles row (financial/history
    // data is never deleted) but must not retain portal access — status
    // must be 'active' to count as approved.
    isApprovedPartner: profile?.role === 'partner' && partnerProfile?.status === 'active',
    isSuspendedPartner: profile?.role === 'partner' && partnerProfile?.status === 'suspended',
    adminRoleName: isSuperAdmin ? 'Super Admin' : profile?.admin_role?.name ?? null,
    homePath,
    permissions,
    hasPermission: (key) => isSuperAdmin || permissions.has(key),
    loading,
    isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    updatePassword,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
