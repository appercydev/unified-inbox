import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { AuthUser, SignupData, LoginData, TenantUser, Tenant } from '@/types/auth'

export async function signUp(data: SignupData): Promise<{ user: any; error: any }> {
  try {
    // First create the tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: data.organization,
        slug: data.organization.toLowerCase().replace(/\s+/g, '-'),
      })
      .select()
      .single()

    if (tenantError) throw tenantError

    // Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
        },
      },
    })

    if (authError) throw authError

    // Create tenant user record
    if (authUser.user) {
      const { error: tenantUserError } = await supabase
        .from('tenant_users')
        .insert({
          user_id: authUser.user.id,
          tenant_id: tenant.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          role: 'TENANT_OWNER',
          status: 'PENDING',
        })

      if (tenantUserError) throw tenantUserError

      // Send email confirmation
      await sendEmailConfirmation(authUser.user.id, data.email)
    }

    return { user: authUser, error: null }
  } catch (error) {
    return { user: null, error }
  }
}

export async function signIn(data: LoginData): Promise<{ user: AuthUser | null; error: any }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) throw authError

    if (!authData.user) throw new Error('No user found')

    // Get tenant user information
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from('user_details')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (tenantUserError) throw tenantUserError

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantUser.tenant_id)
      .single()

    if (tenantError) throw tenantError

    // Update last login
    await supabase
      .from('tenant_users')
      .update({ last_login: new Date().toISOString() })
      .eq('user_id', authData.user.id)

    return {
      user: {
        user: authData.user,
        tenantUser,
        tenant,
      },
      error: null,
    }
  } catch (error) {
    return { user: null, error }
  }
}

export async function signOut(): Promise<{ error: any }> {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    return { error }
  }
}

export async function sendEmailConfirmation(userId: string, email: string): Promise<{ error: any }> {
  try {
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store confirmation token
    const { error: tokenError } = await supabase
      .from('email_confirmations')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
      })

    if (tokenError) throw tokenError

    // Send email (you'll need to implement this with your email service)
    const confirmationUrl = `${process.env.NEXTAUTH_URL}/confirm-email?token=${token}`
    
    // TODO: Implement email sending logic
    console.log('Confirmation URL:', confirmationUrl)

    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function confirmEmail(token: string): Promise<{ success: boolean; error: any }> {
  try {
    // Get and validate token
    const { data: confirmation, error: confirmationError } = await supabase
      .from('email_confirmations')
      .select('*')
      .eq('token', token)
      .eq('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (confirmationError || !confirmation) {
      return { success: false, error: 'Invalid or expired token' }
    }

    // Mark token as used
    await supabase
      .from('email_confirmations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', confirmation.id)

    // Activate user account
    const { error: updateError } = await supabase
      .from('tenant_users')
      .update({ 
        status: 'ACTIVE',
        email_verified: true 
      })
      .eq('user_id', confirmation.user_id)

    if (updateError) throw updateError

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error }
  }
}

export async function sendPasswordReset(email: string): Promise<{ error: any }> {
  try {
    const { data: user, error: userError } = await supabase
      .from('tenant_users')
      .select('user_id')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return { error: 'User not found' }
    }

    const token = generateToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token
    const { error: tokenError } = await supabase
      .from('password_resets')
      .insert({
        user_id: user.user_id,
        token,
        expires_at: expiresAt.toISOString(),
      })

    if (tokenError) throw tokenError

    // Send email (you'll need to implement this with your email service)
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    
    // TODO: Implement email sending logic
    console.log('Reset URL:', resetUrl)

    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error: any }> {
  try {
    // Get and validate token
    const { data: reset, error: resetError } = await supabase
      .from('password_resets')
      .select('*')
      .eq('token', token)
      .eq('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (resetError || !reset) {
      return { success: false, error: 'Invalid or expired token' }
    }

    // Mark token as used
    await supabase
      .from('password_resets')
      .update({ used_at: new Date().toISOString() })
      .eq('id', reset.id)

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) throw updateError

    return { success: true, error: null }
  } catch (error) {
    return { success: false, error }
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // Get tenant user information
    const { data: tenantUser, error: tenantUserError } = await supabase
      .from('user_details')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (tenantUserError) return null

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantUser.tenant_id)
      .single()

    if (tenantError) return null

    return {
      user,
      tenantUser,
      tenant,
    }
  } catch (error) {
    return null
  }
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function hasPermission(userRole: string, permission: keyof ReturnType<typeof getPermissions>): Promise<boolean> {
  const permissions = getPermissions(userRole)
  return permissions[permission] || false
}

function getPermissions(role: string) {
  const { ROLE_PERMISSIONS } = require('@/types/auth')
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.TENANT_USER
}
