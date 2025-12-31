export interface TenantUser {
  id: string
  user_id: string
  tenant_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: 'TENANT_OWNER' | 'TENANT_ADMIN' | 'TENANT_MANAGER' | 'TENANT_USER' | 'SUPER_ADMIN'
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INVITED'
  email_verified: boolean
  phone_verified?: boolean
  last_login?: string
  two_factor_enabled?: boolean
  tenant_name?: string
  tenant_slug?: string
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  domain?: string
  logo_url?: string
  settings?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email?: string
  phone?: string
  email_confirmed_at?: string
  phone_confirmed_at?: string
  created_at?: string
  updated_at?: string
}

export interface AuthUser {
  user: User
  tenantUser: TenantUser
  tenant: Tenant
}

export interface SignupData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  organization: string
  password: string
}

export interface LoginData {
  email: string
  password: string
  two_factor_code?: string
}

export interface InvitationData {
  email: string
  role: 'TENANT_ADMIN' | 'TENANT_MANAGER' | 'TENANT_USER'
}

export interface EmailConfirmation {
  id: string
  user_id: string
  token: string
  expires_at: string
  used_at?: string
  created_at: string
}

export interface PasswordReset {
  id: string
  user_id: string
  token: string
  expires_at: string
  used_at?: string
  created_at: string
}

export interface UserInvitation {
  id: string
  tenant_id: string
  invited_by_user_id: string
  invited_by_user?: {
    first_name: string
    last_name: string
    email: string
  }
  email: string
  role: 'TENANT_ADMIN' | 'TENANT_MANAGER' | 'TENANT_USER'
  token: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  expires_at: string
  accepted_at?: string
  created_at: string
}

export interface Chat {
  id: string
  tenant_id: string
  customer_id: string
  assigned_user_id?: string
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED'
  last_message_at?: string
  created_at: string
  updated_at: string
  customer_first_name?: string
  customer_last_name?: string
  customer_email?: string
  assigned_user_first_name?: string
  assigned_user_last_name?: string
  assigned_user_email?: string
  message_count?: number
}

export interface Message {
  id: string
  chat_id: string
  sender_type: 'USER' | 'CUSTOMER' | 'AI'
  sender_id?: string
  content: string
  message_type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO'
  metadata?: Record<string, any>
  created_at: string
}

export interface Permission {
  canViewUsers: boolean
  canManageUsers: boolean
  canViewChats: boolean
  canManageChats: boolean
  canViewAllChats: boolean
  canAssignChats: boolean
  canManageBilling: boolean
  canManageIntegrations: boolean
  canManageOrganization: boolean
  canInviteUsers: boolean
  canViewAnalytics: boolean
}

export const ROLE_PERMISSIONS: Record<string, Permission> = {
  SUPER_ADMIN: {
    canViewUsers: true,
    canManageUsers: true,
    canViewChats: true,
    canManageChats: true,
    canViewAllChats: true,
    canAssignChats: true,
    canManageBilling: true,
    canManageIntegrations: true,
    canManageOrganization: true,
    canInviteUsers: true,
    canViewAnalytics: true,
  },
  TENANT_OWNER: {
    canViewUsers: true,
    canManageUsers: true,
    canViewChats: false,
    canManageChats: false,
    canViewAllChats: false,
    canAssignChats: false,
    canManageBilling: true,
    canManageIntegrations: true,
    canManageOrganization: true,
    canInviteUsers: true,
    canViewAnalytics: true,
  },
  TENANT_ADMIN: {
    canViewUsers: true,
    canManageUsers: false,
    canViewChats: false,
    canManageChats: false,
    canViewAllChats: false,
    canAssignChats: false,
    canManageBilling: false,
    canManageIntegrations: true,
    canManageOrganization: false,
    canInviteUsers: false,
    canViewAnalytics: true,
  },
  TENANT_MANAGER: {
    canViewUsers: true,
    canManageUsers: false,
    canViewChats: true,
    canManageChats: false,
    canViewAllChats: true,
    canAssignChats: true,
    canManageBilling: false,
    canManageIntegrations: false,
    canManageOrganization: false,
    canInviteUsers: false,
    canViewAnalytics: false,
  },
  TENANT_USER: {
    canViewUsers: false,
    canManageUsers: false,
    canViewChats: true,
    canManageChats: false,
    canViewAllChats: false,
    canAssignChats: false,
    canManageBilling: false,
    canManageIntegrations: false,
    canManageOrganization: false,
    canInviteUsers: false,
    canViewAnalytics: false,
  },
}
