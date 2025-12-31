'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signIn } from '@/lib/auth'
import { sendPasswordReset } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { AuthUser } from '@/types/auth'
import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon,
  BuildingOfficeIcon,
  KeyIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export default function SuperAdminPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalUsers: 0,
    totalChats: 0,
    activeSessions: 0,
  })
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.tenantUser.role !== 'SUPER_ADMIN') {
          router.push('/login')
          return
        }
        setUser(currentUser)

        // Load stats
        await loadStats()
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const loadStats = async () => {
    try {
      // Get total organizations
      const { count: orgCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })

      // Get total users
      const { count: userCount } = await supabase
        .from('tenant_users')
        .select('*', { count: 'exact', head: true })

      // Get total chats
      const { count: chatCount } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true })

      // Get active sessions (last 24 hours)
      const { count: sessionCount } = await supabase
        .from('tenant_users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      setStats({
        totalOrganizations: orgCount || 0,
        totalUsers: userCount || 0,
        totalChats: chatCount || 0,
        activeSessions: sessionCount || 0,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage('')

    try {
      const { error } = await sendPasswordReset(resetEmail)
      
      if (error) {
        setResetMessage('Failed to send password reset email')
      } else {
        setResetMessage('Password reset email sent successfully')
        setResetEmail('')
        setShowPasswordReset(false)
      }
    } catch (err) {
      setResetMessage('An unexpected error occurred')
    } finally {
      setResetLoading(false)
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
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Unified Inbox</h1>
              <span className="ml-4 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                SUPER ADMIN
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPasswordReset(true)}
                className="flex items-center text-sm text-gray-700 hover:text-gray-900"
              >
                <KeyIcon className="h-5 w-5 mr-1" />
                Reset Password
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium">SA</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Super Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">SuperAdmin Dashboard</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage all organizations and users across the platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Organizations
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.totalOrganizations}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.totalUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Chats
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.totalChats}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowPathIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Sessions (24h)
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.activeSessions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Manage Users</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              View and manage all users across organizations
            </p>
            <button
              onClick={() => router.push('/superadmin/users')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              View All Users
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Monitor Chats</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              View chat history across all organizations
            </p>
            <button
              onClick={() => router.push('/superadmin/chats')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200"
            >
              View All Chats
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <BuildingOfficeIcon className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Organizations</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Manage tenant organizations
            </p>
            <button
              onClick={() => router.push('/superadmin/organizations')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
            >
              View Organizations
            </button>
          </div>
        </div>
      </main>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowPasswordReset(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <KeyIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Send Password Reset
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Send a password reset link to any user's email address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handlePasswordReset} className="px-4 pb-4 sm:p-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="user@example.com"
                  />
                </div>

                {resetMessage && (
                  <div className={`mt-4 p-3 rounded-md text-sm ${
                    resetMessage.includes('success') 
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {resetMessage}
                  </div>
                )}
              </form>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-blue-400"
                >
                  {resetLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
