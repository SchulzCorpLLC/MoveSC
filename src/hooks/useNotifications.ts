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
    console.log('useNotifications: unreadCount calculated:', count, 'from notifications:', notifications.map(n => ({id: n.id, read: n.read})));
    return count;
  }, [notifications])

  useEffect(() => {
    console.log('useNotifications: useEffect running. Client:', client);
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
        console.error('useNotifications: Error fetching notifications:', error)
        setNotifications([])
      } else {
        console.log('useNotifications: Fetched notifications:', data?.map(n => ({id: n.id, read: n.read})));
        setNotifications(data || [])
      }
      setLoading(false);
    }

    fetchNotifications()

    // Temporarily comment out the real-time subscription
    /*
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
          console.log('useNotifications: Realtime change detected:', payload);
          fetchNotifications();
        }
      )
      .subscribe()

    return () => {
      console.log('useNotifications: Cleaning up subscription.');
      supabase.removeChannel(subscription);
    }
    */
    // Return an empty cleanup function if no subscription is active
    return () => {};
  }, [client])

  const markAsRead = async (notificationId: string) => {
    console.log('useNotifications: markAsRead called for ID:', notificationId);
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(prev => {
        const updated = prev.map(notif => {
          if (notif.id === notificationId) {
            console.log('useNotifications: Optimistically marking as read:', notif.id);
            return { ...notif, read: true };
          }
          return notif;
        });
        console.log('useNotifications: Notifications state after optimistic update:', updated.map(n => ({id: n.id, read: n.read})));
        return updated;
      });
    } else {
      console.error('useNotifications: Error marking as read in DB:', error);
    }
    return { error }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    console.log('useNotifications: markAllAsRead called for IDs:', unreadIds);
    if (unreadIds.length === 0) return { error: null }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', unreadIds)

    if (!error) {
      setNotifications(prev => {
        const updated = prev.map(notif => ({ ...notif, read: true }));
        console.log('useNotifications: Notifications state after optimistic mark all:', updated.map(n => ({id: n.id, read: n.read})));
        return updated;
      });
    } else {
      console.error('useNotifications: Error marking all as read in DB:', error);
    }
    return { error }
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead }
}
