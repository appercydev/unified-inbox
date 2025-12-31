'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { AuthUser } from '@/types/auth'
import { UserIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        setUser(currentUser)
        setFormData({
          first_name: currentUser.tenantUser.first_name,
          last_name: currentUser.tenantUser.last_name,
          email: currentUser.tenantUser.email,
          phone: currentUser.tenantUser.phone || '',
        })
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('tenant_users')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
        })
        .eq('id', user?.tenantUser.id)

      if (error) {
        setError('Failed to update profile')
      } else {
        setSuccess('Profile updated successfully!')
        
        // Update local state
        if (user) {
          setUser({
            ...user,
            tenantUser: {
              ...user.tenantUser,
              first_name: formData.first_name,
              last_name: formData.last_name,
              phone: formData.phone,
            }
          })
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your personal information and account settings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          required
                          value={formData.first_name}
                          onChange={handleChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                          Last Name
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          name="last_name"
                          required
                          value={formData.last_name}
                          onChange={handleChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Email cannot be changed. Contact support if you need to update it.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Summary</h3>
                  
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center mb-4">
                      <span className="text-white text-2xl font-medium">
                        {user.tenantUser.first_name[0]}{user.tenantUser.last_name[0]}
                      </span>
                    </div>
                    
                    <div className="text-center">
                      <h4 className="text-lg font-medium text-gray-900">
                        {user.tenantUser.first_name} {user.tenantUser.last_name}
                      </h4>
                      <p className="text-sm text-gray-500">{user.tenantUser.role.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">{user.tenant.name}</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600">{user.tenantUser.email}</span>
                    </div>
                    
                    {user.tenantUser.phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-600">{user.tenantUser.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600">
                        Member since {new Date(user.tenantUser.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Account Status</span>
                        <span className={`font-medium ${
                          user.tenantUser.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {user.tenantUser.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Email Verified</span>
                        <span className={`font-medium ${
                          user.tenantUser.email_verified ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {user.tenantUser.email_verified ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {user.tenantUser.last_login && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Last Login</span>
                          <span className="text-gray-900">
                            {new Date(user.tenantUser.last_login).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
