import { useEffect, useState } from 'react'
import { supabase, type Database } from '../lib/supabase'
import { useClient } from './useClient'

type Notification = Database['public']['Tables']['notifications']['Row']

export function useNotifications() {
  const { client } = useClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!client) {
      setNotifications([])
      setUnreadCount(0)
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
        setUnreadCount(0)
      } else {
        setNotifications(data || [])
        setUnreadCount(data?.filter(n => !n.read).length || 0)
      }
      setLoading(false)
    }

    fetchNotifications()

    // Optional: Set up real-time subscription for notifications
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
          // Re-fetch or update state based on payload
          // For simplicity, let's re-fetch all notifications
          fetchNotifications();
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription);
    }
  }, [client])

  // Function to mark a single notification as read
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
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
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      )
      setUnreadCount(0)
    }
    return { error }
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
