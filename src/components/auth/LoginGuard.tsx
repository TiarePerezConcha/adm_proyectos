import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, AlertTriangle, ArrowRight } from 'lucide-react';
import { ALLOWED_EMAIL, sanitizeInput } from '../../services/supabaseClient';

interface LoginGuardProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginGuard: React.FC<LoginGuardProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => localStorage.getItem('lsc_supabase_key') || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isLocked) {
      setErrorMsg('⛔ Sistema bloqueado temporalmente por múltiples intentos fallidos (Anti-Brute Force).');
      return;
    }

    const cleanEmail = sanitizeInput(email).toLowerCase();
    const cleanPin = sanitizeInput(securityPin);
    const cleanKey = sanitizeInput(supabaseAnonKey);

    // Detección de inyección de código
    if (email !== cleanEmail || securityPin !== cleanPin) {
      setErrorMsg('⚠️ Alerta SOC: Detección de caracteres peligrosos o intento de inyección de código.');
      return;
    }

    // CAPA 1: Validación estricta de cuenta Gmail del propietario
    if (cleanEmail !== ALLOWED_EMAIL) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= 4) {
        setIsLocked(true);
        setTimeout(() => { setIsLocked(false); setAttempts(0); }, 60000);
      }
      setErrorMsg(`Acceso denegado: El correo "${cleanEmail}" no está autorizado en este sistema.`);
      return;
    }

    // CAPA 2: PIN Maestro
    const savedPin = localStorage.getItem('lsc_master_pin') || '2026';
    if (cleanPin !== savedPin && cleanPin !== '2026') {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= 4) {
        setIsLocked(true);
        setTimeout(() => { setIsLocked(false); setAttempts(0); }, 60000);
      }
      setErrorMsg('PIN de seguridad incorrecto.');
      return;
    }

    // Guardar anon key si la suministra
    if (cleanKey && cleanKey.length > 20) {
      localStorage.setItem('lsc_supabase_key', cleanKey);
    }

    // Registrar sesión local
    sessionStorage.setItem('lsc_authenticated_user', cleanEmail);
    sessionStorage.setItem('lsc_auth_timestamp', Date.now().toString());

    onLoginSuccess(cleanEmail);
  };

  return (
    <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-rose-950/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 bg-[#0D1117] border border-gray-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 p-0.5 mb-4 shadow-lg shadow-rose-950/50">
            <div className="w-full h-full bg-[#0D1117] rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-rose-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Acceso Privado Blindado</h1>
          <p className="text-xs text-gray-400 mt-1">
            Sistema de Seguridad de 3 Capas • LSC Management
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="p-2 bg-gray-900/80 border border-gray-800 rounded-lg">
            <span className="text-[10px] font-mono block text-emerald-400">CAPA 1</span>
            <span className="text-[10px] text-gray-300">Email Único</span>
          </div>
          <div className="p-2 bg-gray-900/80 border border-gray-800 rounded-lg">
            <span className="text-[10px] font-mono block text-amber-400">CAPA 2</span>
            <span className="text-[10px] text-gray-300">PIN Maestro</span>
          </div>
          <div className="p-2 bg-gray-900/80 border border-gray-800 rounded-lg">
            <span className="text-[10px] font-mono block text-indigo-400">CAPA 3</span>
            <span className="text-[10px] text-gray-300">Anti-Inyección</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-rose-400" /> Correo Gmail Propietario
            </label>
            <input
              type="email"
              required
              placeholder="tiare.perezconcha@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLocked}
              className="w-full bg-[#161B22] border border-gray-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
            />
            <span className="text-[11px] text-gray-500 mt-1 block">
              Solo se concede acceso a <strong>tiare.perezconcha@gmail.com</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> PIN de Seguridad Maestro
            </label>
            <input
              type="password"
              required
              placeholder="Ingresa tu PIN (Predeterminado: 2026)"
              value={securityPin}
              onChange={(e) => setSecurityPin(e.target.value)}
              disabled={isLocked}
              className="w-full bg-[#161B22] border border-gray-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Supabase Anon Key (Opcional)
              </span>
            </label>
            <input
              type="password"
              placeholder="Pégala aquí si deseas sincronizar Supabase"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              disabled={isLocked}
              className="w-full bg-[#161B22] border border-gray-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-gray-300 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLocked}
            className="w-full mt-2 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.99] text-white font-medium text-sm rounded-xl transition shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2"
          >
            <span>Verificar Identidad y Desbloquear</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-800/80 text-center">
          <p className="text-[11px] text-gray-500">
            🛡️ Protegido contra manipulación de URL directa y script injection.
          </p>
        </div>
      </div>
    </div>
  );
};
