import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  HelpCircle,
  Calendar,
  Users,
  Star,
  DollarSign,
  Search,
  Sparkles,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Shield,
  Zap,
  Key,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { AppState, clearAppState } from '../../utils/storage';
import { supabase } from '../../services/supabaseClient';
import { getAIUsageMetrics } from '../../services/aiService';

interface MetricasViewProps {
  state: AppState;
}

// Helper para formatear tiempos relativos amigables
function formatLogTimestamp(timestamp?: string) {
  if (!timestamp) return { relative: 'Reciente', exact: '' };
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return { relative: 'Reciente', exact: '' };

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  let relative = '';
  if (diffSec < 60) {
    relative = 'Hace un momento';
  } else if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    relative = `Hace ${mins} min`;
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    relative = `Hace ${hours} h`;
  } else {
    const days = Math.floor(diffSec / 86400);
    relative = `Hace ${days} d`;
  }

  const exact = date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return { relative, exact };
}

export const MetricasView: React.FC<MetricasViewProps> = ({ state }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [telemetryLogsCount, setTelemetryLogsCount] = useState<number>(0);
  const [realTelemetryLogs, setRealTelemetryLogs] = useState<any[]>([]);

  // Tester en vivo de la clave Gemini API
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestFeedback, setGeminiTestFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [aiMetrics, setAiMetrics] = useState(getAIUsageMetrics());

  // Datos reales derivados del estado activo
  const totalBookings = state.calendarBookings.length;
  const totalClients = state.clients.length;
  const totalValueDeals = state.deals.reduce((acc, d) => acc + d.valueCLP, 0);
  const totalProjects = state.monitoredProjects.length;

  const fetchRealServerMetrics = async () => {
    setIsSyncing(true);
    setAiMetrics(getAIUsageMetrics());
    try {
      const { data, count, error } = await supabase
        .from('telemetry_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .limit(20);

      if (!error && typeof count === 'number') {
        setTelemetryLogsCount(count);
        if (data) setRealTelemetryLogs(data);
      }
    } catch (err) {
      console.warn('Sincronización Supabase:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  };

  useEffect(() => {
    fetchRealServerMetrics();
  }, []);

  const handleTestGeminiKey = async () => {
    setIsTestingGemini(true);
    setGeminiTestFeedback(null);
    const key = state.settings?.geminiApiKey?.trim();
    if (!key) {
      setGeminiTestFeedback({
        success: false,
        message: 'No hay ninguna clave Gemini API guardada en Configuración & APIs. Para probar la conexión, primero ingresa tu clave en "Configuración > Claves de IA".',
      });
      setIsTestingGemini(false);
      return;
    }

    try {
      // Probar conexión real contra Google Generative Language API
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
      );
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const count = data?.models?.length || 0;
        setGeminiTestFeedback({
          success: true,
          message: `✓ Conexión exitosa (200 OK): Tu clave de Google Cloud / Google AI Studio (Proyecto Administrador de Proyectos) está activa y responde (${count} modelos disponibles).`,
        });
      } else {
        const errJson = await res.json().catch(() => ({}));
        setGeminiTestFeedback({
          success: false,
          message: `✕ Error en Gemini API (${res.status}): ${errJson?.error?.message || 'Clave inválida o restringida'}`,
        });
      }
    } catch (err: any) {
      setGeminiTestFeedback({
        success: false,
        message: `✕ Error de red o CORS al contactar generativelanguage.googleapis.com: ${err?.message || 'Fallo de conexión'}`,
      });
    } finally {
      setIsTestingGemini(false);
    }
  };

  // Desglose por proyecto monitoreado real
  const servicesMetrics = state.monitoredProjects
    .filter(
      (p) =>
        p.id !== 'conpi-react' &&
        p.id !== 'conpi-web' &&
        p.id !== 'test-keepalive-verify' &&
        p.name !== 'Conpi React' &&
        p.name !== 'Conpi Web' &&
        !p.name.includes('Test Keepalive')
    )
    .map((proj) => ({
      service: proj.name,
      status: proj.status,
      uptime: proj.uptimePercentage,
      responseTime: proj.avgResponseTimeMs,
      client: proj.clientName,
    }));

  const settings = state.settings || ({} as any);

  // Helper para contabilizar llamadas de cada proveedor en aiMetrics
  const getCallsFor = (term: string) => {
    return Object.entries(aiMetrics.providerCalls || {}).reduce((acc, [k, v]) => {
      if (k.toLowerCase().includes(term.toLowerCase())) {
        return acc + (typeof v === 'number' ? v : 0);
      }
      return acc;
    }, 0);
  };

  const hasGeminiKey = Boolean(settings.geminiApiKey && settings.geminiApiKey.trim().length > 5);
  const hasGroqKey = Boolean(settings.groqApiKey && settings.groqApiKey.trim().length > 3);
  const hasSambanovaKey = Boolean(settings.sambanovaApiKey && settings.sambanovaApiKey.trim().length > 3);
  const hasGithubKey = Boolean(settings.githubModelsApiKey && settings.githubModelsApiKey.trim().length > 3);
  const hasOpenrouterKey = Boolean(settings.openrouterApiKey && settings.openrouterApiKey.trim().length > 3);
  const hasOpenaiKey = Boolean(settings.openaiApiKey && settings.openaiApiKey.trim().length > 3);
  const hasDeepseekKey = Boolean(settings.deepseekApiKey && settings.deepseekApiKey.trim().length > 3);
  const hasGcpKey = Boolean(settings.googleCloudApiKey && settings.googleCloudApiKey.trim().length > 5);

  const geminiCalls = getCallsFor('gemini') + getCallsFor('google');
  const groqCalls = getCallsFor('groq');
  const sambanovaCalls = getCallsFor('sambanova');
  const githubCalls = getCallsFor('github');
  const openrouterCalls = getCallsFor('openrouter');
  const openaiCalls = getCallsFor('openai');
  const deepseekCalls = getCallsFor('deepseek');
  const localCalls = getCallsFor('local') + getCallsFor('heurístico') + (aiMetrics.totalCalls > 0 && geminiCalls === 0 && groqCalls === 0 ? aiMetrics.totalCalls : 0);
  const totalTokens = aiMetrics.totalTokensUsed || 0;

  // Función de diagnóstico real: determina el estado verificado sin inventar datos
  const getProviderStatus = (providerId: string, hasKey: boolean, defaultOkLabel: string) => {
    if (!hasKey) {
      return {
        statusText: 'Desconectado',
        badgeColor: 'bg-slate-900 text-slate-500 border-slate-700',
        isHealthy: false,
        isNoCredits: false,
        detail: 'Sin clave configurada',
      };
    }
    const info = settings.providerStatus?.[providerId];
    if (info) {
      if (info.status === 'no_credits') {
        return {
          statusText: '🔴 Sin Saldo / Créditos Agotados',
          badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
          isHealthy: false,
          isNoCredits: true,
          detail: info.message || 'Saldo o créditos agotados en cuenta oficial',
        };
      }
      if (info.status === 'error') {
        return {
          statusText: '⚠️ Error de Conexión',
          badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
          isHealthy: false,
          isNoCredits: false,
          detail: info.message || 'Fallo de autenticación o restricción',
        };
      }
      if (info.status === 'active') {
        return {
          statusText: '🟢 Activo (Verificado)',
          badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
          isHealthy: true,
          isNoCredits: false,
          detail: info.message || 'Conexión verificada',
        };
      }
    }

    // Si aún no ha sido probado con el tester:
    return {
      statusText: `🟡 ${defaultOkLabel} (Guardada)`,
      badgeColor: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
      isHealthy: true,
      isNoCredits: false,
      detail: 'Clave guardada en navegador (Haz clic en Probar en Configuración)',
    };
  };

  const geminiInfo = getProviderStatus('gemini', hasGeminiKey, 'Activo');
  const groqInfo = getProviderStatus('groq', hasGroqKey, 'Activo (Ultra-Rápido)');
  const githubInfo = getProviderStatus('github', hasGithubKey, 'Activo (Personal Token)');
  const sambanovaInfo = getProviderStatus('sambanova', hasSambanovaKey, 'Activo (Inferencia SN)');
  const openrouterInfo = getProviderStatus('openrouter', hasOpenrouterKey, 'Activo (Multi-Modelo)');
  const openaiInfo = getProviderStatus('openai', hasOpenaiKey, 'Configurada');
  const deepseekInfo = getProviderStatus('deepseek', hasDeepseekKey, 'Configurada');
  const gcpInfo = getProviderStatus('gcp', hasGcpKey, 'Activo (Translation & DLP)');

  // Lista maestra de todos los proveedores integrados con su estado real verificado
  const aiProviders = [
    { name: 'Google Gemini', model: 'Gemini 2.5 Flash', hasKey: hasGeminiKey, calls: geminiCalls, info: geminiInfo, isChars: false },
    { name: 'Groq API', model: 'Llama 3.1 / 3.3', hasKey: hasGroqKey, calls: groqCalls, info: groqInfo, isChars: false },
    { name: 'GitHub Models', model: 'gpt-4o-mini', hasKey: hasGithubKey, calls: githubCalls, info: githubInfo, isChars: false },
    { name: 'SambaNova', model: 'Llama 3.1 70B', hasKey: hasSambanovaKey, calls: sambanovaCalls, info: sambanovaInfo, isChars: false },
    { name: 'OpenRouter', model: 'DeepSeek R1 Free', hasKey: hasOpenrouterKey, calls: openrouterCalls, info: openrouterInfo, isChars: false },
    { name: 'OpenAI API', model: 'gpt-4o-mini', hasKey: hasOpenaiKey, calls: openaiCalls, info: openaiInfo, isChars: false },
    { name: 'DeepSeek Direct', model: 'V3 / R1', hasKey: hasDeepseekKey, calls: deepseekCalls, info: deepseekInfo, isChars: false },
    { name: 'Google Cloud (DLP & i18n)', model: 'Translation v2', hasKey: hasGcpKey, calls: aiMetrics.translationCharsUsed || 0, info: gcpInfo, isChars: true },
  ];

  const totalConfiguredCount = aiProviders.filter((p) => p.hasKey).length;
  const activeProvidersCount = aiProviders.filter((p) => p.hasKey && p.info.isHealthy).length;
  const noCreditsCount = aiProviders.filter((p) => p.hasKey && p.info.isNoCredits).length;

  interface ActiveModelCardItem {
    id: string;
    name: string;
    provider: string;
    category: string;
    status: string;
    badgeColor: string;
    hasKey: boolean;
    isWarning?: boolean;
    currentRPM: string;
    currentTPM: string;
    currentRPD: string;
    quotaPercent: string;
    usedToday: string;
  }

  // Tarjetas dinámicas: Muestra cada modelo que tenga API Key conectada + Google Gemini + Motor Local
  const activeModelCards: ActiveModelCardItem[] = [
    {
      id: 'gemini',
      name: 'Google Gemini 2.5 Flash',
      provider: 'Google AI Studio',
      category: 'Modelos de texto & multimodal (Producción)',
      status: geminiInfo.statusText,
      badgeColor: geminiInfo.badgeColor,
      hasKey: hasGeminiKey,
      currentRPM: hasGeminiKey ? (geminiCalls > 0 ? '1 / 15' : '0 / 15') : '0 / 15',
      currentTPM: hasGeminiKey ? `${totalTokens > 0 ? (totalTokens > 1000 ? (totalTokens / 1000).toFixed(1) + 'K' : totalTokens) : '0'} / 250K` : '0 / 250K',
      currentRPD: hasGeminiKey ? `${geminiCalls} / 500` : '0 / 500',
      quotaPercent: hasGeminiKey ? `${((geminiCalls / 500) * 100).toFixed(1)}%` : '0.0%',
      usedToday: hasGeminiKey ? `${geminiCalls} peticiones` : '0 peticiones (Sin Clave)',
    },
    ...(hasGroqKey
      ? [
          {
            id: 'groq',
            name: 'Groq Cloud (Llama 3.1 / 3.3)',
            provider: 'Groq LPUs',
            category: 'Inferencia ultra-rápida (Hardware LPU)',
            status: groqInfo.statusText,
            badgeColor: groqInfo.badgeColor,
            hasKey: true,
            currentRPM: groqCalls > 0 ? '1 / 30' : '0 / 30',
            currentTPM: '0 / 6K',
            currentRPD: `${groqCalls} / 14,400`,
            quotaPercent: `${((groqCalls / 14400) * 100).toFixed(2)}%`,
            usedToday: `${groqCalls} peticiones`,
          },
        ]
      : []),
    ...(hasGithubKey
      ? [
          {
            id: 'github',
            name: 'GitHub Models (Azure AI)',
            provider: 'GitHub Personal Token',
            category: 'Tier Desarrollador GitHub Marketplace',
            status: githubInfo.statusText,
            badgeColor: githubInfo.badgeColor,
            hasKey: true,
            currentRPM: githubCalls > 0 ? '1 / 15' : '0 / 15',
            currentTPM: '0 / 150K',
            currentRPD: `${githubCalls} / 150`,
            quotaPercent: `${((githubCalls / 150) * 100).toFixed(1)}%`,
            usedToday: `${githubCalls} peticiones`,
          },
        ]
      : []),
    ...(hasSambanovaKey
      ? [
          {
            id: 'sambanova',
            name: 'SambaNova (Llama 3.1 70B)',
            provider: 'SambaNova Cloud SN',
            category: 'Inferencia acelerada en chip RD1788',
            status: sambanovaInfo.statusText,
            badgeColor: sambanovaInfo.badgeColor,
            hasKey: true,
            currentRPM: sambanovaCalls > 0 ? '1 / 20' : '0 / 20',
            currentTPM: '0 / 100K',
            currentRPD: `${sambanovaCalls} / 1,000`,
            quotaPercent: `${((sambanovaCalls / 1000) * 100).toFixed(1)}%`,
            usedToday: `${sambanovaCalls} peticiones`,
          },
        ]
      : []),
    ...(hasOpenrouterKey
      ? [
          {
            id: 'openrouter',
            name: 'OpenRouter (DeepSeek R1 Free)',
            provider: 'OpenRouter AI',
            category: 'Modelos de razonamiento gratuitos',
            status: openrouterInfo.statusText,
            badgeColor: openrouterInfo.badgeColor,
            hasKey: true,
            currentRPM: openrouterCalls > 0 ? '1 / 20' : '0 / 20',
            currentTPM: '0 / 200K',
            currentRPD: `${openrouterCalls} / 200`,
            quotaPercent: `${((openrouterCalls / 200) * 100).toFixed(1)}%`,
            usedToday: `${openrouterCalls} peticiones`,
          },
        ]
      : []),
    ...(hasOpenaiKey
      ? [
          {
            id: 'openai',
            name: 'OpenAI (gpt-4o-mini)',
            provider: 'OpenAI Direct API',
            category: 'Modelo de producción OpenAI',
            status: openaiInfo.statusText,
            badgeColor: openaiInfo.badgeColor,
            hasKey: true,
            currentRPM: openaiInfo.isNoCredits ? '0 / 500 (Bloqueado por saldo)' : '0 / 500',
            currentTPM: openaiInfo.isNoCredits ? '0 créditos disponibles' : '0 / 200K',
            currentRPD: `${openaiCalls} peticiones`,
            quotaPercent: openaiInfo.isNoCredits ? '🔴 Saldo $0' : 'Pay-as-you-go',
            usedToday: openaiInfo.isNoCredits ? 'Requiere recargar créditos en OpenAI Platform' : `${openaiCalls} peticiones`,
          },
        ]
      : []),
    ...(hasDeepseekKey
      ? [
          {
            id: 'deepseek',
            name: 'DeepSeek (V3 / R1)',
            provider: 'DeepSeek Direct API',
            category: 'Inferencia de razonamiento directo',
            status: deepseekInfo.statusText,
            badgeColor: deepseekInfo.badgeColor,
            hasKey: true,
            currentRPM: deepseekInfo.isNoCredits ? '0 / 60 (Bloqueado por balance)' : '0 / 60',
            currentTPM: deepseekInfo.isNoCredits ? '0 balance disponible' : '0 / 100K',
            currentRPD: `${deepseekCalls} peticiones`,
            quotaPercent: deepseekInfo.isNoCredits ? '🔴 Balance Agotado' : 'Pay-as-you-go',
            usedToday: deepseekInfo.isNoCredits ? 'Requiere recargar balance en DeepSeek Platform' : `${deepseekCalls} peticiones`,
          },
        ]
      : []),
    ...(hasGcpKey
      ? [
          {
            id: 'gcp',
            name: 'Google Cloud Translation & DLP',
            provider: 'Google Cloud Platform',
            category: 'Protección de datos & Traductor oficial',
            status: gcpInfo.statusText,
            badgeColor: gcpInfo.badgeColor,
            hasKey: true,
            currentRPM: 'Cuota mensual 500K chars',
            currentTPM: `${(aiMetrics.dlpBytesScanned || 0) > 0 ? (aiMetrics.dlpBytesScanned / 1024).toFixed(0) + ' KB' : '0 KB'} DLP`,
            currentRPD: `${(aiMetrics.translationCharsUsed || 0).toLocaleString()} chars usados`,
            quotaPercent: `${(((aiMetrics.translationCharsUsed || 0) / 500000) * 100).toFixed(2)}%`,
            usedToday: `${(aiMetrics.translationCharsUsed || 0).toLocaleString()} caracteres (Nivel Gratis $0)`,
          },
        ]
      : []),
    {
      id: 'local',
      name: 'Motor Heurístico de Contingencia',
      provider: 'Navegador Web (JavaScript Nativo)',
      category: 'Mecanismo de seguridad ante fallos o falta de saldo en APIs externas',
      status: 'Activo (Modo Local)',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
      hasKey: true,
      currentRPM: 'Ilimitado',
      currentTPM: 'Ilimitado',
      currentRPD: `${localCalls} consultas`,
      quotaPercent: '0.0%',
      usedToday: `${aiMetrics.totalCalls} ejecuciones (Modo contingencia 100% gratuito)`,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-200 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            MÉTRICAS & AGENTE IA
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Consolidado general de operaciones y estado verificado de cuotas de modelos de IA (Proyecto Administrador de Proyectos).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={fetchRealServerMetrics}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#161B24] border border-[#232A3B] hover:border-emerald-500/50 rounded-lg text-xs font-mono text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Consultando Supabase...' : 'Sincronizar APIs'}</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('¿Deseas purgar la caché local (LocalStorage) y recargar desde la BBDD?')) {
                clearAppState();
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#181116] border border-red-500/30 hover:border-red-500/60 rounded-lg text-xs font-mono text-red-300 transition-colors cursor-pointer"
            title="Elimina datos locales obsoletos y recarga la aplicación leyendo la base de datos limpia"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Purgar Caché Local</span>
          </button>
        </div>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl relative group">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Eventos Telemetría</span>
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-2">
            {telemetryLogsCount}
          </div>
          <span className="text-[9px] text-emerald-400 font-mono block mt-1">● Supabase Cloud</span>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Proyectos Registrados</span>
          </div>
          <div className="text-2xl font-mono font-bold text-sky-400 mt-2">{totalProjects}</div>
          <span className="text-[9px] text-slate-400 font-mono block mt-1">En Monitoreo</span>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Citas Agendadas</span>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">{totalBookings}</div>
          <span className="text-[9px] text-slate-500 font-mono block mt-1">Google Meet</span>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Clientes CRM</span>
          </div>
          <div className="text-2xl font-mono font-bold text-sky-400 mt-2">{totalClients}</div>
          <span className="text-[9px] text-slate-500 font-mono block mt-1">Registrados</span>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Uptime Promedio</span>
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-2">
            {totalProjects > 0 ? (state.monitoredProjects.reduce((acc, p) => acc + (p.uptimePercentage || 100), 0) / totalProjects).toFixed(1) : '100.0'}%
          </div>
          <span className="text-[9px] text-amber-400/80 font-mono block mt-1">
            {state.monitoredProjects.filter((p) => p.status === 'online').length}/{totalProjects} en línea
          </span>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pipeline CRM</span>
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-2">
            ${totalValueDeals > 0 ? (totalValueDeals / 1000000).toFixed(1) + 'M' : '$0'}
          </div>
          <span className="text-[9px] text-emerald-400/80 font-mono block mt-1">
            ${totalValueDeals.toLocaleString('es-CL')} CLP
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN OFICIAL DE MODELOS & CUOTAS DE IA (PROYECTO ADMINISTRADOR DE PROYECTOS) */}
      {/* ============================================================== */}
      <div className="bg-[#12151C] border border-[#202634] p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202634] pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-mono">
                Límites & Cuotas Reales de Modelos de IA (Proyecto Administrador de Proyectos)
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Monitoreo de cuotas oficiales, límites por minuto (RPM), tokens (TPM) y balanceador multi-modelo verificado en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTestGeminiKey}
              disabled={isTestingGemini}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border ${
                hasGeminiKey
                  ? 'bg-emerald-600/20 hover:bg-emerald-600/40 border-emerald-500/50 text-emerald-300'
                  : 'bg-[#1b202c] hover:bg-[#252c3c] border-slate-700 text-slate-400'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isTestingGemini ? 'animate-spin' : ''}`} />
              <span>{isTestingGemini ? 'Probando API...' : 'Probar Conexión Gemini API'}</span>
            </button>

            {totalConfiguredCount > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ● {activeProvidersCount} Proveedor{activeProvidersCount !== 1 ? 'es' : ''} Operativo{activeProvidersCount !== 1 ? 's' : ''}
                </span>
                {noCreditsCount > 0 && (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    🔴 {noCreditsCount} Sin Saldo / Créditos
                  </span>
                )}
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700">
                ⚪ Sin Claves Configuradas
              </span>
            )}
          </div>
        </div>

        {geminiTestFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-mono leading-relaxed ${
              geminiTestFeedback.success
                ? 'bg-emerald-950/70 border-emerald-700 text-emerald-200'
                : 'bg-rose-950/70 border-rose-700 text-rose-200'
            }`}
          >
            {geminiTestFeedback.message}
          </div>
        )}

        {/* Aviso si ningún proveedor tiene clave configurada */}
        {totalConfiguredCount === 0 && (
          <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Key className="w-4 h-4 shrink-0" />
              <span>Sin claves de IA configuradas en este entorno</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Actualmente los campos de API Keys en <strong>Configuración &gt; Claves de IA</strong> están vacíos. 
              A medida que ingreses tus claves (Google Gemini, Groq, GitHub Models, SambaNova, OpenRouter, etc.), cada proveedor habilitado aparecerá automáticamente con su tarjeta de límites y cuotas activa.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-amber-300/80 pt-1">
              <span>● Modo actual: Motor Heurístico de Contingencia activo en el navegador sin costo de tokens</span>
            </div>
          </div>
        )}

        {/* Tarjetas de Modelos Activos Conectados */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeModelCards.map((m, i) => (
            <div
              key={i}
              className={`bg-[#0A0C10] border p-4 rounded-xl space-y-3 font-mono text-xs transition ${
                m.isWarning ? 'border-rose-800/60 bg-rose-950/10' : 'border-[#1b202c]'
              }`}
            >
              <div className="flex items-start justify-between border-b border-[#1b202c] pb-2.5">
                <div>
                  <h3 className="text-white font-bold text-sm">{m.name}</h3>
                  <span className="text-[10px] text-slate-500 block">{m.category}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    m.badgeColor
                      ? m.badgeColor
                      : m.status.includes('Activo') && !m.status.includes('Local')
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : m.status.includes('Local')
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {m.status}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Peticiones por Minuto (RPM):</span>
                  <span className={m.isWarning ? 'text-rose-400 font-bold' : m.hasKey ? 'text-white font-bold' : 'text-slate-500'}>
                    {m.currentRPM}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tokens por Minuto (TPM):</span>
                  <span className={m.isWarning ? 'text-rose-400 font-bold' : m.hasKey ? 'text-white font-bold' : 'text-slate-500'}>
                    {m.currentTPM}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Peticiones por Día (RPD):</span>
                  <span className={m.isWarning ? 'text-rose-400 font-bold' : m.hasKey ? (m.status.includes('Local') ? 'text-indigo-400 font-bold' : 'text-emerald-400 font-bold') : 'text-slate-500'}>
                    {m.currentRPD}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#161a24] flex justify-between text-[10px] text-slate-400">
                  <span>Consumo / Cuota:</span>
                  <span className={m.isWarning ? 'text-rose-400 font-bold' : m.hasKey ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {m.quotaPercent} ({m.usedToday})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Proveedores con estado verificado dinámicamente */}
        <div className="p-4 bg-[#0A0C10] border border-[#1b202c] rounded-xl space-y-2 font-mono text-xs">
          <span className="text-slate-400 text-[11px] block font-bold">
            Estado de Proveedores de IA en el Administrador de Proyectos:
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {aiProviders.map((p, idx) => (
              <span
                key={idx}
                className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 border ${
                  !p.hasKey
                    ? 'bg-[#12151C] border-[#202634] text-slate-500'
                    : p.info.isNoCredits
                    ? 'bg-rose-950/60 border-rose-800 text-rose-300 font-bold'
                    : p.info.isHealthy
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 font-bold'
                    : 'bg-amber-950/60 border-amber-800 text-amber-300'
                }`}
              >
                <span>
                  {!p.hasKey ? '○' : p.info.isNoCredits ? '🔴' : p.info.isHealthy ? '🟢' : '⚠️'} {p.name}
                </span>
                <span className={!p.hasKey ? 'text-slate-600 text-[10px]' : p.info.isNoCredits ? 'text-rose-400 text-[10px]' : 'text-emerald-400/80 text-[10px]'}>
                  ({!p.hasKey ? 'Sin Clave' : p.info.isNoCredits ? 'Sin Saldo / 0 Créditos' : p.isChars ? `${p.calls.toLocaleString()} chars` : `${p.calls} ejecuciones`})
                </span>
              </span>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 pt-1">
            Para activar o actualizar las credenciales de cualquier proveedor, ingresa tu clave en <strong>Configuración &gt; Claves de IA</strong>. Cada clave ingresada activa automáticamente su tarjeta de monitoreo en esta sección.
          </p>
        </div>
      </div>

      {/* Grid: Proyectos con Telemetría & Telemetría en Vivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#202634] pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              PROYECTOS CON TELEMETRÍA ACTIVA
            </span>
            <span className="text-[10px] font-mono text-emerald-400">{servicesMetrics.length} Proyectos</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {servicesMetrics.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b border-[#1b202c] last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-300 font-semibold">{item.service}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                  <span>{item.client}</span>
                  <span className="text-emerald-400">{item.uptime}% uptime</span>
                  <span className="text-sky-400">{item.responseTime}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#202634] pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              LOGS DE TELEMETRÍA EN VIVO (SUPABASE)
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Endpoint Activo
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs max-h-60 overflow-y-auto pr-1">
            {realTelemetryLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Esperando primeras conexiones HTTP desde los proyectos inyectados...
              </div>
            ) : (
              realTelemetryLogs.map((log, idx) => (
                <div key={idx} className="p-2.5 bg-[#0D1017] border border-[#1b212d] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="text-emerald-400 font-bold">{log.project_id}</span>
                      <span className="text-slate-500 text-[10px] uppercase px-1.5 py-0.2 bg-[#171d27] rounded">{log.event || 'heartbeat'}</span>
                    </div>
                    {log.url && (
                      <span className="text-slate-400 text-[10px] truncate max-w-xs mt-0.5">{log.url}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-[11px] self-end sm:self-auto font-mono">
                    {log.load_time_ms ? (
                      <span className="text-sky-400 font-semibold bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/40">
                        ⚡ {log.load_time_ms} ms
                      </span>
                    ) : null}
                    <span className="text-slate-300 font-medium">
                      {formatLogTimestamp(log.timestamp).relative} <span className="text-slate-500 text-[10px]">({formatLogTimestamp(log.timestamp).exact})</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};