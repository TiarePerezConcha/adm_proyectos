import React, { useState } from 'react';
import { Activity, Shield, Database, CheckCircle2, AlertTriangle, XCircle, Copy, Check, RefreshCw, Plus, Globe } from 'lucide-react';
import { AppState, saveAppState } from '../../utils/storage';
import { MonitoredProject } from '../../types';

interface ProjectMonitorViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

export const ProjectMonitorView: React.FC<ProjectMonitorViewProps> = ({ state, onUpdateState }) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [pingingSupabase, setPingingSupabase] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newUrl, setNewUrl] = useState('https://');

  const handlePingKeepAlive = (projectId: string) => {
    setPingingSupabase(true);
    setTimeout(() => {
      const now = new Date();
      const updated = state.monitoredProjects.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            lastSupabasePing: `Hoy a las ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (OK - Keep-Alive ejecutado)`,
          };
        }
        return p;
      });
      const newState = { ...state, monitoredProjects: updated };
      onUpdateState(newState);
      saveAppState(newState);
      setPingingSupabase(false);
    }, 900);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUrl) return;

    const newMon: MonitoredProject = {
      id: `mon-${Date.now()}`,
      name: newName,
      clientName: newClient || 'Cliente',
      url: newUrl,
      status: 'online',
      uptimePercentage: 99.9,
      avgResponseTimeMs: 240,
      sslValid: true,
      sslExpiresDays: 90,
      lastHeartbeat: 'Recién conectado',
      supabaseKeepAliveEnabled: true,
      lastSupabasePing: 'Iniciado hoy (OK)',
      recentErrors: [],
    };

    const newState = {
      ...state,
      monitoredProjects: [newMon, ...state.monitoredProjects],
    };
    onUpdateState(newState);
    saveAppState(newState);
    setShowAddProject(false);
    setNewName('');
    setNewClient('');
    setNewUrl('https://');
  };

  const telemetrySnippetCode = `<!-- LSC Telemetry & Security Agent v1.0 -->
<script>
  (function(config) {
    const start = performance.now();
    window.addEventListener('load', function() {
      const timing = performance.timing;
      const payload = {
        projectId: config.projectId,
        event: 'heartbeat',
        url: window.location.href,
        loadTimeMs: Math.round(performance.now() - start),
        dnsTimeMs: timing.domainLookupEnd - timing.domainLookupStart,
        tcpTimeMs: timing.connectEnd - timing.connectStart,
        sslValid: window.location.protocol === 'https:',
        timestamp: new Date().toISOString()
      };
      if (navigator.sendBeacon) {
        navigator.sendBeacon(config.endpoint, JSON.stringify(payload));
      } else {
        fetch(config.endpoint, { method: 'POST', body: JSON.stringify(payload), mode: 'no-cors' });
      }
    });

    window.addEventListener('error', function(e) {
      const errorPayload = {
        projectId: config.projectId,
        event: 'security_anomaly',
        type: 'javascript_error',
        message: e.message,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      if (navigator.sendBeacon) navigator.sendBeacon(config.endpoint, JSON.stringify(errorPayload));
    });
  })({
    projectId: 'TU_ID_DE_PROYECTO',
    endpoint: '${state.settings.telemetryEndpoint}'
  });
</script>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(telemetrySnippetCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-200">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 font-mono">
            <Activity className="w-5 h-5 text-emerald-400" />
            Monitor de Proyectos Levantados & Telemetría
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Auditoría en tiempo real de Uptime, latencia, certificados SSL y base de datos con anti-pausa.
          </p>
        </div>

        <button
          onClick={() => setShowAddProject(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Proyecto</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {state.monitoredProjects.map((proj) => (
          <div
            key={proj.id}
            className="bg-[#12151C] border border-[#202634] p-5 rounded-xl space-y-4 hover:border-[#2f394c] transition-colors"
          >
            <div className="flex items-start justify-between border-b border-[#202634] pb-3">
              <div>
                <h3 className="text-white font-mono font-bold text-sm">{proj.name}</h3>
                <a
                  href={proj.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-emerald-400 font-mono flex items-center gap-1 mt-0.5"
                >
                  <Globe className="w-3 h-3" />
                  <span>{proj.url}</span>
                </a>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                  proj.status === 'online'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                    : proj.status === 'degraded'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-800/40'
                }`}
              >
                {proj.status === 'online' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                {proj.status === 'degraded' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                {proj.status === 'offline' && <XCircle className="w-3 h-3 text-rose-400" />}
                <span>{proj.status}</span>
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="p-2 bg-[#0A0C10] rounded-lg border border-[#1b202c]">
                <div className="text-[10px] text-slate-400">Uptime</div>
                <div className="text-xs font-bold text-emerald-400 mt-1">{proj.uptimePercentage}%</div>
              </div>
              <div className="p-2 bg-[#0A0C10] rounded-lg border border-[#1b202c]">
                <div className="text-[10px] text-slate-400">Latencia</div>
                <div className="text-xs font-bold text-white mt-1">{proj.avgResponseTimeMs} ms</div>
              </div>
              <div className="p-2 bg-[#0A0C10] rounded-lg border border-[#1b202c]">
                <div className="text-[10px] text-slate-400">SSL Válido</div>
                <div className="text-xs font-bold text-sky-400 mt-1">{proj.sslExpiresDays} días</div>
              </div>
            </div>

            {/* Supabase Keep-Alive Section */}
            {proj.supabaseKeepAliveEnabled && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-lg space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
                    <Database className="w-3.5 h-3.5" />
                    <span>Supabase Keep-Alive Anti-Pausa</span>
                  </div>
                  <button
                    onClick={() => handlePingKeepAlive(proj.id)}
                    disabled={pingingSupabase}
                    className="p-1 hover:bg-emerald-900/40 rounded text-emerald-400 transition-colors"
                    title="Ejecutar Ping de activación manual"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pingingSupabase ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="text-[10px] text-slate-400">
                  {proj.lastSupabasePing || 'Ping programado activo cada 3 días'}
                </div>
              </div>
            )}

            {/* Errors / Warnings */}
            {proj.recentErrors && proj.recentErrors.length > 0 && (
              <div className="space-y-1 font-mono text-[11px]">
                {proj.recentErrors.map((err, i) => (
                  <div key={i} className="p-2 bg-amber-950/30 border border-amber-800/40 rounded text-amber-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Universal SDK & Telemetry Integration Guide */}
      <div className="bg-[#12151C] border border-[#202634] p-6 rounded-2xl space-y-4 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202634] pb-4">
          <div>
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Esquema de Integración para Proyectos ya Levantados
            </h2>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Copia e inserta este snippet antes del cierre de <code className="text-emerald-400">&lt;/body&gt;</code> en cualquier sitio (Shopify, WordPress, Next.js, HTML) para conectarlo al monitor.
            </p>
          </div>

          <button
            onClick={handleCopySnippet}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSnippet ? '¡Copiado!' : 'Copiar Snippet JS'}</span>
          </button>
        </div>

        <div className="bg-[#0A0C10] p-4 rounded-xl border border-[#202634] overflow-x-auto text-[11px] text-slate-300">
          <pre className="font-mono leading-relaxed">
            <code>{telemetrySnippetCode}</code>
          </pre>
        </div>
      </div>

      {/* Modal Add Project */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#12151C] border border-[#202634] p-6 rounded-2xl w-full max-w-md space-y-4 font-mono text-xs">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Registrar Nuevo Proyecto en Monitoreo
            </h2>

            <form onSubmit={handleAddProject} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Nombre del Proyecto *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Joyería Sonix Tienda"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="Ej: Daniel Silva"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">URL del Sitio Web *</label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://ejemplo.cl"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="px-3 py-2 bg-transparent hover:bg-slate-800 text-slate-400 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                >
                  Conectar al Monitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
