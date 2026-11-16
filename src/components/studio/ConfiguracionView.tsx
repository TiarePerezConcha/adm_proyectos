import React, { useState } from 'react';
import { Settings, Key, Database, Download, Upload, Check, RefreshCw, Shield, Sparkles, DollarSign, CheckCircle2, Globe, Clock, Server, ExternalLink } from 'lucide-react';
import { AppState, saveAppState, exportAppStateToJSON, importAppStateFromJSON } from '../../utils/storage';
import { AppSettings, UserProfileSecurity } from '../../types';
import { SecuritySettingsSection } from './SecuritySettingsSection';
import { supabase } from '../../services/supabaseClient';

interface ConfiguracionViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({ state, onUpdateState }) => {
  const [settings, setSettings] = useState<AppSettings>(state.settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pingingSupabase, setPingingSupabase] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [providerTestResults, setProviderTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleTestProvider = async (provider: 'gemini' | 'groq' | 'sambanova' | 'github' | 'openrouter' | 'openai' | 'deepseek') => {
    let key = '';
    let testFn: () => Promise<{ ok: boolean; modelName: string; latency: number; errorMsg?: string }>;

    if (provider === 'gemini') {
      key = settings.geminiApiKey?.trim() || '';
      testFn = async () => {
        const t0 = performance.now();
        // Probamos con gemini-1.5-flash o gemini-2.0-flash en v1beta
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Responde OK' }] }],
              generationConfig: { maxOutputTokens: 5 }
            })
          }
        );
        const dt = Math.round(performance.now() - t0);
        if (res.ok) return { ok: true, modelName: 'Gemini 1.5 Flash', latency: dt };
        const data = await res.json().catch(() => ({}));
        return { ok: false, modelName: 'Gemini', latency: dt, errorMsg: data?.error?.message || `Error ${res.status}` };
      };
    } else if (provider === 'groq') {
      key = settings.groqApiKey?.trim() || '';
      testFn = async () => {
        const t0 = performance.now();
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'OK' }], max_tokens: 5 })
        });
        const dt = Math.round(performance.now() - t0);
        if (res.ok) return { ok: true, modelName: 'Llama 3.3 70B (Groq)', latency: dt };
        const data = await res.json().catch(() => ({}));
        return { ok: false, modelName: 'Groq', latency: dt, errorMsg: data?.error?.message || `Error ${res.status}` };
      };
    } else if (provider === 'sambanova') {
      key = settings.sambanovaApiKey?.trim() || '';
      testFn = async () => {
        const t0 = performance.now();
        const res = await fetch('https://api.sambanova.ai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'Meta-Llama-3.1-8B-Instruct', messages: [{ role: 'user', content: 'OK' }], max_tokens: 5 })
        });
        const dt = Math.round(performance.now() - t0);
        if (res.ok) return { ok: true, modelName: 'Llama 3.1 8B (SambaNova)', latency: dt };
        const data = await res.json().catch(() => ({}));
        return { ok: false, modelName: 'SambaNova', latency: dt, errorMsg: data?.error?.message || `Error ${res.status}` };
      };
    } else if (provider === 'github') {
      key = settings.githubModelsApiKey?.trim() || '';
      testFn = async () => {
        const t0 = performance.now();
        const res = await fetch('https://models.inference.ai.azure.com/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'OK' }], max_tokens: 5 })
        });
        const dt = Math.round(performance.now() - t0);
        if (res.ok) return { ok: true, modelName: 'GitHub Models (gpt-4o-mini)', latency: dt };
        const data = await res.json().catch(() => ({}));
        return { ok: false, modelName: 'GitHub Models', latency: dt, errorMsg: data?.error?.message || `Error ${res.status}` };
      };
    } else if (provider === 'openrouter') {
      key = settings.openrouterApiKey?.trim() || '';
      testFn = async () => {
        const t0 = performance.now();
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'deepseek/deepseek-r1:free', messages: [{ role: 'user', content: 'OK' }], max_tokens: 5 })
        });
        const dt = Math.round(performance.now() - t0);
        if (res.ok) return { ok: true, modelName: 'OpenRouter (DeepSeek R1 Free)', latency: dt };
        const data = await res.json().catch(() => ({}));
        return { ok: false, modelName: 'OpenRouter', latency: dt, errorMsg: data?.error?.message || `Error ${res.status}` };
      };
    } else if (provider === 'openai') {
      key = settings.openaiApiKey?.trim() || '';
      testFn = async () => {
        const t0 = performance.now();
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'OK' }], max_tokens: 5 })
        });
        const dt = Math.round(performance.now() - t0);
        if (res.ok) return { ok: true, modelName: 'OpenAI (gpt-4o-mini)', latency: dt };
        const data = await res.json().catch(() => ({}));
        return { ok: false, modelName: 'OpenAI', latency: dt, errorMsg: data?.error?.message || `Error ${res.status}` };
      };
    } else {
      key = settings.deepseekApiKey?.trim() || '';
      testFn = async () => {
        const t0 = performance.now();
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'OK' }], max_tokens: 5 })
        });
        const dt = Math.round(performance.now() - t0);
        if (res.ok) return { ok: true, modelName: 'DeepSeek Chat', latency: dt };
        const data = await res.json().catch(() => ({}));
        return { ok: false, modelName: 'DeepSeek', latency: dt, errorMsg: data?.error?.message || `Error ${res.status}` };
      };
    }

    if (!key) {
      setProviderTestResults(prev => ({
        ...prev,
        [provider]: { success: false, message: 'Primero ingresa o pega tu clave para probar.' }
      }));
      return;
    }

    setTestingProvider(provider);
    try {
      const result = await testFn();
      setProviderTestResults(prev => ({
        ...prev,
        [provider]: result.ok
          ? { success: true, message: `✓ ¡Conectado! (${result.modelName} • ${result.latency}ms)` }
          : { success: false, message: `Error: ${result.errorMsg}` }
      }));
    } catch (err: any) {
      setProviderTestResults(prev => ({
        ...prev,
        [provider]: { success: false, message: `Error de red: ${err?.message || 'Fallo de conexión'}` }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const newState = {
      ...state,
      settings,
    };
    onUpdateState(newState);
    saveAppState(newState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestSupabasePing = async () => {
    setPingingSupabase(true);
    try {
      const t0 = performance.now();
      const { data, error } = await supabase.from('telemetry_logs').insert({
        project_id: 'adm-proyectos',
        event: 'heartbeat',
        url: window.location.href,
        load_time_ms: 12,
        ssl_valid: window.location.protocol === 'https:',
        message: 'Ping Keep-Alive manual ejecutado desde Estudio de Configuración'
      }).select('id');

      const elapsed = Math.round(performance.now() - t0);

      if (error) throw error;
      alert(`✅ ¡Ping Keep-Alive ejecutado con éxito en ${elapsed}ms!\nSupabase ha registrado actividad en vivo en la base de datos (Log ID: ${data?.[0]?.id || 'OK'}).`);
    } catch (err: any) {
      alert(`⚠️ Error al enviar ping a Supabase:\n${err?.message || 'Error de conexión'}`);
    } finally {
      setPingingSupabase(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importAppStateFromJSON(text);
        onUpdateState(imported);
        setSettings(imported.settings);
        alert('¡Base de datos y estado completo restaurados con éxito desde el archivo JSON!');
      } catch (err) {
        alert('Error al importar archivo JSON. Asegúrate de que es un respaldo válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-200 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202634] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 font-mono">
            <Settings className="w-6 h-6 text-emerald-400" />
            <span>Configuración, APIs & Seguridad</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Gestiona tu perfil, contraseñas maestras, autenticación 2FA, claves de Inteligencia Artificial y sincronización Supabase.
          </p>
        </div>
      </div>

      {/* Sección 1: Seguridad, Perfil y 2FA (Google Authenticator) */}
      <SecuritySettingsSection
        security={settings.userSecurity}
        onUpdateSecurity={(newSecurity) => {
          const updatedSettings = { ...settings, userSecurity: newSecurity };
          setSettings(updatedSettings);
          const newState = { ...state, settings: updatedSettings };
          onUpdateState(newState);
          saveAppState(newState);
        }}
      />

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono font-semibold flex items-center gap-2 shadow-lg">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Configuración guardada exitosamente en el almacenamiento local.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Multi-AI Engines Card */}
        <div className="bg-[#12151C] border border-[#202634] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#202634] pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm font-mono">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Conexión de Modelos de Inteligencia Artificial</span>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono px-2 py-0.5 rounded font-semibold">
              Multi-Token Balancing
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            Puedes ingresar tus claves API para DeepSeek y Google Gemini simultáneamente. El sistema conmutará automáticamente entre ellas para maximizar el uso de tokens gratuitos. Si no ingresas claves, el sistema opera con el motor heurístico local gratuito.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Google Gemini */}
            <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-[#1E232F] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200 text-xs font-mono">Google Gemini API Key</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium font-mono transition cursor-pointer"
                  title="Abrir Google AI Studio para obtener clave gratis"
                >
                  <span>Obtener clave</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={settings.geminiApiKey || ''}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                placeholder="Ingresa aquí tu clave (AQ... o AIzaSy...)"
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-mono">🔒 Solo en tu navegador</span>
                <button
                  type="button"
                  onClick={() => handleTestProvider('gemini')}
                  disabled={testingProvider === 'gemini'}
                  className="px-2.5 py-1 bg-[#161a24] hover:bg-[#1f2433] text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${testingProvider === 'gemini' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'gemini' ? 'Probando...' : '⚡ Probar Gemini'}</span>
                </button>
              </div>
              {providerTestResults['gemini'] && (
                <div className={`p-2 rounded-lg text-[10px] font-mono flex items-center justify-between ${
                  providerTestResults['gemini'].success ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                }`}>
                  <span>{providerTestResults['gemini'].message}</span>
                  <button type="button" onClick={() => { const copy = { ...providerTestResults }; delete copy['gemini']; setProviderTestResults(copy); }} className="text-slate-400 hover:text-white ml-1 cursor-pointer">✕</button>
                </div>
              )}
            </div>

            {/* 2. Groq */}
            <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-[#1E232F] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200 text-xs font-mono">Groq API Key (Llama 3.3 70B Free)</label>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium font-mono transition cursor-pointer"
                  title="Abrir consola de Groq para obtener clave gratis"
                >
                  <span>Obtener clave</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={settings.groqApiKey || ''}
                onChange={(e) => setSettings({ ...settings, groqApiKey: e.target.value })}
                placeholder="gsk_..."
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-mono">🔒 Solo en tu navegador</span>
                <button
                  type="button"
                  onClick={() => handleTestProvider('groq')}
                  disabled={testingProvider === 'groq'}
                  className="px-2.5 py-1 bg-[#161a24] hover:bg-[#1f2433] text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${testingProvider === 'groq' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'groq' ? 'Probando...' : '⚡ Probar Groq'}</span>
                </button>
              </div>
              {providerTestResults['groq'] && (
                <div className={`p-2 rounded-lg text-[10px] font-mono flex items-center justify-between ${
                  providerTestResults['groq'].success ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                }`}>
                  <span>{providerTestResults['groq'].message}</span>
                  <button type="button" onClick={() => { const copy = { ...providerTestResults }; delete copy['groq']; setProviderTestResults(copy); }} className="text-slate-400 hover:text-white ml-1 cursor-pointer">✕</button>
                </div>
              )}
            </div>

            {/* 3. SambaNova */}
            <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-[#1E232F] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200 text-xs font-mono">SambaNova API Key (Llama 3.1 70B)</label>
                <a
                  href="https://cloud.sambanova.ai/apis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium font-mono transition cursor-pointer"
                  title="Abrir consola de SambaNova para obtener clave gratis"
                >
                  <span>Obtener clave</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={settings.sambanovaApiKey || ''}
                onChange={(e) => setSettings({ ...settings, sambanovaApiKey: e.target.value })}
                placeholder="sn-..."
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-mono">🔒 Solo en tu navegador</span>
                <button
                  type="button"
                  onClick={() => handleTestProvider('sambanova')}
                  disabled={testingProvider === 'sambanova'}
                  className="px-2.5 py-1 bg-[#161a24] hover:bg-[#1f2433] text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${testingProvider === 'sambanova' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'sambanova' ? 'Probando...' : '⚡ Probar SambaNova'}</span>
                </button>
              </div>
              {providerTestResults['sambanova'] && (
                <div className={`p-2 rounded-lg text-[10px] font-mono flex items-center justify-between ${
                  providerTestResults['sambanova'].success ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                }`}>
                  <span>{providerTestResults['sambanova'].message}</span>
                  <button type="button" onClick={() => { const copy = { ...providerTestResults }; delete copy['sambanova']; setProviderTestResults(copy); }} className="text-slate-400 hover:text-white ml-1 cursor-pointer">✕</button>
                </div>
              )}
            </div>

            {/* 4. GitHub Models */}
            <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-[#1E232F] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200 text-xs font-mono">GitHub Models Token (Personal Token)</label>
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium font-mono transition cursor-pointer"
                  title="Abrir tokens de GitHub para crear clave"
                >
                  <span>Obtener clave</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={settings.githubModelsApiKey || ''}
                onChange={(e) => setSettings({ ...settings, githubModelsApiKey: e.target.value })}
                placeholder="ghp_..."
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-mono">🔒 Solo en tu navegador</span>
                <button
                  type="button"
                  onClick={() => handleTestProvider('github')}
                  disabled={testingProvider === 'github'}
                  className="px-2.5 py-1 bg-[#161a24] hover:bg-[#1f2433] text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${testingProvider === 'github' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'github' ? 'Probando...' : '⚡ Probar GitHub'}</span>
                </button>
              </div>
              {providerTestResults['github'] && (
                <div className={`p-2 rounded-lg text-[10px] font-mono flex items-center justify-between ${
                  providerTestResults['github'].success ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                }`}>
                  <span>{providerTestResults['github'].message}</span>
                  <button type="button" onClick={() => { const copy = { ...providerTestResults }; delete copy['github']; setProviderTestResults(copy); }} className="text-slate-400 hover:text-white ml-1 cursor-pointer">✕</button>
                </div>
              )}
            </div>

            {/* 5. OpenRouter */}
            <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-[#1E232F] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200 text-xs font-mono">OpenRouter API Key (DeepSeek R1 Free)</label>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium font-mono transition cursor-pointer"
                  title="Abrir OpenRouter para obtener clave"
                >
                  <span>Obtener clave</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={settings.openrouterApiKey || ''}
                onChange={(e) => setSettings({ ...settings, openrouterApiKey: e.target.value })}
                placeholder="sk-or-..."
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-mono">🔒 Solo en tu navegador</span>
                <button
                  type="button"
                  onClick={() => handleTestProvider('openrouter')}
                  disabled={testingProvider === 'openrouter'}
                  className="px-2.5 py-1 bg-[#161a24] hover:bg-[#1f2433] text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${testingProvider === 'openrouter' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'openrouter' ? 'Probando...' : '⚡ Probar OpenRouter'}</span>
                </button>
              </div>
              {providerTestResults['openrouter'] && (
                <div className={`p-2 rounded-lg text-[10px] font-mono flex items-center justify-between ${
                  providerTestResults['openrouter'].success ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                }`}>
                  <span>{providerTestResults['openrouter'].message}</span>
                  <button type="button" onClick={() => { const copy = { ...providerTestResults }; delete copy['openrouter']; setProviderTestResults(copy); }} className="text-slate-400 hover:text-white ml-1 cursor-pointer">✕</button>
                </div>
              )}
            </div>

            {/* 6. OpenAI */}
            <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-[#1E232F] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200 text-xs font-mono">OpenAI API Key (gpt-4o-mini)</label>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium font-mono transition cursor-pointer"
                  title="Abrir OpenAI Platform para obtener clave"
                >
                  <span>Obtener clave</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={settings.openaiApiKey || ''}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                placeholder="sk-proj-..."
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-mono">🔒 Solo en tu navegador</span>
                <button
                  type="button"
                  onClick={() => handleTestProvider('openai')}
                  disabled={testingProvider === 'openai'}
                  className="px-2.5 py-1 bg-[#161a24] hover:bg-[#1f2433] text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${testingProvider === 'openai' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'openai' ? 'Probando...' : '⚡ Probar OpenAI'}</span>
                </button>
              </div>
              {providerTestResults['openai'] && (
                <div className={`p-2 rounded-lg text-[10px] font-mono flex items-center justify-between ${
                  providerTestResults['openai'].success ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                }`}>
                  <span>{providerTestResults['openai'].message}</span>
                  <button type="button" onClick={() => { const copy = { ...providerTestResults }; delete copy['openai']; setProviderTestResults(copy); }} className="text-slate-400 hover:text-white ml-1 cursor-pointer">✕</button>
                </div>
              )}
            </div>

            {/* 7. Google Cloud (DLP & Translation) */}
            <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-[#1E232F] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200 text-xs font-mono">Google Cloud API Key (Translation & DLP)</label>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium font-mono transition cursor-pointer"
                  title="Abrir Google Cloud Credenciales"
                >
                  <span>Obtener clave</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={settings.googleCloudApiKey || ''}
                onChange={(e) => setSettings({ ...settings, googleCloudApiKey: e.target.value })}
                placeholder="AIzaSy... (API Key de GCP para DLP y Traductor)"
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <span className="text-[10px] text-slate-500 font-mono block pt-1">🔒 Solo en tu navegador</span>
            </div>

            {/* 8. DeepSeek */}
            <div className="bg-[#0A0C10] p-3.5 rounded-xl border border-[#1E232F] space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-200 text-xs font-mono">DeepSeek API Key (Opcional)</label>
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium font-mono transition cursor-pointer"
                  title="Abrir DeepSeek Platform para obtener clave"
                >
                  <span>Obtener clave</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="password"
                value={settings.deepseekApiKey || ''}
                onChange={(e) => setSettings({ ...settings, deepseekApiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-mono">🔒 Solo en tu navegador</span>
                <button
                  type="button"
                  onClick={() => handleTestProvider('deepseek')}
                  disabled={testingProvider === 'deepseek'}
                  className="px-2.5 py-1 bg-[#161a24] hover:bg-[#1f2433] text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 rounded-md text-[10px] font-mono font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${testingProvider === 'deepseek' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'deepseek' ? 'Probando...' : '⚡ Probar DeepSeek'}</span>
                </button>
              </div>
              {providerTestResults['deepseek'] && (
                <div className={`p-2 rounded-lg text-[10px] font-mono flex items-center justify-between ${
                  providerTestResults['deepseek'].success ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                }`}>
                  <span>{providerTestResults['deepseek'].message}</span>
                  <button type="button" onClick={() => { const copy = { ...providerTestResults }; delete copy['deepseek']; setProviderTestResults(copy); }} className="text-slate-400 hover:text-white ml-1 cursor-pointer">✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Botón de guardado principal en la tarjeta de IA */}
          <div className="flex items-center justify-end pt-3 border-t border-[#202634]">
            <button
              type="button"
              onClick={(e) => handleSaveSettings(e as any)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-semibold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Guardar Claves de IA</span>
            </button>
          </div>
        </div>

        {/* Supabase Keep-Alive Card */}
        <div className="bg-[#12151C] border border-[#202634] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202634] pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm font-mono">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Automatización Anti-Pausa de Supabase (Base de Datos Gratis 24/7)</span>
            </div>
            <button
              type="button"
              onClick={handleTestSupabasePing}
              disabled={pingingSupabase}
              className="px-3 py-1.5 bg-[#161a24] hover:bg-[#1f2433] text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pingingSupabase ? 'animate-spin' : ''}`} />
              <span>{pingingSupabase ? 'Enviando Ping...' : 'Probar Ping en Vivo'}</span>
            </button>
          </div>

          <div className="p-3.5 bg-emerald-950/30 border border-emerald-900/60 rounded-xl space-y-1.5 text-xs font-mono">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Protección 24/7 Activa en GitHub Actions</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              El flujo <code className="bg-[#0E1117] px-1.5 py-0.5 rounded border border-emerald-800 text-emerald-300">.github/workflows/supabase-keepalive.yml</code> ejecuta automáticamente un ping SELECT y POST cada <strong>2 días a las 12:00 UTC</strong> directamente desde los servidores de GitHub en la nube. Supabase nunca volverá a pausarse, incluso si nadie visita la plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">Supabase Project URL</label>
              <input
                type="text"
                value={settings.supabaseUrl}
                onChange={(e) => setSettings({ ...settings, supabaseUrl: e.target.value })}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 font-mono text-[11px]">Intervalo de Ping (Días)</label>
              <input
                type="number"
                value={settings.supabaseKeepAliveIntervalDays}
                onChange={(e) =>
                  setSettings({ ...settings, supabaseKeepAliveIntervalDays: Number(e.target.value) })
                }
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-600"
              />
            </div>
          </div>

          {/* Respaldo Redundante cron-job.org */}
          <div className="bg-[#0A0C10] border border-[#1E232F] rounded-xl p-3.5 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 font-bold text-white text-[11px]">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Respaldo Externo Opcional (Redundancia con cron-job.org)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              Si deseas un segundo guardián externo independiente de GitHub, puedes crear un cron gratuito en{' '}
              <a href="https://console.cron-job.org" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-medium">console.cron-job.org</a> con estos parámetros:
            </p>
            <div className="bg-[#0E1117] border border-[#202634] p-3 rounded font-mono text-[10px] text-slate-300 space-y-1">
              <div><strong>URL (GET):</strong> <code className="text-emerald-400">https://cvfybrtblxzpawnxqsnd.supabase.co/rest/v1/telemetry_logs?select=id&limit=1</code></div>
              <div><strong>Header:</strong> <code className="text-slate-400">apikey: sb_publishable_FaHiwWE7FIHP5-Xr7F6UQg_bJYFphXb</code></div>
              <div><strong>Frecuencia:</strong> Cada 3 días</div>
            </div>
          </div>
        </div>

        {/* Parámetros de Mercado Local Chile */}
        <div className="bg-[#12151C] border border-[#202634] rounded-2xl p-6 space-y-4 shadow-xl font-mono text-xs">
          <div className="border-b border-[#202634] pb-3 font-bold text-sm text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Tarifas de Infraestructura (Chile)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Costo Anual NIC Chile (.cl)</label>
              <input
                type="number"
                value={settings.nicChileCostCLP}
                onChange={(e) => setSettings({ ...settings, nicChileCostCLP: Number(e.target.value) })}
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500">Valor oficial con IVA: $9.990 CLP/año</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Costo Hosting Local TecnoInver</label>
              <input
                type="number"
                value={settings.tecnoInverCostCLP}
                onChange={(e) => setSettings({ ...settings, tecnoInverCostCLP: Number(e.target.value) })}
                className="w-full bg-[#0E1117] border border-[#202634] text-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500">Plan compartido en Chile: $30.000 CLP/año</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>

      {/* Respaldo y Gestión de Base de Datos JSON */}
      <div className="bg-[#12151C] border border-[#202634] rounded-2xl p-6 space-y-4 shadow-xl text-xs font-mono">
        <div className="border-b border-[#202634] pb-3 font-bold text-sm text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Respaldo Total de Base de Datos (100% Privado en tu Navegador)</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed font-mono">
          Todos los datos de prospectos, deals del CRM, cotizaciones, proyectos y auditorías de seguridad se almacenan en tu dispositivo (LocalStorage). Puedes descargar un respaldo en archivo JSON o restaurarlo en cualquier momento sin depender de servidores externos.
        </p>

        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <button
            type="button"
            onClick={() => exportAppStateToJSON(state)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-md cursor-pointer font-mono"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Todo a JSON</span>
          </button>

          <label className="px-4 py-2 bg-[#161a24] hover:bg-[#202634] border border-[#202634] hover:border-slate-500 text-slate-200 font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors font-mono">
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Importar Respaldo JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
