import { useEffect } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'

export function useNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['notifications', user?.id]

  const query = useQuery({
    queryKey,
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data ?? []
    },
  })

  useEffect(() => {
    if (!isSupabaseConfigured || !user?.id) return
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `partner_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const markRead = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('partner_id', user.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const notifications = query.data ?? []
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { ...query, notifications, unreadCount, markRead, markAllRead }
}
