import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Shield,
  Key,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  Users,
  Plus,
  Trash2,
  Mail
} from 'lucide-react';
import { UserProfileSecurity } from '../../types';
import { generateBase32Secret, generateTOTPCode, verifyTOTPCode, hashPassword } from '../../services/authCrypto';
import { getAuthorizedEmails, saveAuthorizedEmails, ALLOWED_EMAIL } from '../../services/supabaseClient';

interface SecuritySettingsSectionProps {
  security?: UserProfileSecurity;
  onUpdateSecurity: (newSecurity: UserProfileSecurity) => void;
}

export const SecuritySettingsSection: React.FC<SecuritySettingsSectionProps> = ({
  security,
  onUpdateSecurity,
}) => {
  // Detectar el correo de la sesión actualmente activa en LoginGuard
  const activeUserEmail =
    sessionStorage.getItem('lsc_authenticated_user') ||
    security?.email ||
    'tiare.carrera.2014@gmail.com';

  // Perfil por defecto
  const currentSec: UserProfileSecurity = security || {
    email: activeUserEmail,
    hasCustomPassword: false,
    masterPin: localStorage.getItem('lsc_master_pin') || '2026',
    twoFactorEnabled: localStorage.getItem('lsc_2fa_enabled') === 'true',
    twoFactorSecret: localStorage.getItem('lsc_2fa_secret') || '',
    backupCodes: JSON.parse(localStorage.getItem('lsc_2fa_backups') || '["LSC-9821-X9", "LSC-4412-Z3", "LSC-8831-M4"]'),
  };

  // Estados de cambio de contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [masterPin, setMasterPin] = useState(currentSec.masterPin || '2026');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de lista de correos autorizados (Whitelist)
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>(() => getAuthorizedEmails());
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de 2FA / Google Authenticator
  const [is2FAEnabled, setIs2FAEnabled] = useState(currentSec.twoFactorEnabled);
  const [setupMode, setSetupMode] = useState(false);
  const [tempSecret, setTempSecret] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [twoFaMsg, setTwoFaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Iniciar configuración de 2FA
  const handleStartSetup2FA = async () => {
    const secret = generateBase32Secret(16);
    setTempSecret(secret);
    const otpauthUrl = `otpauth://totp/LSC%20Proyectos:${encodeURIComponent(activeUserEmail)}?secret=${secret}&issuer=LSC%20Proyectos`;
    try {
      const qrUrl = await QRCode.toDataURL(otpauthUrl, { width: 200, margin: 1 });
      setQrCodeDataUrl(qrUrl);
      setSetupMode(true);
      setTwoFaMsg(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Confirmar y activar 2FA
  const handleConfirm2FA = async () => {
    if (!verifyCode || verifyCode.length < 6) {
      setTwoFaMsg({ type: 'error', text: 'Ingresa el código de 6 dígitos de tu aplicación.' });
      return;
    }
    const isValid = await verifyTOTPCode(tempSecret, verifyCode);
    if (isValid) {
      const updated: UserProfileSecurity = {
        ...currentSec,
        twoFactorEnabled: true,
        twoFactorSecret: tempSecret,
      };
      localStorage.setItem('lsc_2fa_enabled', 'true');
      localStorage.setItem('lsc_2fa_secret', tempSecret);
      localStorage.setItem('lsc_2fa_backups', JSON.stringify(updated.backupCodes));
      onUpdateSecurity(updated);
      setIs2FAEnabled(true);
      setSetupMode(false);
      setTwoFaMsg({ type: 'success', text: '¡Doble Factor (2FA) activado exitosamente!' });
      setTimeout(() => setTwoFaMsg(null), 4000);
    } else {
      setTwoFaMsg({ type: 'error', text: 'Código incorrecto o expirado. Asegúrate de que la hora de tu teléfono esté sincronizada.' });
    }
  };

  // Desactivar 2FA
  const handleDisable2FA = () => {
    if (confirm('¿Segura que deseas desactivar la verificación en dos pasos (2FA)?')) {
      const updated: UserProfileSecurity = {
        ...currentSec,
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
      };
      localStorage.removeItem('lsc_2fa_enabled');
      localStorage.removeItem('lsc_2fa_secret');
      onUpdateSecurity(updated);
      setIs2FAEnabled(false);
      setSetupMode(false);
      setTwoFaMsg({ type: 'success', text: '2FA ha sido desactivado.' });
      setTimeout(() => setTwoFaMsg(null), 3000);
    }
  };

  // Guardar Contraseña y PIN
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    let passwordHash = currentSec.passwordHash;
    let hasCustom = currentSec.hasCustomPassword;

    if (newPassword) {
      if (newPassword.length < 6) {
        setPassMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setPassMsg({ type: 'error', text: 'Las contraseñas no coinciden.' });
        return;
      }
      passwordHash = await hashPassword(newPassword);
      hasCustom = true;
      localStorage.setItem('lsc_password_hash', passwordHash);
    }

    if (masterPin && masterPin.length >= 4) {
      localStorage.setItem('lsc_master_pin', masterPin);
    }

    const updated: UserProfileSecurity = {
      ...currentSec,
      passwordHash,
      hasCustomPassword: hasCustom,
      masterPin: masterPin || '2026',
    };
    onUpdateSecurity(updated);
    setNewPassword('');
    setConfirmPassword('');
    setPassMsg({ type: 'success', text: '¡Credenciales de seguridad actualizadas con éxito!' });
    setTimeout(() => setPassMsg(null), 3500);
  };

  // Handlers para Lista de Correos Autorizados
  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    const clean = newEmailInput.trim().toLowerCase();
    if (!clean || !clean.includes('@') || !clean.includes('.')) {
      setEmailMsg({ type: 'error', text: 'Por favor ingresa un correo electrónico válido.' });
      return;
    }
    if (authorizedEmails.map((e) => e.toLowerCase()).includes(clean)) {
      setEmailMsg({ type: 'error', text: 'Este correo ya figura en la lista autorizada.' });
      return;
    }
    const updated = saveAuthorizedEmails([...authorizedEmails, clean]);
    setAuthorizedEmails(updated);
    setNewEmailInput('');
    setEmailMsg({ type: 'success', text: `Correo "${clean}" autorizado para iniciar sesión exitosamente.` });
    setTimeout(() => setEmailMsg(null), 3500);
  };

  const handleRemoveEmail = (targetEmail: string) => {
    if (targetEmail.toLowerCase() === ALLOWED_EMAIL.toLowerCase()) {
      setEmailMsg({ type: 'error', text: 'No es posible revocar el acceso del correo propietario principal.' });
      return;
    }
    if (confirm(`¿Segura que deseas revocar el acceso para "${targetEmail}"?`)) {
      const filtered = authorizedEmails.filter((e) => e.toLowerCase() !== targetEmail.toLowerCase());
      const updated = saveAuthorizedEmails(filtered);
      setAuthorizedEmails(updated);
      setEmailMsg({ type: 'success', text: `Acceso revocado para "${targetEmail}".` });
      setTimeout(() => setEmailMsg(null), 3500);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(tempSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="bg-[#12151C] border border-[#202634] rounded-2xl p-6 space-y-6 shadow-xl text-xs text-slate-200 font-sans">
      <div className="border-b border-[#202634] pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Gestión de Perfil y Seguridad de Acceso</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Personaliza tu contraseña maestra y activa la Verificación en 2 Pasos (Google Authenticator)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">Sesión Activa:</span>
          <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full font-mono text-[10px] font-semibold flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {activeUserEmail}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna 1: Contraseña y PIN Maestro */}
        <form onSubmit={handleSaveCredentials} className="space-y-4 bg-[#0A0C10] p-4 rounded-xl border border-[#1E232F]">
          <div className="flex items-center gap-2 font-bold text-white font-mono text-xs">
            <Key className="w-4 h-4 text-amber-400" />
            <span>Contraseña y PIN Maestro</span>
          </div>

          {passMsg && (
            <div className={`p-2.5 rounded-lg flex items-center gap-2 text-[11px] font-mono ${
              passMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'
            }`}>
              {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
              <span>{passMsg.text}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">PIN de Acceso Rápido (Mínimo 4 dígitos)</label>
            <input
              type="text"
              value={masterPin}
              onChange={(e) => setMasterPin(e.target.value)}
              placeholder="2026"
              className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">Nueva Contraseña (Opcional)</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 pr-9 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                title={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showNewPassword ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">Confirmar Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 pr-9 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-semibold rounded-lg transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-white" />
            <span>Guardar Contraseña y PIN</span>
          </button>
        </form>

        {/* Columna 2: Verificación de Dos Factores (Google Authenticator) */}
        <div className="space-y-4 bg-[#0A0C10] p-4 rounded-xl border border-[#1E232F] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-white font-mono text-xs">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Google Authenticator (2FA)</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                is2FAEnabled ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {is2FAEnabled ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed font-mono">
              Protege el acceso exigiendo un código dinámico de 6 dígitos generado por tu teléfono móvil cada vez que inicies sesión.
            </p>

            {twoFaMsg && (
              <div className={`p-2.5 mb-3 rounded-lg flex items-center gap-2 text-[11px] font-mono ${
                twoFaMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'
              }`}>
                {twoFaMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                <span>{twoFaMsg.text}</span>
              </div>
            )}

            {!is2FAEnabled && !setupMode && (
              <button
                type="button"
                onClick={handleStartSetup2FA}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-mono font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Configurar Google Authenticator</span>
              </button>
            )}

            {setupMode && (
              <div className="space-y-3 bg-[#0E1117] p-3 rounded-lg border border-[#202634]">
                <div className="text-center">
                  <p className="font-semibold text-slate-200 mb-2 font-mono">1. Escanea este código QR con Google Authenticator:</p>
                  {qrCodeDataUrl && (
                    <div className="bg-white p-2 rounded-lg inline-block mx-auto border border-slate-700">
                      <img src={qrCodeDataUrl} alt="QR 2FA" className="w-36 h-36" />
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <p className="text-[10px] text-slate-400 mb-1 font-mono">O ingresa esta clave manualmente:</p>
                  <div className="flex items-center gap-1 bg-[#0A0C10] border border-[#202634] p-1.5 rounded font-mono text-[11px] justify-between">
                    <span className="font-bold text-emerald-400">{tempSecret}</span>
                    <button type="button" onClick={copySecret} className="text-slate-400 hover:text-white cursor-pointer">
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="font-semibold text-slate-200 mb-1 font-mono">2. Ingresa el código de 6 dígitos que muestra tu app:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="123456"
                      className="flex-1 bg-[#0A0C10] border border-[#202634] rounded-lg p-2 font-mono text-center text-sm tracking-widest font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleConfirm2FA}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold rounded-lg transition cursor-pointer shadow-md"
                    >
                      Verificar
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSetupMode(false)}
                  className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 hover:underline pt-1 cursor-pointer font-mono"
                >
                  Cancelar
                </button>
              </div>
            )}

            {is2FAEnabled && (
              <div className="space-y-3 bg-[#0E1117] p-3 rounded-lg border border-emerald-900/60">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tu cuenta está blindada con Doble Factor</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  Cada vez que inicies sesión se te solicitará el código de 6 dígitos generado por tu aplicación móvil.
                </p>
                <div className="bg-[#0A0C10] p-2.5 rounded border border-[#202634]">
                  <span className="font-semibold text-slate-300 block mb-1 font-mono text-[10px]">Códigos de Recuperación de Emergencia:</span>
                  <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                    {currentSec.backupCodes.map((code, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-emerald-400">{code}</span>
                        <span className="text-slate-600">Emergencia {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  className="w-full py-1.5 border border-rose-900/60 hover:bg-rose-950/50 text-rose-400 rounded text-xs font-mono font-semibold transition cursor-pointer"
                >
                  Desactivar 2FA
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección 3: Lista de Correos Autorizados (Whitelist de Acceso) */}
      <div className="bg-[#0A0C10] border border-[#1E232F] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202634] pb-3">
          <div className="flex items-center gap-2 font-bold text-white text-xs font-mono">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Lista de Correos Autorizados para Acceso (Whitelist)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-[#161a24] px-2 py-0.5 rounded border border-[#202634]">
            {authorizedEmails.length} cuenta{authorizedEmails.length === 1 ? '' : 's'} autorizada{authorizedEmails.length === 1 ? '' : 's'}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
          Capa de Blindaje 1: Solo los correos presentes en esta lista pueden acceder al sistema, ya sea mediante{' '}
          <strong className="text-slate-200">Google OAuth (acceso externo)</strong> o con contraseña y PIN maestro. Cualquier correo no autorizado
          será rechazado automáticamente.
        </p>

        {emailMsg && (
          <div
            className={`p-2.5 rounded-lg flex items-center gap-2 text-[11px] font-mono ${
              emailMsg.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800'
            }`}
          >
            {emailMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{emailMsg.text}</span>
          </div>
        )}

        {/* Formulario para agregar nuevo correo */}
        <form onSubmit={handleAddEmail} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="nuevo.usuario@gmail.com"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 placeholder-slate-600"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-mono font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Autorizar Correo</span>
          </button>
        </form>

        {/* Lista de Correos Registrados */}
        <div className="space-y-2 pt-1">
          {authorizedEmails.map((em, idx) => {
            const isCurrentSession = em.toLowerCase() === activeUserEmail.toLowerCase();
            const isPrimary =
              em.toLowerCase() === 'tiare.perezconcha@gmail.com' ||
              em.toLowerCase() === 'tiare.carrera.2014@gmail.com';
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-[#0E1117] border border-[#202634] rounded-lg text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Mail
                    className={`w-3.5 h-3.5 ${
                      isCurrentSession
                        ? 'text-emerald-400'
                        : isPrimary
                        ? 'text-rose-400'
                        : 'text-slate-500'
                    }`}
                  />
                  <span className="font-mono text-slate-200 font-medium">{em}</span>
                  {isCurrentSession && (
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[9px] font-bold uppercase font-mono">
                      Sesión Activa
                    </span>
                  )}
                  {isPrimary && !isCurrentSession && (
                    <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-900 rounded text-[9px] font-bold uppercase font-mono">
                      Propietario
                    </span>
                  )}
                  {!isPrimary && !isCurrentSession && (
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[9px] font-bold uppercase font-mono">
                      Autorizado
                    </span>
                  )}
                </div>

                {!isPrimary && !isCurrentSession && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(em)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition cursor-pointer"
                    title="Revocar acceso a este correo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
