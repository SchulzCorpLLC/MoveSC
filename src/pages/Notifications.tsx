import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext' // Import from context
import toast from 'react-hot-toast'

export function Notifications() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications() // Use the new hook

  const handleMarkAsRead = async (notificationId: string) => {
    console.log('Notifications.tsx: handleMarkAsRead called for ID:', notificationId); // Debug log
    const { error } = await markAsRead(notificationId)
    if (!error) {
      toast.success('Notification marked as read')
    } else {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    console.log('Notifications.tsx: handleMarkAllAsRead called'); // Debug log
    const { error } = await markAllAsRead()
    if (!error) {
      toast.success('All notifications marked as read')
    } else {
      toast.error('Failed to mark all as read')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  console.log('Notifications.tsx: Notification item clicked, ID:', notification.id, 'Read status:', notification.read); // Debug log
                  if (!notification.read) {
                    handleMarkAsRead(notification.id);
                  } else {
                    console.log('Notifications.tsx: Notification already read, not calling handleMarkAsRead.');
                  }
                }}
                className={`p-6 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-600 hover:bg-blue-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Bell className={`h-4 w-4 ${!notification.read ? 'text-blue-600' : 'text-gray-400'}`} />
                      <h3 className={`font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-sm ${!notification.read ? 'text-blue-800' : 'text-gray-600'} mb-2`}>
                      {notification.message}
                    </p>
                    
                    <p className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-600">
            You'll see important updates about your moves here
          </p>
        </div>
      )}
    </div>
  )
}
