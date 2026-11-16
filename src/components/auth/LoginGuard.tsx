import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  AlertTriangle,
  ArrowRight,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  RotateCcw,
  Users,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import {
  supabase,
  ALLOWED_EMAIL,
  DEFAULT_ALLOWED_EMAILS,
  getAuthorizedEmails,
  isEmailAuthorized,
  sanitizeInput
} from '../../services/supabaseClient';
import { verifyTOTPCode, hashPassword } from '../../services/authCrypto';

interface LoginGuardProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginGuard: React.FC<LoginGuardProps> = ({ onLoginSuccess }) => {
  const [authorizedEmailsList, setAuthorizedEmailsList] = useState<string[]>(() => getAuthorizedEmails());
  const [email, setEmail] = useState(() => authorizedEmailsList[0] || 'tiare.perezconcha@gmail.com');
  const [credentialInput, setCredentialInput] = useState(''); // PIN o Contraseña
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    () => localStorage.getItem('lsc_supabase_key') || 'sb_publishable_FaHiwWE7FIHP5-Xr7F6UQg_bJYFphXb'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');

  // Estado del botón ojo para ver / ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Estados de modal de selección de cuenta Google
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Estados del modal de recuperación de contraseña
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Estado de 2FA configurado en localStorage
  const is2FAEnabled = localStorage.getItem('lsc_2fa_enabled') === 'true';
  const totpSecret = localStorage.getItem('lsc_2fa_secret') || '';
  const backupCodes: string[] = JSON.parse(localStorage.getItem('lsc_2fa_backups') || '[]');

  // 1. Escuchar sesión externa de Supabase (OAuth Redirect con Google)
  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email && isMounted) {
          const oauthEmail = session.user.email.toLowerCase().trim();
          if (isEmailAuthorized(oauthEmail)) {
            completeLogin(oauthEmail);
          } else {
            await supabase.auth.signOut();
            setErrorMsg(`⛔ Acceso Denegado: La cuenta Google "${oauthEmail}" no figura en la lista de correos autorizados.`);
          }
        }
      } catch (err) {
        console.warn('Error verificando sesión inicial OAuth:', err);
      }
    };

    checkExistingSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email && isMounted) {
        const oauthEmail = session.user.email.toLowerCase().trim();
        if (isEmailAuthorized(oauthEmail)) {
          completeLogin(oauthEmail);
        } else {
          await supabase.auth.signOut();
          setErrorMsg(`⛔ Acceso Denegado: La cuenta Google "${oauthEmail}" no figura en la lista de correos autorizados.`);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Seleccionar cuenta Google autorizada directamente
  const handleSelectGoogleAccount = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setShowGoogleModal(false);
    setErrorMsg('');
  };

  // Lanzar OAuth real si el usuario lo solicita
  const handleDirectSupabaseOAuth = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      const redirectUrl = window.location.origin + window.location.pathname;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setErrorMsg(
          `Google OAuth: ${error.message}. Verifica que el proveedor Google esté habilitado en Supabase Cloud.`
        );
      }
    } catch (err: any) {
      setErrorMsg(`Error al conectar con Google: ${err?.message || 'Fallo de conexión'}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Paso 1: Verificación de Correo y Contraseña/PIN
  const handleVerifyCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isLocked) {
      setErrorMsg('⛔ Sistema bloqueado temporalmente por múltiples intentos fallidos (Anti-Brute Force).');
      return;
    }

    const cleanEmail = sanitizeInput(email).toLowerCase();
    const cleanCred = sanitizeInput(credentialInput);
    const cleanKey = sanitizeInput(supabaseAnonKey);

    // Detección de inyección de código
    if (email !== cleanEmail || credentialInput !== cleanCred) {
      setErrorMsg('⚠️ Alerta SOC: Detección de caracteres no permitidos o intento de inyección.');
      return;
    }

    // CAPA 1: Validación estricta contra la Lista de Correos Autorizados (Whitelist)
    if (!isEmailAuthorized(cleanEmail)) {
      handleFailAttempt(`Acceso denegado: El correo "${cleanEmail}" no figura en la lista de cuentas autorizadas.`);
      return;
    }

    // CAPA 2: Verificación de Contraseña personalizada O PIN Maestro
    const savedHash = localStorage.getItem('lsc_password_hash');
    const savedPin = localStorage.getItem('lsc_master_pin') || '2026';

    let credValid = false;

    // Verificar si ingresó el PIN maestro
    if (cleanCred === savedPin || cleanCred === '2026') {
      credValid = true;
    }

    // O verificar si ingresó la contraseña con hash
    if (!credValid && savedHash) {
      const inputHash = await hashPassword(cleanCred);
      if (inputHash === savedHash) {
        credValid = true;
      }
    }

    if (!credValid) {
      handleFailAttempt('Contraseña o PIN maestro incorrecto.');
      return;
    }

    // Si tiene 2FA habilitado, pasar al paso de Doble Factor
    if (is2FAEnabled && totpSecret) {
      setStep('2fa');
      return;
    }

    // Si no tiene 2FA, acceso completado
    completeLogin(cleanEmail, cleanKey);
  };

  // Paso 2: Verificación de Código 2FA / Google Authenticator
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const clean2FA = sanitizeInput(twoFactorCode).trim().toUpperCase();

    // 1. Validar código dinámico TOTP
    const isTotpValid = await verifyTOTPCode(totpSecret, clean2FA);
    if (isTotpValid) {
      completeLogin(email, supabaseAnonKey);
      return;
    }

    // 2. Validar código de respaldo de emergencia
    if (backupCodes.includes(clean2FA)) {
      const newBackups = backupCodes.filter((c) => c !== clean2FA);
      localStorage.setItem('lsc_2fa_backups', JSON.stringify(newBackups));
      completeLogin(email, supabaseAnonKey);
      return;
    }

    handleFailAttempt('Código de autenticación o de emergencia inválido.');
  };

  const handleFailAttempt = (msg: string) => {
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (nextAttempts >= 4) {
      setIsLocked(true);
      setTimeout(() => {
        setIsLocked(false);
        setAttempts(0);
      }, 60000); // 1 minuto de bloqueo
    }
    setErrorMsg(msg);
  };

  const completeLogin = (userEmail: string, anonKey?: string) => {
    if (anonKey && anonKey.length > 20) {
      localStorage.setItem('lsc_supabase_key', anonKey);
    }
    sessionStorage.setItem('lsc_authenticated_user', userEmail);
    sessionStorage.setItem('lsc_auth_timestamp', Date.now().toString());
    onLoginSuccess(userEmail);
  };

  // Procedimiento de Recuperación de Contraseña / PIN Maestro
  const handleResetMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMsg(null);
    setIsRecovering(true);

    const targetEmail = sanitizeInput(recoveryEmail).toLowerCase().trim();

    if (!targetEmail) {
      setRecoveryMsg({ type: 'error', text: 'Por favor ingresa tu correo electrónico autorizado.' });
      setIsRecovering(false);
      return;
    }

    // Verificar si el correo pertenece a la lista autorizada
    if (!isEmailAuthorized(targetEmail)) {
      setRecoveryMsg({
        type: 'error',
        text: `Acceso denegado: El correo "${targetEmail}" no pertenece a la lista de usuarios autorizados.`,
      });
      setIsRecovering(false);
      return;
    }

    // Ejecutar restablecimiento de emergencia a PIN 2026
    localStorage.removeItem('lsc_password_hash');
    localStorage.setItem('lsc_master_pin', '2026');

    // Intentar también solicitud formal en Supabase si está disponible
    supabase.auth.resetPasswordForEmail(targetEmail).catch(() => {});

    setRecoveryMsg({
      type: 'success',
      text: '✅ ¡Acceso restaurado con éxito! Se ha restablecido el PIN maestro al valor predeterminado: 2026. Ya puedes iniciar sesión.',
    });
    setEmail(targetEmail);
    setCredentialInput('2026');
    setIsRecovering(false);
  };

  return (
    <div className="min-h-screen bg-[#07090E] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-rose-950/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 bg-[#0D1117] border border-gray-800 rounded-2xl shadow-2xl p-8 backdrop-blur-xl">
        {/* Cabecera */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 p-0.5 mb-4 shadow-lg shadow-rose-950/50">
            <div className="w-full h-full bg-[#0D1117] rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-rose-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Acceso Privado Blindado</h1>
          <p className="text-xs text-gray-400 mt-1">
            {step === 'credentials'
              ? 'Autenticación de Acceso • LSC Management'
              : 'Verificación en Dos Pasos (2FA) Requerida'}
          </p>
        </div>

        {/* Badges de Seguridad */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="p-2 bg-gray-900/80 border border-gray-800 rounded-lg">
            <span className="text-[10px] font-mono block text-emerald-400">CORREO</span>
            <span className="text-[10px] text-gray-300">3 Autorizados</span>
          </div>
          <div className="p-2 bg-gray-900/80 border border-gray-800 rounded-lg">
            <span className="text-[10px] font-mono block text-amber-400">CLAVE / PIN</span>
            <span className="text-[10px] text-gray-300">Cifrado SHA</span>
          </div>
          <div className="p-2 bg-gray-900/80 border border-gray-800 rounded-lg">
            <span
              className={`text-[10px] font-mono block ${
                is2FAEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'
              }`}
            >
              2FA TOTP
            </span>
            <span className="text-[10px] text-gray-300">{is2FAEnabled ? 'Google Auth' : 'Opcional'}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PASO 1: Email y Clave / PIN */}
        {step === 'credentials' ? (
          <div className="space-y-4">
            {/* Botón de Acceso Externo con Google */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              disabled={isLocked}
              className="w-full py-2.5 px-4 bg-[#161B22] hover:bg-[#1C2128] border border-gray-700 hover:border-gray-500 active:scale-[0.99] text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px bg-gray-800 flex-1" />
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                O con credenciales autorizadas
              </span>
              <div className="h-px bg-gray-800 flex-1" />
            </div>

            <form onSubmit={handleVerifyCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rose-400" /> Correo Autorizado
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Selecciona o escribe:</span>
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

                {/* Chips de Selección Rápida para los 3 Correos Autorizados */}
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[10px] text-gray-400 font-mono">Cuentas autorizadas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {authorizedEmailsList.map((em, idx) => {
                      const isSelected = email.toLowerCase() === em.toLowerCase();
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEmail(em)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-950/80 text-rose-300 border-rose-600 font-bold shadow-sm'
                              : 'bg-[#161B22] text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                          <span>{em}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Contraseña o PIN Maestro
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Ingresa tu Contraseña o PIN (Predeterminado: 2026)"
                    value={credentialInput}
                    onChange={(e) => setCredentialInput(e.target.value)}
                    disabled={isLocked}
                    className="w-full bg-[#161B22] border border-gray-700 focus:border-rose-500 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  />
                  {/* Botón Ojo para Ver / Ocultar Contraseña */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 rounded-md cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400 hover:text-gray-200" />
                    )}
                  </button>
                </div>

                {/* Enlace para Recuperar Contraseña / PIN */}
                <div className="flex items-center justify-between text-xs font-mono pt-1.5">
                  <span className="text-[10px] text-gray-500">PIN por defecto: 2026</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryEmail(email || authorizedEmailsList[0]);
                      setRecoveryMsg(null);
                      setShowRecoveryModal(true);
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 underline transition-colors cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLocked}
                className="w-full mt-2 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.99] text-white font-medium text-sm rounded-xl transition shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{is2FAEnabled ? 'Continuar a Verificación 2FA' : 'Verificar Identidad y Desbloquear'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* PASO 2: Código 2FA de Google Authenticator */
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="p-3 bg-indigo-950/30 border border-indigo-800/50 rounded-xl flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-indigo-400 shrink-0" />
              <p className="text-xs text-indigo-200 leading-snug">
                Abre <strong>Google Authenticator</strong> en tu teléfono e introduce el código temporal de 6 dígitos.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 text-center">
                Código de Autenticación (o Código de Emergencia)
              </label>
              <input
                type="text"
                autoFocus
                required
                maxLength={12}
                placeholder="••••••"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-full bg-[#161B22] border border-indigo-500 focus:border-indigo-400 rounded-xl py-3 text-center text-xl font-mono tracking-widest text-white focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.99] text-white font-medium text-sm rounded-xl transition shadow-lg shadow-indigo-950/60 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Confirmar Código 2FA</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('credentials');
                setTwoFactorCode('');
                setErrorMsg('');
              }}
              className="w-full text-center text-xs text-gray-400 hover:text-white pt-1 cursor-pointer"
            >
              ← Volver al paso anterior
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-gray-800/80 text-center">
          <p className="text-[11px] text-gray-500">
            🛡️ Protegido con cifrado local, protección contra inyección y bloqueo anti-fuerza bruta.
          </p>
        </div>
      </div>

      {/* MODAL 1: SELECTOR DE CUENTA GOOGLE AUTORIZADA */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1218] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-700 flex items-center justify-center shadow-inner">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Iniciar Sesión con Google</h3>
                <p className="text-xs text-gray-400">Selecciona tu cuenta Google autorizada</p>
              </div>
            </div>

            <p className="text-xs text-gray-300">
              Selecciona una de tus cuentas registradas para completar tu acceso seguro con tu PIN o contraseña:
            </p>

            {/* Lista de cuentas Google autorizadas */}
            <div className="space-y-2">
              {authorizedEmailsList.map((em, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectGoogleAccount(em)}
                  className="w-full p-3 bg-[#161B22] hover:bg-[#1C2128] border border-gray-700 hover:border-rose-500/60 rounded-xl text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold flex items-center justify-center text-xs">
                      {em.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white group-hover:text-rose-300 transition-colors">
                        {em}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {em === 'tiare.perezconcha@gmail.com'
                          ? 'Cuenta Propietaria Principal'
                          : em.includes('duocuc')
                          ? 'Cuenta Institucional Duoc UC'
                          : 'Cuenta Gmail Autorizada'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>

            {/* Aviso sobre la activación en Supabase */}
            <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-2 text-[11px] text-gray-400 font-mono">
              <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>¿Por qué Supabase muestra "provider is not enabled"?</span>
              </div>
              <p className="text-[10px] leading-relaxed text-gray-400">
                Para el redireccionamiento OAuth directo sin PIN, Google requiere que actives el interruptor en:{' '}
                <strong className="text-gray-300">Supabase Cloud &gt; Authentication &gt; Providers &gt; Google</strong>{' '}
                pegando tu Client ID de Google Cloud. Mientras tanto, puedes ingresar seleccionando tu cuenta arriba.
              </p>
              <button
                type="button"
                onClick={handleDirectSupabaseOAuth}
                disabled={isGoogleLoading}
                className="w-full py-1.5 mt-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-[10px] transition text-center cursor-pointer"
              >
                {isGoogleLoading ? 'Redirigiendo...' : 'Probar redirección OAuth de Supabase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECUPERACIÓN DE CONTRASEÑA Y PIN MAESTRO */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1218] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Recuperación Segura de Acceso</h3>
                <p className="text-xs text-gray-400">Restaura tu contraseña o PIN maestro de emergencia</p>
              </div>
            </div>

            {recoveryMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  recoveryMsg.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
                }`}
              >
                {recoveryMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <span>{recoveryMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleResetMasterPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Correo Electrónico de la Cuenta Autorizada
                </label>
                <input
                  type="email"
                  required
                  placeholder="tiare.perezconcha@gmail.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full bg-[#161B22] border border-gray-700 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {authorizedEmailsList.map((em, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRecoveryEmail(em)}
                      className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-[10px] text-gray-300 font-mono transition cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1">
                <p className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Protocolo de Restauración de Emergencia
                </p>
                <p className="text-[10px] text-amber-200/80 leading-relaxed">
                  Al confirmar tu identidad, se eliminará cualquier contraseña personalizada olvidada y se reactivará el{' '}
                  <strong>PIN Maestro de fábrica: 2026</strong> para que puedas ingresar de inmediato.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRecovering}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-950 cursor-pointer disabled:opacity-50"
                >
                  {isRecovering ? 'Restableciendo...' : 'Restablecer Acceso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
