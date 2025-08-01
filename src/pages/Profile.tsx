import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Building, Mail, Phone, LogOut, KeyRound } from 'lucide-react' // Added KeyRound icon
import { useClient } from '../hooks/useClient'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase' // Import supabase

// Example regex for a basic phone number validation (adjust as needed)
// This regex allows optional leading +, digits, spaces, hyphens, and parentheses.
const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional().refine((val) => {
    if (val === undefined || val === '') return true; // Allow empty or undefined
    return phoneRegex.test(val);
  }, 'Please enter a valid phone number'),
});

type ProfileForm = z.infer<typeof profileSchema>

const passwordChangeSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>

export function Profile() {
  const { user, signOut } = useAuth()
  const { client, updateClient } = useClient()
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfileForm,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: client?.name || '',
      phone: client?.phone || '',
    }
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema),
  })

  // Update default values when client data loads
  useState(() => {
    if (client) {
      resetProfileForm({
        name: client.name || '',
        phone: client.phone || '',
      });
    }
  }, [client, resetProfileForm]);


  const onSubmitProfile = async (data: ProfileForm) => {
    setUpdatingProfile(true)
    
    // Update the client table
    const { error: clientUpdateError } = await updateClient(data)
    
    if (clientUpdateError) {
      toast.error('Failed to update profile')
      setUpdatingProfile(false)
      return
    }

    // Update the auth.users metadata
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        display_name: data.name, // Changed 'name' to 'display_name'
        phone: data.phone,
      }
    })

    if (authUpdateError) {
      toast.error('Failed to update user authentication data')
    } else {
      toast.success('Profile updated successfully')
    }
    
    setUpdatingProfile(false)
  }

  const onSubmitPassword = async (data: PasswordChangeForm) => {
    setChangingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: data.newPassword,
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully!')
      resetPasswordForm(); // Clear form fields on success
    }

    setChangingPassword(false)
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account information</p>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 mr-2" />
              Full Name
            </label>
            <input
              {...registerProfile('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
            {profileErrors.name && (
              <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div>
            <label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 mr-2" />
              Phone Number
            </label>
            <input
              {...registerProfile('phone')}
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone number"
            />
            {profileErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={updatingProfile}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updatingProfile ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <KeyRound className="h-4 w-4 mr-2" />
              New Password
            </label>
            <input
              {...registerPassword('newPassword')}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter new password"
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <KeyRound className="h-4 w-4 mr-2" />
              Confirm New Password
            </label>
            <input
              {...registerPassword('confirmNewPassword')}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm new password"
            />
            {passwordErrors.confirmNewPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmNewPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>

      {/* Company Information */}
      {client?.company && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-gray-600 text-sm">Company:</span>
              <span className="ml-2 font-medium text-gray-900">{client.company.name}</span>
            </div>
          </div>
          
          <p className="mt-3 text-xs text-gray-500">
            Company information is managed by your moving company
          </p>
        </div>
      )}

      {/* Account Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
        
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-full px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
