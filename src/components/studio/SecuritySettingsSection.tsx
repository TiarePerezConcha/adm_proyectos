import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Shield, Key, Smartphone, Lock, CheckCircle2, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { UserProfileSecurity } from '../../types';
import { generateBase32Secret, generateTOTPCode, verifyTOTPCode, hashPassword } from '../../services/authCrypto';

interface SecuritySettingsSectionProps {
  security?: UserProfileSecurity;
  onUpdateSecurity: (newSecurity: UserProfileSecurity) => void;
}

export const SecuritySettingsSection: React.FC<SecuritySettingsSectionProps> = ({
  security,
  onUpdateSecurity,
}) => {
  // Perfil por defecto
  const currentSec: UserProfileSecurity = security || {
    email: 'tiare.perezconcha@gmail.com',
    hasCustomPassword: false,
    masterPin: localStorage.getItem('lsc_master_pin') || '2026',
    twoFactorEnabled: localStorage.getItem('lsc_2fa_enabled') === 'true',
    twoFactorSecret: localStorage.getItem('lsc_2fa_secret') || '',
    backupCodes: JSON.parse(localStorage.getItem('lsc_2fa_backups') || '["LSC-9821-X9", "LSC-4412-Z3", "LSC-8831-M4"]'),
  };

  // Estados de cambio de contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [masterPin, setMasterPin] = useState(currentSec.masterPin || '2026');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    const otpauthUrl = `otpauth://totp/LSC%20Proyectos:tiare.perezconcha@gmail.com?secret=${secret}&issuer=LSC%20Proyectos`;
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

  const copySecret = () => {
    navigator.clipboard.writeText(tempSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm text-xs">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Gestión de Perfil y Seguridad de Acceso</h3>
            <p className="text-[11px] text-slate-500">
              Personaliza tu contraseña maestra y activa la Verificación en 2 Pasos (Google Authenticator)
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full font-mono text-[10px] font-semibold">
          tiare.perezconcha@gmail.com
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna 1: Contraseña y PIN Maestro */}
        <form onSubmit={handleSaveCredentials} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
            <Key className="w-4 h-4 text-amber-500" />
            <span>Contraseña y PIN Maestro</span>
          </div>

          {passMsg && (
            <div className={`p-2.5 rounded-lg flex items-center gap-2 text-[11px] ${
              passMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {passMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{passMsg.text}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">PIN de Acceso Rápido (Mínimo 4 dígitos)</label>
            <input
              type="text"
              value={masterPin}
              onChange={(e) => setMasterPin(e.target.value)}
              placeholder="2026"
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nueva Contraseña (Opcional)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-slate-900 hover:bg-black text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guardar Contraseña y PIN</span>
          </button>
        </form>

        {/* Columna 2: Verificación de Dos Factores (Google Authenticator) */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                <Smartphone className="w-4 h-4 text-indigo-500" />
                <span>Google Authenticator (2FA)</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                is2FAEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {is2FAEnabled ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
              Protege el acceso exigiendo un código dinámico de 6 dígitos generado por tu teléfono móvil cada vez que inicies sesión.
            </p>

            {twoFaMsg && (
              <div className={`p-2.5 mb-3 rounded-lg flex items-center gap-2 text-[11px] ${
                twoFaMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {twoFaMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{twoFaMsg.text}</span>
              </div>
            )}

            {!is2FAEnabled && !setupMode && (
              <button
                type="button"
                onClick={handleStartSetup2FA}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Configurar Google Authenticator</span>
              </button>
            )}

            {setupMode && (
              <div className="space-y-3 bg-white p-3 rounded-lg border border-indigo-200">
                <div className="text-center">
                  <p className="font-semibold text-slate-700 mb-2">1. Escanea este código QR con Google Authenticator:</p>
                  {qrCodeDataUrl && (
                    <img src={qrCodeDataUrl} alt="QR 2FA" className="w-36 h-36 mx-auto border border-slate-200 rounded-lg p-1" />
                  )}
                </div>

                <div className="pt-1">
                  <p className="text-[10px] text-slate-500 mb-1">O ingresa esta clave manualmente:</p>
                  <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded font-mono text-[11px] justify-between">
                    <span className="font-bold text-slate-800">{tempSecret}</span>
                    <button type="button" onClick={copySecret} className="text-indigo-600 hover:text-indigo-800">
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="font-semibold text-slate-700 mb-1">2. Ingresa el código de 6 dígitos que muestra tu app:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="123456"
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-center text-sm tracking-widest font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleConfirm2FA}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Verificar
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSetupMode(false)}
                  className="w-full text-center text-[10px] text-slate-400 hover:underline pt-1"
                >
                  Cancelar
                </button>
              </div>
            )}

            {is2FAEnabled && (
              <div className="space-y-3 bg-white p-3 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tu cuenta está blindada con Doble Factor</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Cada vez que inicies sesión se te solicitará el código de 6 dígitos generado por tu aplicación móvil.
                </p>
                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-semibold text-slate-700 block mb-1">Códigos de Recuperación de Emergencia:</span>
                  <div className="font-mono text-[10px] text-slate-600 space-y-0.5">
                    {currentSec.backupCodes.map((code, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{code}</span>
                        <span className="text-slate-400">Emergencia {idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  className="w-full py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded text-xs font-semibold transition-colors"
                >
                  Desactivar 2FA
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
