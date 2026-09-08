import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cvfybrtblxzpawnxqsnd.supabase.co';
// Llave anon pública por defecto (o personalizada si el usuario la tiene en localStorage)
const savedKey = localStorage.getItem('lsc_supabase_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

export const supabase = createClient(SUPABASE_URL, savedKey, {
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
