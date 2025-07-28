import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications as useNotificationsHook } from '../hooks/useNotifications'; // Rename to avoid conflict
import { Database } from '../lib/supabase'; // Import Database type

// Define the shape of the context value
interface NotificationContextType {
  notifications: Database['public']['Tables']['notifications']['Row'][];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<{ error: any | null }>;
  markAllAsRead: () => Promise<{ error: any | null }>;
}

// Create the context with a default undefined value
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Create the provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const notificationState = useNotificationsHook(); // Use the hook here

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to consume the context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

