import { supabase } from './supabase'
import { InvitationData, UserInvitation } from '@/types/auth'

export async function sendInvitation(
  tenantId: string,
  invitedByUserId: string,
  data: InvitationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Check if user already exists in tenant
    const { data: existingUser } = await supabase
      .from('tenant_users')
      .select('email')
      .eq('tenant_id', tenantId)
      .eq('email', data.email)
      .single()

    if (existingUser) {
      return { success: false, error: 'User already exists in this organization' }
    }

    // Create invitation
    const { error: invitationError } = await supabase
      .from('user_invitations')
      .insert({
        tenant_id: tenantId,
        invited_by_user_id: invitedByUserId,
        email: data.email,
        role: data.role,
        token,
        expires_at: expiresAt.toISOString(),
      })

    if (invitationError) throw invitationError

    // Send invitation email (you'll need to implement this with your email service)
    const invitationUrl = `${process.env.NEXTAUTH_URL}/accept-invitation?token=${token}`
    
    // TODO: Implement email sending logic
    console.log('Invitation URL:', invitationUrl)

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to send invitation' }
  }
}

export async function getInvitations(tenantId: string): Promise<UserInvitation[]> {
  try {
    const { data, error } = await supabase
      .from('user_invitations')
      .select(`
        *,
        invited_by_user:tenant_users!invited_by_user_id_fkey (
          first_name,
          last_name,
          email
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    return []
  }
}

export async function acceptInvitation(
  token: string,
  firstName: string,
  lastName: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get and validate invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'PENDING')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invitationError || !invitation) {
      return { success: false, error: 'Invalid or expired invitation' }
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (authError) throw authError

    if (!authUser.user) {
      return { success: false, error: 'Failed to create user account' }
    }

    // Create tenant user record
    const { error: tenantUserError } = await supabase
      .from('tenant_users')
      .insert({
        user_id: authUser.user.id,
        tenant_id: invitation.tenant_id,
        first_name: firstName,
        last_name: lastName,
        email: invitation.email,
        role: invitation.role,
        status: 'ACTIVE',
        email_verified: true, // Auto-verify for invited users
      })

    if (tenantUserError) throw tenantUserError

    // Update invitation status
    await supabase
      .from('user_invitations')
      .update({ 
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to accept invitation' }
  }
}

export async function cancelInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_invitations')
      .update({ status: 'CANCELLED' })
      .eq('id', invitationId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to cancel invitation' }
  }
}

export async function resendInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get invitation details
    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('id', invitationId)
      .single()

    if (error || !invitation) {
      return { success: false, error: 'Invitation not found' }
    }

    // Generate new token and extend expiry
    const newToken = generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await supabase
      .from('user_invitations')
      .update({ 
        token: newToken,
        expires_at: expiresAt.toISOString(),
        status: 'PENDING'
      })
      .eq('id', invitationId)

    // Send invitation email
    const invitationUrl = `${process.env.NEXTAUTH_URL}/accept-invitation?token=${newToken}`
    
    // TODO: Implement email sending logic
    console.log('Invitation URL:', invitationUrl)

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to resend invitation' }
  }
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
