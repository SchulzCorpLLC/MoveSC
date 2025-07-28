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
    const count = notifications.filter(n => !n.read).length;
    console.log('useNotifications: unreadCount calculated:', count, 'from notifications:', notifications.map(n => ({id: n.id, read: n.read}))); // Debug log
    return count;
  }, [notifications])

  useEffect(() => {
    if (!client) {
      setNotifications([])
      setLoading(false)
      return
    }

    const fetchNotifications = async () => {
      setLoading(true); // Set loading true before fetch
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('useNotifications: Error fetching notifications:', error)
        setNotifications([])
      } else {
        console.log('useNotifications: Fetched notifications:', data?.map(n => ({id: n.id, read: n.read}))); // Debug log
        setNotifications(data || [])
      }
      setLoading(false); // Set loading false after fetch
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
          console.log('useNotifications: Realtime change detected:', payload); // Debug log
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
    console.log('useNotifications: markAsRead called for ID:', notificationId); // Debug log
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (!error) {
      // Optimistically update local state
      setNotifications(prev => {
        const updated = prev.map(notif => {
          if (notif.id === notificationId) {
            console.log('useNotifications: Optimistically marking as read:', notif.id); // Debug log
            return { ...notif, read: true };
          }
          return notif;
        });
        console.log('useNotifications: Notifications state after optimistic update:', updated.map(n => ({id: n.id, read: n.read}))); // Debug log
        return updated;
      });
    } else {
      console.error('useNotifications: Error marking as read in DB:', error); // Debug log
    }
    return { error }
  }

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    console.log('useNotifications: markAllAsRead called for IDs:', unreadIds); // Debug log
    if (unreadIds.length === 0) return { error: null }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)

    if (!error) {
      // Optimistically update local state
      setNotifications(prev => {
        const updated = prev.map(notif => ({ ...notif, read: true }));
        console.log('useNotifications: Notifications state after optimistic mark all:', updated.map(n => ({id: n.id, read: n.read}))); // Debug log
        return updated;
      });
    } else {
      console.error('useNotifications: Error marking all as read in DB:', error); // Debug log
    }
    return { error }
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
