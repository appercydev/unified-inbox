import { createClient } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClient> | null = null
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseApiKey = process.env.SUPABASE_API_KEY

    if (!supabaseUrl || !supabaseApiKey) {
      throw new Error('SUPABASE_URL and SUPABASE_API_KEY are required')
    }

    supabaseClient = createClient(supabaseUrl, supabaseApiKey)
  }
  return supabaseClient
}

export const getSupabaseAdminClient = () => {
  if (!supabaseAdminClient) {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    }

    supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseAdminClient
}

// For backward compatibility
export const supabase = getSupabaseClient()
export const supabaseAdmin = getSupabaseAdminClient()
