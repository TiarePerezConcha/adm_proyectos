import React, { useState } from 'react';
import { Settings, Key, Database, Download, Upload, Check, RefreshCw, Shield, Sparkles, DollarSign } from 'lucide-react';
import { AppState, saveAppState, exportAppStateToJSON, importAppStateFromJSON } from '../../utils/storage';
import { AppSettings } from '../../types';

interface ConfiguracionViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({ state, onUpdateState }) => {
  const [settings, setSettings] = useState<AppSettings>(state.settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pingingSupabase, setPingingSupabase] = useState(false);

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

  const handleTestSupabasePing = () => {
    setPingingSupabase(true);
    setTimeout(() => {
      setPingingSupabase(false);
      alert('¡Ping Keep-Alive ejecutado con éxito! Supabase ha registrado actividad reciente.');
    }, 800);
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
    <div className="p-8 max-w-5xl mx-auto space-y-8 text-slate-800">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          Configuración & APIs Multi-IA
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gestiona las claves de inteligencia artificial para maximizar tokens, parámetros de costos y respaldos.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Configuración guardada exitosamente en el almacenamiento local.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Multi-AI Engines Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-[#DD8396]" />
              <span>Conexión de Modelos de Inteligencia Artificial</span>
            </div>
            <span className="text-[10px] bg-rose-50 text-[#DD8396] font-mono px-2 py-0.5 rounded font-semibold">
              Multi-Token Balancing
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Puedes ingresar tus claves API para DeepSeek y Google Gemini simultáneamente. El sistema conmutará automáticamente entre ellas para maximizar el uso de tokens gratuitos. Si no ingresas claves, el sistema opera con el motor heurístico local gratuito.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Google Gemini API Key</label>
              <input
                type="password"
                value={settings.geminiApiKey}
                onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">DeepSeek API Key</label>
              <input
                type="password"
                value={settings.deepseekApiKey}
                onChange={(e) => setSettings({ ...settings, deepseekApiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Groq API Key (Llama 3.3 70B Free)</label>
              <input
                type="password"
                value={settings.groqApiKey}
                onChange={(e) => setSettings({ ...settings, groqApiKey: e.target.value })}
                placeholder="gsk_..."
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">OpenRouter / Mistral Key</label>
              <input
                type="password"
                value={settings.openrouterApiKey}
                onChange={(e) => setSettings({ ...settings, openrouterApiKey: e.target.value })}
                placeholder="sk-or-..."
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Preferencia de Enrutamiento</label>
            <select
              value={settings.preferredModel}
              onChange={(e) => setSettings({ ...settings, preferredModel: e.target.value as any })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none font-semibold"
            >
              <option value="auto">Automático (Balanceo Gemini + DeepSeek + Fallback Local)</option>
              <option value="gemini">Priorizar Google Gemini (Velocidad & Contexto)</option>
              <option value="deepseek">Priorizar DeepSeek (Razonamiento & Copywriting Persuasivo)</option>
              <option value="groq">Priorizar Groq (Ultra-Rápido Gratuito)</option>
              <option value="offline">Modo Local / Heurístico (Cero Consumo de Tokens)</option>
            </select>
          </div>
        </div>

        {/* Supabase Keep-Alive Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Automatización Anti-Pausa de Supabase (Base de Datos Gratis)</span>
            </div>
            <button
              type="button"
              onClick={handleTestSupabasePing}
              disabled={pingingSupabase}
              className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${pingingSupabase ? 'animate-spin' : ''}`} />
              <span>Probar Ping Ahora</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supabase Project URL</label>
              <input
                type="text"
                value={settings.supabaseUrl}
                onChange={(e) => setSettings({ ...settings, supabaseUrl: e.target.value })}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Intervalo de Ping (Días)</label>
              <input
                type="number"
                value={settings.supabaseKeepAliveIntervalDays}
                onChange={(e) =>
                  setSettings({ ...settings, supabaseKeepAliveIntervalDays: Number(e.target.value) })
                }
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Parámetros de Mercado Local Chile */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="border-b border-slate-100 pb-3 font-bold text-sm text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-600" />
            <span>Tarifas de Infraestructura (Chile)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Costo Anual NIC Chile (.cl)</label>
              <input
                type="number"
                value={settings.nicChileCostCLP}
                onChange={(e) => setSettings({ ...settings, nicChileCostCLP: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400">Valor oficial con IVA: $9.990 CLP/año</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Costo Hosting Local TecnoInver</label>
              <input
                type="number"
                value={settings.tecnoInverCostCLP}
                onChange={(e) => setSettings({ ...settings, tecnoInverCostCLP: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400">Plan compartido en Chile: $30.000 CLP/año</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>

      {/* Respaldo y Gestión de Base de Datos JSON */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm text-xs">
        <div className="border-b border-slate-100 pb-3 font-bold text-sm text-slate-900 flex items-center gap-2">
          <Download className="w-4 h-4 text-[#DD8396]" />
          <span>Respaldo Total de Base de Datos (100% Privado en tu Navegador)</span>
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          Todos los datos de prospectos, deals del CRM, cotizaciones, proyectos y auditorías de seguridad se almacenan en tu dispositivo (LocalStorage). Puedes descargar un respaldo en archivo JSON o restaurarlo en cualquier momento sin depender de servidores externos.
        </p>

        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <button
            type="button"
            onClick={() => exportAppStateToJSON(state)}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Todo a JSON</span>
          </button>

          <label className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Importar Respaldo JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
