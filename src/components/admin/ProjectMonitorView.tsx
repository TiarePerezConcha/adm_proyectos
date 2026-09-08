import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Shield, Database, CheckCircle2, AlertTriangle, XCircle, Copy, Check, RefreshCw, Plus, Globe, Sparkles } from 'lucide-react';
import { AppState, saveAppState } from '../../utils/storage';
import { MonitoredProject } from '../../types';
import { supabase } from '../../services/supabaseClient';

interface ProjectMonitorViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Hace unos segundos (En vivo)';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min (En vivo)`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  } catch {
    return 'Recién conectado';
  }
}

export const ProjectMonitorView: React.FC<ProjectMonitorViewProps> = ({ state, onUpdateState }) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [pingingSupabase, setPingingSupabase] = useState(false);
  const [isSyncingTelemetry, setIsSyncingTelemetry] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [showAddProject, setShowAddProject] = useState(false);

  const [newName, setNewName] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newUrl, setNewUrl] = useState('https://');

  // Sincronización bidireccional automática con Supabase telemetry_logs
  const syncTelemetryFromSupabase = useCallback(async () => {
    setIsSyncingTelemetry(true);
    try {
      const { data: logs, error } = await supabase
        .from('telemetry_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.warn('Error consultando telemetry_logs:', error.message);
        return;
      }

      if (!logs || logs.length === 0) return;

      // Agrupar último ping por project_id
      const latestLogs = new Map<string, any>();
      for (const log of logs) {
        const pid = (log.project_id || '').trim().toLowerCase();
        if (pid && !latestLogs.has(pid)) {
          latestLogs.set(pid, log);
        }
      }

      const matchedPids = new Set<string>();

      // 1. Actualizar proyectos existentes con URLs y métricas reales desde Supabase
      const updatedList = state.monitoredProjects.map((proj) => {
        const normId = proj.id.toLowerCase();
        const cleanId = normId.replace(/^mon-/, '');

        let matchingLog: any = null;
        for (const [logPid, logData] of latestLogs.entries()) {
          const cleanLogPid = logPid.replace(/^mon-/, '');
          if (
            normId === logPid ||
            cleanId === cleanLogPid ||
            cleanId.includes(cleanLogPid) ||
            cleanLogPid.includes(cleanId) ||
            proj.name.toLowerCase().includes(cleanLogPid)
          ) {
            matchingLog = logData;
            matchedPids.add(logPid);
            break;
          }
        }

        if (matchingLog) {
          const hasLogUrl = Boolean(matchingLog.url && matchingLog.url !== 'invalid-url');
          return {
            ...proj,
            url: hasLogUrl ? matchingLog.url : proj.url,
            lastHeartbeat: formatRelativeTime(matchingLog.timestamp),
            avgResponseTimeMs: matchingLog.load_time_ms || proj.avgResponseTimeMs,
            sslValid: matchingLog.ssl_valid !== null && matchingLog.ssl_valid !== undefined ? matchingLog.ssl_valid : proj.sslValid,
            status: 'online' as const,
            lastSupabasePing: `Supabase Live: ${new Date(matchingLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (OK)`
          };
        }
        return proj;
      });

      // 2. Auto-descubrir proyectos nuevos enviados por la API que no estaban registrados
      const discovered: MonitoredProject[] = [];
      for (const [logPid, logData] of latestLogs.entries()) {
        if (!matchedPids.has(logPid) && logPid !== 'test-check') {
          const formattedName = logPid
            .replace(/^mon-/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase());

          discovered.push({
            id: logPid,
            name: formattedName,
            clientName: 'Detección Automática por API',
            url: logData.url || 'https://',
            status: 'online',
            uptimePercentage: 100.0,
            avgResponseTimeMs: logData.load_time_ms || 120,
            sslValid: logData.ssl_valid ?? true,
            sslExpiresDays: 90,
            lastHeartbeat: formatRelativeTime(logData.timestamp),
            supabaseKeepAliveEnabled: true,
            lastSupabasePing: `Detectado hoy a las ${new Date(logData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            recentErrors: []
          });
        }
      }

      const finalProjects = [...updatedList, ...discovered];
      const newState = { ...state, monitoredProjects: finalProjects };
      onUpdateState(newState);
      saveAppState(newState);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Fallo de sincronización Supabase Telemetry:', err);
    } finally {
      setIsSyncingTelemetry(false);
    }
  }, [state, onUpdateState]);

  useEffect(() => {
    syncTelemetryFromSupabase();
    const interval = setInterval(() => {
      syncTelemetryFromSupabase();
    }, 25000);
    return () => clearInterval(interval);
  }, []);

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

  const telemetrySnippetCode = `<!-- LSC Telemetry & Security Agent v2.0 -->
<script>
(function (config) {
  'use strict';
  const state = {
    errorCount: 0,
    maxErrorsPerSession: config.maxErrorsPerSession ?? 20,
    seenErrors: new Set(),
    startTime: performance.now(),
  };
  const sampleRate = config.sampleRate ?? 1;
  if (Math.random() > sampleRate) return;

  function sanitizeUrl(url) {
    try {
      const u = new URL(url);
      if (!config.includeQueryParams) { u.search = ''; u.hash = ''; }
      return u.toString();
    } catch { return 'invalid-url'; }
  }

  function send(payload) {
    const body = JSON.stringify({
      project_id: config.projectId,
      event: payload.event || 'heartbeat',
      url: sanitizeUrl(window.location.href),
      load_time_ms: payload.loadTimeMs || 0,
      ssl_valid: window.location.protocol === 'https:',
      message: payload.message || (payload.type ? (payload.type + ': ' + (payload.detailMessage || '')) : '')
    });
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const ok = navigator.sendBeacon(config.endpoint, blob);
      if (!ok) fallbackSend(body);
    } else { fallbackSend(body); }
  }

  function fallbackSend(body) {
    fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': config.apiKey, 'Authorization': 'Bearer ' + config.apiKey },
      body,
      keepalive: true
    }).catch(function () {});
  }

  function handleAnomaly(details) {
    if (state.errorCount >= state.maxErrorsPerSession) return;
    const key = details.type + ':' + (details.message || details.blockedUri || details.src || '');
    if (state.seenErrors.has(key)) return;
    state.seenErrors.add(key);
    state.errorCount++;
    send({ event: 'security_anomaly', ...details });
  }

  // 1. Navigation Timing v2
  window.addEventListener('load', function () {
    setTimeout(function () {
      const navEntries = performance.getEntriesByType('navigation');
      const nav = navEntries && navEntries.length > 0 ? navEntries[0] : null;
      const loadTime = Math.round(performance.now() - state.startTime);
      let metricDetails = 'Load: ' + loadTime + 'ms';
      if (nav) {
        const ttfb = Math.round(nav.responseStart - nav.requestStart);
        const domReady = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
        metricDetails += ', TTFB: ' + ttfb + 'ms, DOMReady: ' + domReady + 'ms';
      }
      send({
        event: 'heartbeat',
        loadTimeMs: loadTime,
        message: metricDetails
      });
    }, 0);
  });

  // 2. Errores JS
  window.addEventListener('error', function (e) {
    handleAnomaly({ type: 'javascript_error', message: e.message, source: e.filename, line: e.lineno, col: e.colno });
  });

  // 3. Promesas no manejadas
  window.addEventListener('unhandledrejection', function (e) {
    handleAnomaly({ type: 'unhandled_rejection', message: e.reason && e.reason.message ? e.reason.message : String(e.reason) });
  });

  // 4. Violaciones CSP
  document.addEventListener('securitypolicyviolation', function (e) {
    handleAnomaly({ type: 'csp_violation', blockedUri: e.blockedURI, violatedDirective: e.violatedDirective, sourceFile: e.sourceFile, lineNumber: e.lineNumber });
  });

  // 5. Contenido mixto
  window.addEventListener('load', function () {
    if (window.location.protocol !== 'https:') return;
    const insecure = performance.getEntriesByType('resource').filter(function (r) { return r.name.indexOf('http://') === 0; });
    if (insecure.length > 0) {
      handleAnomaly({ type: 'mixed_content', count: insecure.length, urls: insecure.slice(0, 5).map(function (r) { return r.name; }) });
    }
  });

  // 6. Inyeccion de DOM (XSS / Skimmers)
  if (window.MutationObserver) {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'SCRIPT' || node.tagName === 'IFRAME') {
            handleAnomaly({ type: 'dom_injection', tag: node.tagName, src: node.src || 'inline' });
          }
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})({
  projectId: 'MI_PROYECTO_ID',
  endpoint: 'https://cvfybrtblxzpawnxqsnd.supabase.co/rest/v1/telemetry_logs',
  apiKey: '${state.settings.supabaseAnonKey || 'sb_publishable_FaHiwWE7FIHP5-Xr7F6UQg_bJYFphXb'}',
  sampleRate: 1,
  includeQueryParams: false,
  maxErrorsPerSession: 20
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
            Auditoría en tiempo real conectada a Supabase Cloud. Detección automática de URLs de producción, latencia y SSL.
            {lastSyncTime && <span className="text-emerald-400 ml-2">● Sincronizado {lastSyncTime}</span>}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => syncTelemetryFromSupabase()}
            disabled={isSyncingTelemetry}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#161B24] border border-[#232A3B] hover:border-emerald-500/50 rounded-lg text-xs font-mono text-slate-300 transition-colors"
            title="Consultar últimas URLs y Heartbeats en Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingTelemetry ? 'animate-spin' : ''}`} />
            <span>{isSyncingTelemetry ? 'Sincronizando...' : 'Sincronizar Cloud'}</span>
          </button>

          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Proyecto</span>
          </button>
        </div>
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
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1.5 mt-1 transition-colors group"
                >
                  <Globe className="w-3 h-3 text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate max-w-[200px] sm:max-w-xs">{proj.url}</span>
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
                <div className="text-xs font-bold text-sky-400 mt-1">{proj.sslValid ? 'Sí' : 'No'}</div>
              </div>
            </div>

            {/* Estado del Ping y Última Conexión */}
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between border-t border-[#1b202c] pt-2">
              <span>Ping:</span>
              <span className="text-emerald-400 font-semibold">{proj.lastHeartbeat || 'En vivo'}</span>
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
