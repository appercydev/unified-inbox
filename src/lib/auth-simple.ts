// Simple auth functions for deployment without database operations

export async function signUp(data: any) {
  // TODO: Implement actual signup with database
  return { user: null, error: 'Signup temporarily disabled for deployment' }
}

export async function signIn(data: any) {
  // TODO: Implement actual signin with database
  return { user: null, error: 'Signin temporarily disabled for deployment' }
}

export async function signOut() {
  return { error: null }
}

export async function getCurrentUser() {
  return null
}

export async function sendEmailConfirmation() {
  return { error: null }
}

export async function confirmEmail() {
  return { success: false, error: 'Email confirmation temporarily disabled' }
}

export async function sendPasswordReset() {
  return { error: null }
}

export async function resetPassword() {
  return { success: false, error: 'Password reset temporarily disabled' }
}
