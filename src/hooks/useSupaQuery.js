import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase.js'

// Thin wrapper so every page gets the same { data, isLoading, error } shape
// straight from a Supabase query builder, with react-query's caching for free.
export function useSupaQuery(key, build, options = {}) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await build(supabase)
      if (error) throw error
      return data
    },
    ...options,
  })
}

// Same idea for writes — pass (supabase, variables) => query builder promise.
// `invalidate` accepts one or more query keys (or key-prefixes) to refetch on success.
export function useSupaMutation(mutate, { invalidate = [], onSuccess, onError } = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (variables) => {
      const { data, error } = await mutate(supabase, variables)
      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      invalidate.forEach((key) => queryClient.invalidateQueries({ queryKey: key }))
      onSuccess?.(data, variables)
    },
    onError,
  })
}
