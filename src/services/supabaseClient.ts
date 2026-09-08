import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://cvfybrtblxzpawnxqsnd.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_FaHiwWE7FIHP5-Xr7F6UQg_bJYFphXb';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const ALLOWED_EMAIL = 'tiare.perezconcha@gmail.com';

/**
 * Capa 3: Sanitización y prevención contra inyección de código (XSS / SQLi / Script Tags)
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/eval\s*\(/gi, '')
    .trim();
}
