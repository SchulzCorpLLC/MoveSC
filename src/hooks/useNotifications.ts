import { useEffect, useState, useMemo } from 'react'
import { supabase, type Database } from '../lib/supabase'
import { useClient } from './useClient'

type Notification = Database['public']['Tables']['notifications']['Row']

export function useNotifications() {
  const { client } = useClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const unreadCount = useMemo(() => {
    const count = notifications.filter(n => !n.read).length;
    return count;
  }, [notifications])

  useEffect(() => {
    if (!client) {
      setNotifications([])
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      setLoading(true);
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
      setLoading(false);
    }

    fetchNotifications()

    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `client_id=eq.${client.id}`
        },
        (payload) => {
          fetchNotifications();
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription);
    }
  }, [client])

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev => {
        const updated = prev.map(notif => {
          if (notif.id === notificationId) {
            return { ...notif, read: true };
          }
          return notif;
        });
        return updated;
      });
    } else {
      console.error('Error marking as read in DB:', error);
    }
    return { error }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return { error: null }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)

    if (!error) {
      setNotifications(prev => {
        const updated = prev.map(notif => ({ ...notif, read: true }));
        return updated;
      });
    } else {
      console.error('Error marking all as read in DB:', error);
    }
    return { error }
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
