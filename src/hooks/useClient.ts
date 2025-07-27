import { useEffect, useState } from 'react'
import { supabase, type Database } from '../lib/supabase'
import { useAuth } from './useAuth'

type Client = Database['public']['Tables']['clients']['Row'] & {
  company: Database['public']['Tables']['companies']['Row']
}

export function useClient() {
  const { user } = useAuth()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setClient(null)
      setLoading(false)
      return
    }

    const fetchClient = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching client:', error)
      } else {
        setClient(data as Client)
      }
      setLoading(false)
    }

    fetchClient()
  }, [user])

  const updateClient = async (updates: Partial<Pick<Client, 'name' | 'phone'>>) => {
    if (!client) return

    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', client.id)

    if (!error) {
      setClient({ ...client, ...updates })
    }

    return { error }
  }

  return {
    client,
    loading,
    updateClient
  }
}