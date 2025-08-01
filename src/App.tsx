import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { Quote } from './pages/Quote'
import { Move } from './pages/Move'
import { Documents } from './pages/Documents'
import { Notifications } from './pages/Notifications'
import { Feedback } from './pages/Feedback'
import { Profile } from './pages/Profile'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Services } from './pages/Services'
import { ActivityLog } from './pages/ActivityLog'
import { QuotesList } from './pages/QuotesList' // Import new component
import { NotificationProvider } from './context/NotificationContext'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <NotificationProvider>
                <Layout />
              </NotificationProvider>
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="quote/:id" element={<Quote />} />
            <Route path="move/:id" element={<Move />} />
            <Route path="documents" element={<Documents />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="profile" element={<Profile />} />
            <Route path="services" element={<Services />} />
            <Route path="activity-log" element={<ActivityLog />} />
            <Route path="quotes" element={<QuotesList />} /> {/* New route */}
          </Route>
        </Routes>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App```

### `src/components/Layout.tsx`

You need to add a navigation link to the new `QuotesList` page. I'll add it as a new item in the bottom navigation, which will require adjusting the grid columns.

```typescript
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Bell, FileText, User, LogOut, Package, History, ClipboardList } from 'lucide-react' // Import ClipboardList icon
import { useAuth } from '../hooks/useAuth'
import { useClient } from '../hooks/useClient'
import { useNotifications } from '../context/NotificationContext'

export function Layout() {
  const location = useLocation()
  const { signOut } = useAuth()
  const { client } = useClient()
  const { unreadCount } = useNotifications()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Services', href: '/services', icon: Package },
    { name: 'Activity', href: '/activity-log', icon: History },
    { name: 'Quotes', href: '/quotes', icon: ClipboardList }, // New navigation item
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
        <div className="grid grid-cols-7"> {/* Changed to grid-cols-7 to accommodate new item */}
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
                {item.badge && (
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
