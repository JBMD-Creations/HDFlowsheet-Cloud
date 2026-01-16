import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Verify JWT token from Authorization header and return user info
 * @param {Request} req - The request object
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
export async function verifyAuth(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');

  if (!supabaseUrl || !supabaseServiceKey) {
    return { user: null, error: 'Server configuration error' };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Verify the JWT and get user info
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid token' };
    }

    return { user, error: null };
  } catch (err) {
    return { user: null, error: 'Token verification failed' };
  }
}

/**
 * Get Supabase client with user's auth context
 * This client respects RLS policies
 * @param {string} token - The user's JWT token
 * @returns {SupabaseClient}
 */
export function getSupabaseClient(token) {
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || supabaseServiceKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

/**
 * Get Supabase admin client (bypasses RLS)
 * Use only for admin operations
 * @returns {SupabaseClient}
 */
export function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}
