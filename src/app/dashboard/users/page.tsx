'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import InvitationForm from '@/components/invitations/invitation-form'
import { getCurrentUser } from '@/lib/auth'
import { getInvitations, cancelInvitation, resendInvitation } from '@/lib/invitations'
import { supabase } from '@/lib/supabase'
import { AuthUser, TenantUser, UserInvitation } from '@/types/auth'
import { 
  UsersIcon, 
  EnvelopeIcon, 
  TrashIcon,
  ArrowPathIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'

export default function UsersPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [invitations, setInvitations] = useState<UserInvitation[]>([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }

        // Check if user has permission to view users
        if (!['TENANT_OWNER', 'TENANT_ADMIN', 'TENANT_MANAGER', 'SUPER_ADMIN'].includes(currentUser.tenantUser.role)) {
          router.push('/dashboard')
          return
        }

        setUser(currentUser)

        // Load users
        const { data: usersData } = await supabase
          .from('user_details')
          .select('*')
          .eq('tenant_id', currentUser.tenant.id)
          .order('created_at', { ascending: false })

        setUsers(usersData || [])

        // Load invitations
        const invitationsData = await getInvitations(currentUser.tenant.id)
        setInvitations(invitationsData)
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleCancelInvitation = async (invitationId: string) => {
    const { success } = await cancelInvitation(invitationId)
    if (success) {
      setInvitations(invitations.filter(inv => inv.id !== invitationId))
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    const { success } = await resendInvitation(invitationId)
    if (success) {
      // Refresh invitations
      if (user) {
        const invitationsData = await getInvitations(user.tenant.id)
        setInvitations(invitationsData)
      }
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'TENANT_OWNER':
        return 'bg-purple-100 text-purple-800'
      case 'TENANT_ADMIN':
        return 'bg-blue-100 text-blue-800'
      case 'TENANT_MANAGER':
        return 'bg-green-100 text-green-800'
      case 'TENANT_USER':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const canInvite = ['TENANT_OWNER', 'SUPER_ADMIN'].includes(user.tenantUser.role)

  return (
    <DashboardLayout user={user}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage users and invitations for {user.tenant.name}
              </p>
            </div>
            
            {canInvite && (
              <button
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 flex items-center"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Invite User
              </button>
            )}
          </div>

          {showInviteForm && canInvite && (
            <div className="mb-8">
              <InvitationForm
                tenantId={user.tenant.id}
                invitedByUserId={user.tenantUser.id}
                onSuccess={() => {
                  setShowInviteForm(false)
                  // Refresh invitations
                  getInvitations(user.tenant.id).then(setInvitations)
                }}
              />
            </div>
          )}

          {/* Active Users */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Users ({users.length})</h3>
              
              {users.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No users found</p>
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((tenantUser) => (
                        <tr key={tenantUser.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                                <span className="text-white text-sm font-medium">
                                  {tenantUser.first_name[0]}{tenantUser.last_name[0]}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {tenantUser.first_name} {tenantUser.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{tenantUser.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(tenantUser.role)}`}>
                              {tenantUser.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tenantUser.status)}`}>
                              {tenantUser.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(tenantUser.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Pending Invitations */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Invitations ({invitations.filter(inv => inv.status === 'PENDING').length})</h3>
              
              {invitations.filter(inv => inv.status === 'PENDING').length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending invitations</p>
              ) : (
                <div className="space-y-4">
                  {invitations
                    .filter(inv => inv.status === 'PENDING')
                    .map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                            <EnvelopeIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                            <div className="text-sm text-gray-500">
                              Invited by {invitation.invited_by_user?.first_name} {invitation.invited_by_user?.last_name} • 
                              {' '}{new Date(invitation.created_at).toLocaleDateString()}
                            </div>
                            <div className="mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(invitation.role)}`}>
                                {invitation.role.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Resend invitation"
                          >
                            <ArrowPathIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Cancel invitation"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
