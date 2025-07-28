import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Bell, FileText, User, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useClient } from '../hooks/useClient'
import { useNotifications } from '../hooks/useNotifications' // Import the new hook

export function Layout() {
  const location = useLocation()
  const { signOut } = useAuth()
  const { client } = useClient()
  const { unreadCount } = useNotifications() // Use the new hook to get unreadCount

  console.log('Layout.tsx: Rendering Layout component. Unread count:', unreadCount); // Debug log

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null }, // Add badge property
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {client?.company?.logo_url ? (
              <img 
                src={client.company.logo_url} 
                alt={client.company.name}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {client?.company?.name?.charAt(0) || 'M'}
                </span>
              </div>
            )}
            <h1 className="text-xl font-semibold text-gray-900">MoveSC</h1>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="grid grid-cols-4">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`relative flex flex-col items-center py-3 px-2 text-xs transition-colors ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="font-medium">{item.name}</span>
                {item.badge && ( // Conditionally render the badge
                  <span className="absolute top-1 right-4 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
