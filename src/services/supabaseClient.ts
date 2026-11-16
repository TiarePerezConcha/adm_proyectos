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
export const DEFAULT_ALLOWED_EMAILS = ['tiare.perezconcha@gmail.com'];

/**
 * Obtiene la lista completa de correos autorizados (Whitelist).
 * Siempre asegura que el correo del propietario principal esté incluido.
 */
export function getAuthorizedEmails(): string[] {
  try {
    const stored = localStorage.getItem('lsc_authorized_emails');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const set = new Set(parsed.map((e) => String(e).trim().toLowerCase()));
        DEFAULT_ALLOWED_EMAILS.forEach((e) => set.add(e.toLowerCase()));
        return Array.from(set);
      }
    }
  } catch (e) {
    console.warn('Error reading authorized emails', e);
  }
  return [...DEFAULT_ALLOWED_EMAILS];
}

/**
 * Guarda y actualiza la lista de correos autorizados en localStorage.
 */
export function saveAuthorizedEmails(emails: string[]): string[] {
  const set = new Set(emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean));
  DEFAULT_ALLOWED_EMAILS.forEach((e) => set.add(e.toLowerCase()));
  const finalList = Array.from(set);
  localStorage.setItem('lsc_authorized_emails', JSON.stringify(finalList));
  return finalList;
}

/**
 * Comprueba si un correo específico tiene autorización para ingresar al sistema.
 */
export function isEmailAuthorized(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  const list = getAuthorizedEmails();
  return list.includes(clean);
}

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
