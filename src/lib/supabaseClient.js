import { createClient } from '@supabase/supabase-js';

// Debug logging for Netlify build troubleshooting
console.log('=== SUPABASE CLIENT DEBUG ===');
console.log('Available import.meta.env:', Object.keys(import.meta.env || {}));
console.log('PUBLIC_SUPABASE_URL:', import.meta.env.PUBLIC_SUPABASE_URL ? '[SET]' : '[MISSING]');
console.log('PUBLIC_SUPABASE_ANON_KEY:', import.meta.env.PUBLIC_SUPABASE_ANON_KEY ? '[SET]' : '[MISSING]');
console.log('==============================');

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
