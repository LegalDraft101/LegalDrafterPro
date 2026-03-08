import { createClient } from '@supabase/supabase-js';
import { env } from '../config';

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ Supabase URL or Service Role Key is missing. Database operations will fail.');
}

// Ensure you use the Service Role Key for backend administrative tasks (bypasses RLS)
// If you want to use Row Level Security per user request, you would need to pass user JWTs instead.
export const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
