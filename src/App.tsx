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
import { QuotesList } from './pages/QuotesList'
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
            <Route path="quotes" element={<QuotesList />} />
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

export default App
