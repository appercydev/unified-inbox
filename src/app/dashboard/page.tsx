'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { getCurrentUser } from '@/lib/auth'
import { AuthUser } from '@/types/auth'
import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon, 
  BuildingOfficeIcon,
  ChartBarIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
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
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

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

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getStats = () => {
    const role = user.tenantUser.role
    
    if (role === 'SUPER_ADMIN') {
      return [
        { name: 'Total Organizations', value: '12', icon: BuildingOfficeIcon, color: 'bg-blue-500' },
        { name: 'Total Users', value: '248', icon: UsersIcon, color: 'bg-green-500' },
        { name: 'Total Chats', value: '1,429', icon: ChatBubbleLeftRightIcon, color: 'bg-purple-500' },
        { name: 'Active Sessions', value: '89', icon: ChartBarIcon, color: 'bg-orange-500' },
      ]
    }

    if (role === 'TENANT_OWNER') {
      return [
        { name: 'Team Members', value: '8', icon: UsersIcon, color: 'bg-blue-500' },
        { name: 'Active Integrations', value: '3', icon: BuildingOfficeIcon, color: 'bg-green-500' },
        { name: 'Monthly Credits', value: '5,000', icon: ChartBarIcon, color: 'bg-purple-500' },
        { name: 'Billing Status', value: 'Active', icon: CreditCardIcon, color: 'bg-green-500' },
      ]
    }

    if (role === 'TENANT_ADMIN') {
      return [
        { name: 'Team Members', value: '8', icon: UsersIcon, color: 'bg-blue-500' },
        { name: 'Active Integrations', value: '3', icon: BuildingOfficeIcon, color: 'bg-green-500' },
      ]
    }

    if (role === 'TENANT_MANAGER') {
      return [
        { name: 'Total Chats', value: '142', icon: ChatBubbleLeftRightIcon, color: 'bg-blue-500' },
        { name: 'Team Members', value: '8', icon: UsersIcon, color: 'bg-green-500' },
        { name: 'Assigned to You', value: '23', icon: ChatBubbleLeftRightIcon, color: 'bg-purple-500' },
      ]
    }

    if (role === 'TENANT_USER') {
      return [
        { name: 'Your Chats', value: '12', icon: ChatBubbleLeftRightIcon, color: 'bg-blue-500' },
        { name: 'Messages Today', value: '47', icon: ChatBubbleLeftRightIcon, color: 'bg-green-500' },
      ]
    }

    return []
  }

  const stats = getStats()

  return (
    <DashboardLayout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {getWelcomeMessage()}, {user.tenantUser.first_name}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome to {user.tenant.name}. Here's what's happening today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon className={`h-6 w-6 text-white ${stat.color} rounded-md p-1`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="text-lg font-semibold text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {user.tenantUser.role === 'TENANT_OWNER' && (
                <>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Invite Team Member</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add new users to your organization
                    </p>
                    <button
                      onClick={() => router.push('/dashboard/users/invite')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      Invite User
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Setup Integration</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Connect with external services
                    </p>
                    <button
                      onClick={() => router.push('/dashboard/integrations')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      Manage Integrations
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Organization Settings</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Update your organization details
                    </p>
                    <button
                      onClick={() => router.push('/dashboard/organization')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      Edit Organization
                    </button>
                  </div>
                </>
              )}

              {(user.tenantUser.role === 'TENANT_MANAGER' || user.tenantUser.role === 'TENANT_USER') && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">View Chats</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage customer conversations
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/chats')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                  >
                    Go to Chats
                  </button>
                </div>
              )}

              {user.tenantUser.role === 'TENANT_ADMIN' && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Integrations</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure external service connections
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/integrations')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                  >
                    Manage Integrations
                  </button>
                </div>
              )}

              {user.tenantUser.role === 'SUPER_ADMIN' && (
                <>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">View All Users</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage users across all organizations
                    </p>
                    <button
                      onClick={() => router.push('/superadmin/users')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      View Users
                    </button>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">View All Chats</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Monitor conversations across platform
                    </p>
                    <button
                      onClick={() => router.push('/superadmin/chats')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      View Chats
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
