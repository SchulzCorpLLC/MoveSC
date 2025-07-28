import { useEffect, useState, useMemo } from 'react' // Import useMemo
import { supabase, type Database } from '../lib/supabase'
import { useClient } from './useClient'

type Notification = Database['public']['Tables']['notifications']['Row']

export function useNotifications() {
  const { client } = useClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  // Derive unreadCount from notifications state using useMemo for optimization
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length
  }, [notifications])

  useEffect(() => {
    if (!client) {
      setNotifications([])
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
        setNotifications([])
      } else {
        setNotifications(data || [])
      }
      setLoading(false)
    }

    fetchNotifications()

    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications',
          filter: `client_id=eq.${client.id}`
        },
        (payload) => {
          // When a change occurs, re-fetch all notifications to ensure consistency
          // This handles cases where notifications are added/deleted/updated from outside the app
          fetchNotifications();
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription);
    }
  }, [client]) // Dependency array: only re-run effect if client changes

  // Function to mark a single notification as read
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (!error) {
      // Optimistically update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    }
    return { error }
  }

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return { error: null }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)

    if (!error) {
      // Optimistically update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      )
    }
    return { error }
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
