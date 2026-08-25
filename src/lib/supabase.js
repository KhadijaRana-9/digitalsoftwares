import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// When credentials are missing we still export a client-shaped object so
// every call site can `await` a call and get a consistent
// { data: null, error } shape instead of crashing on `undefined.from(...)`.
function createUnconfiguredClient() {
  const error = {
    message:
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart the dev server.',
    code: 'SUPABASE_NOT_CONFIGURED',
  }
  const rejected = () => Promise.resolve({ data: null, error })
  const rejectedList = () => Promise.resolve({ data: [], error, count: 0 })

  const queryBuilder = {
    select: () => queryBuilder,
    insert: rejected,
    update: () => queryBuilder,
    delete: () => queryBuilder,
    upsert: rejected,
    eq: () => queryBuilder,
    neq: () => queryBuilder,
    in: () => queryBuilder,
    order: () => queryBuilder,
    limit: () => queryBuilder,
    range: () => queryBuilder,
    single: rejected,
    maybeSingle: rejected,
    then: (resolve) => rejectedList().then(resolve),
  }

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signUp: rejected,
      signInWithPassword: rejected,
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: rejected,
      updateUser: rejected,
    },
    from: () => queryBuilder,
    storage: {
      from: () => ({
        upload: rejected,
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        list: rejectedList,
        remove: rejected,
      }),
    },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
    removeChannel: () => {},
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    })
  : createUnconfiguredClient()
