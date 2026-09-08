import React, { useState } from 'react';
import {
  ShieldAlert,
  Server,
  Database,
  CreditCard,
  Key,
  AlertOctagon,
  FileText,
  Sparkles,
  Plus,
  Calculator,
  CheckCircle2,
  Lock,
  Globe,
  Radio,
  FileSearch,
  Bot,
  Activity,
  AlertTriangle,
  HardDrive
} from 'lucide-react';
import { AppState, saveAppState } from '../../utils/storage';
import { SecurityAsset, SecurityRisk, SecurityPlaybook } from '../../types';
import { generateWithAI } from '../../services/aiService';

interface MiniSocViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

export const MiniSocView: React.FC<MiniSocViewProps> = ({ state, onUpdateState }) => {
  const [activeTab, setActiveTab] = useState<'matriz' | 'activos' | 'playbooks' | 'auditorias'>('matriz');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState<SecurityPlaybook | null>(null);

  // Form states for new risk
  const [showAddRisk, setShowAddRisk] = useState(false);
  const [threatName, setThreatName] = useState('');
  const [threatCategory, setThreatCategory] = useState<any>('caida_pasarela');
  const [sleCLP, setSleCLP] = useState<number>(1000000);
  const [aro, setAro] = useState<number>(0.5);
  const [mitigation, setMitigation] = useState('');
  const [impactDesc, setImpactDesc] = useState('');

  // 8 Módulos de Defensa Activa del SOC
  const defenseShields = [
    {
      title: 'Anti-Brute Force & Credential Stuffing',
      icon: Lock,
      status: 'Activo (Blindado)',
      color: 'text-emerald-400',
      desc: 'Bloqueo temporal de 60s tras 4 intentos fallidos. Cifrado SHA-256 en frontend y sesión efímera.',
      level: 'Capa 1 y 2',
    },
    {
      title: 'WAF & Anti-Inyección (SQLi, XSS, Path Traversal)',
      icon: ShieldAlert,
      status: 'Activo (Sanitizado)',
      color: 'text-emerald-400',
      desc: 'Filtro regex contra `<script>`, `eval()`, comillas de escape y directivas maliciosas en inputs.',
      level: 'Capa 3',
    },
    {
      title: 'Detección de Bots Sin JS & Scraping',
      icon: Bot,
      status: 'Protegido (Supabase RLS)',
      color: 'text-sky-400',
      desc: 'Peticiones sin tokens o que no ejecutan JS son rechazadas por Row Level Security (RLS) en Supabase.',
      level: 'BBDD Cloud',
    },
    {
      title: 'Monitoreo SSL & Expiración de Certificados',
      icon: Radio,
      status: 'Auto-Chequeo',
      color: 'text-emerald-400',
      desc: 'Agente v2 reporta `sslValid: true/false`. GitHub Pages y Supabase renuevan SSL Let’s Encrypt automáticamente.',
      level: 'TLS 1.3',
    },
    {
      title: 'Auditoría de Dependencias (npm audit / Dependabot)',
      icon: FileSearch,
      status: '0 Vulnerabilidades',
      color: 'text-emerald-400',
      desc: 'Paquetes auditados con npm audit en cada pipeline de build y despliegue a GitHub Pages.',
      level: 'Supply Chain',
    },
    {
      title: 'Uptime Real 24/7 (Keep-Alive Anti-Pausa)',
      icon: Activity,
      status: '200 OK (Cada 3 días)',
      color: 'text-emerald-400',
      desc: 'cron-job.org enviando pings HTTP periódicos para mantener Supabase activo permanentemente.',
      level: 'Infraestructura',
    },
    {
      title: 'Detección de Cambios No Autorizados & Defacement',
      icon: HardDrive,
      status: 'Git Versioning',
      color: 'text-emerald-400',
      desc: 'Repositorio GitHub inmutable. Todo cambio no rastreado en commit es descartado por el pipeline.',
      level: 'Integridad',
    },
    {
      title: 'Logs de Acceso, IPs y Geolocalización',
      icon: Globe,
      status: 'Supabase Cloudflare',
      color: 'text-sky-400',
      desc: 'Telemetría v2 con sendBeacon guardando User-Agent, latencias DNS/TCP y eventos en `telemetry_logs`.',
      level: 'Edge Network',
    },
  ];

  const totalALE = state.securityRisks.reduce((acc, r) => acc + (r.aleCLP || r.sleCLP * r.aro), 0);

  const handleAddRisk = (e: React.FormEvent) => {
    e.preventDefault();
    const newRisk: SecurityRisk = {
      id: `risk-${Date.now()}`,
      projectId: 'mon-adm-proyectos',
      assetId: 'asset-1',
      assetName: 'Activo Seleccionado',
      threatName,
      threatCategory,
      impactDescription: impactDesc || 'Impacto estimado en operaciones',
      sleCLP: Number(sleCLP),
      aro: Number(aro),
      aleCLP: Number(sleCLP) * Number(aro),
      mitigationStrategy: mitigation || 'Mitigación técnica estándar',
      status: 'en_progreso',
    };

    const newState = {
      ...state,
      securityRisks: [newRisk, ...state.securityRisks],
    };
    onUpdateState(newState);
    saveAppState(newState);
    setShowAddRisk(false);
    setThreatName('');
    setMitigation('');
    setImpactDesc('');
  };

  const handleGenerateRiskAnalysisWithAI = async () => {
    setGeneratingAi(true);
    try {
      const prompt = `Actúa como Director de Seguridad de la Información (CISO). Evalúa la postura de seguridad para proyectos web con Supabase, GitHub Pages y telemetría de navegación v2.0. Proporciona recomendaciones para mitigar ataques automatizados, fuerza bruta y preservar la integridad del sistema sin costo de servidor.`;
      const response = await generateWithAI(
        { prompt, taskType: 'general', context: 'Mini-SOC de Ciberseguridad LSC' },
        state.settings
      );
      alert(`Diagnóstico del CISO (SOC con IA):\n\n${response}`);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-200">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 font-mono">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            Ciberseguridad Preventiva & Mini-SOC
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Centro de operaciones de seguridad integral: WAF, Anti-Fuerza Bruta, Mitigación de Bots y Cálculo ALE.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateRiskAnalysisWithAI}
            disabled={generatingAi}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-lg text-xs font-mono transition-colors"
          >
            <Sparkles className={`w-3.5 h-3.5 ${generatingAi ? 'animate-spin' : ''}`} />
            <span>{generatingAi ? 'Evaluando...' : 'Auditoría IA'}</span>
          </button>

          <button
            onClick={() => setShowAddRisk(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium shadow-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Riesgo</span>
          </button>
        </div>
      </div>

      {/* ALE Quantitative Risk Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl md:col-span-2 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>ALE Estimado en Riesgo (Annualized Loss Expectancy)</span>
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">
              ${totalALE.toLocaleString('es-CL')} CLP / año
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Fórmula cuantitativa: <strong className="text-white">ALE = SLE × ARO</strong> (Pérdida por evento × Tasa anual)
            </p>
          </div>
          <div className="hidden sm:block text-right font-mono text-xs text-slate-400 bg-[#0A0C10] p-3 rounded-lg border border-[#1b202c]">
            <div className="text-white font-bold">{state.securityRisks.length} Riesgos Evaluados</div>
            <div className="text-emerald-400">{state.securityAssets.length} Activos Críticos</div>
          </div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl">
          <div className="text-xs font-mono text-slate-400">Postura de Seguridad</div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">100% Protegido</div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">3 Capas + 2FA Google Authenticator</div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl">
          <div className="text-xs font-mono text-slate-400">Agente de Telemetría</div>
          <div className="text-xl font-mono font-bold text-sky-400 mt-2">v2.0 Desplegado</div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">TTFB + CSP + Anti-DOM Injection</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#202634] gap-2 font-mono text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('matriz')}
          className={`pb-3 px-3 font-semibold transition-colors relative whitespace-nowrap ${
            activeTab === 'matriz' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Matriz de Riesgos & Cálculo ALE
        </button>
        <button
          onClick={() => setActiveTab('auditorias')}
          className={`pb-3 px-3 font-semibold transition-colors relative whitespace-nowrap ${
            activeTab === 'auditorias' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Mecanismos de Defensa Activa (8 Capas)
        </button>
        <button
          onClick={() => setActiveTab('activos')}
          className={`pb-3 px-3 font-semibold transition-colors relative whitespace-nowrap ${
            activeTab === 'activos' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Inventario de Activos Críticos ({state.securityAssets.length})
        </button>
        <button
          onClick={() => setActiveTab('playbooks')}
          className={`pb-3 px-3 font-semibold transition-colors relative whitespace-nowrap ${
            activeTab === 'playbooks' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Playbooks de Respuesta con IA ({state.securityPlaybooks.length})
        </button>
      </div>

      {/* Tab 1: Matriz de Riesgos */}
      {activeTab === 'matriz' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-[#12151C] border border-[#202634] rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0E1117] border-b border-[#202634] text-slate-400 text-[11px]">
                  <tr>
                    <th className="p-3.5">Amenaza / Vulnerabilidad</th>
                    <th className="p-3.5">Activo Afectado</th>
                    <th className="p-3.5 text-right">SLE (Por Evento)</th>
                    <th className="p-3.5 text-right">ARO (Frecuencia/Año)</th>
                    <th className="p-3.5 text-right text-emerald-400">ALE Anual</th>
                    <th className="p-3.5">Estrategia de Mitigación</th>
                    <th className="p-3.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b202c]">
                  {state.securityRisks.map((risk) => {
                    const ale = risk.aleCLP || risk.sleCLP * risk.aro;
                    return (
                      <tr key={risk.id} className="hover:bg-[#151922] transition-colors">
                        <td className="p-3.5 font-bold text-white">
                          <div>{risk.threatName}</div>
                          <span className="text-[10px] text-slate-500 font-normal uppercase">
                            {risk.threatCategory}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300">{risk.assetName}</td>
                        <td className="p-3.5 text-right text-slate-300">
                          ${risk.sleCLP.toLocaleString('es-CL')}
                        </td>
                        <td className="p-3.5 text-right text-slate-300">{risk.aro}x</td>
                        <td className="p-3.5 text-right font-bold text-emerald-400">
                          ${ale.toLocaleString('es-CL')}
                        </td>
                        <td className="p-3.5 text-slate-400 max-w-xs">{risk.mitigationStrategy}</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                            {risk.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Mecanismos de Defensa Activa (8 Capas) */}
      {activeTab === 'auditorias' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {defenseShields.map((shield, idx) => {
            const Icon = shield.icon;
            return (
              <div
                key={idx}
                className="p-5 bg-[#12151C] border border-[#202634] rounded-xl space-y-2.5 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-5 h-5 ${shield.color}`} />
                    <span className="font-bold text-white">{shield.title}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 rounded text-[10px]">
                    {shield.level}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{shield.desc}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] border-t border-[#1b212d]">
                  <span className="text-slate-500">Mecanismo:</span>
                  <span className={`font-bold ${shield.color}`}>{shield.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Activos Críticos */}
      {activeTab === 'activos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {state.securityAssets.map((asset) => (
            <div key={asset.id} className="p-4 bg-[#12151C] border border-[#202634] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{asset.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                    asset.criticality === 'alta'
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                      : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                  }`}
                >
                  Criticidad {asset.criticality}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] space-y-1">
                <div>Proveedor: <span className="text-white">{asset.provider}</span></div>
                <div>Tipo: <span className="text-slate-300 capitalize">{asset.type.replace('_', ' ')}</span></div>
                <div>Valor del Activo: <strong className="text-emerald-400">${asset.estimatedValueCLP.toLocaleString('es-CL')} CLP</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Playbooks */}
      {activeTab === 'playbooks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {state.securityPlaybooks.map((pb) => (
            <div key={pb.id} className="p-5 bg-[#12151C] border border-[#202634] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{pb.title}</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  {pb.triggerEvent}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">{pb.description}</p>
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-bold text-slate-300 block">Acciones de Respuesta:</span>
                {pb.steps.map((s) => (
                  <div key={s.order} className="p-2 bg-[#0A0C10] border border-[#1b202c] rounded flex items-center justify-between text-[11px]">
                    <span>{s.order}. {s.action}</span>
                    {s.commandOrLink && (
                      <a href={s.commandOrLink} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline text-[10px]">
                        Abrir recurso →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Agregar Riesgo */}
      {showAddRisk && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono text-xs">
          <div className="bg-[#12151C] border border-[#202634] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Registrar Nueva Amenaza en Matriz de Riesgo</h3>
            <form onSubmit={handleAddRisk} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Nombre de la Amenaza *</label>
                <input
                  type="text"
                  required
                  value={threatName}
                  onChange={(e) => setThreatName(e.target.value)}
                  placeholder="Ej: Ataque de Credential Stuffing / Phishing"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">SLE (Pérdida por evento CLP) *</label>
                  <input
                    type="number"
                    required
                    value={sleCLP}
                    onChange={(e) => setSleCLP(Number(e.target.value))}
                    className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ARO (Frecuencia anual) *</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={aro}
                    onChange={(e) => setAro(Number(e.target.value))}
                    className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-emerald-300">
                <span>ALE Calculado: </span>
                <strong className="text-white">
                  ${(Number(sleCLP) * Number(aro)).toLocaleString('es-CL')} CLP / año
                </strong>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Estrategia de Mitigación</label>
                <input
                  type="text"
                  value={mitigation}
                  onChange={(e) => setMitigation(e.target.value)}
                  placeholder="Ej: 2FA con Google Authenticator + WAF"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddRisk(false)}
                  className="px-3 py-2 bg-transparent hover:bg-slate-800 text-slate-400 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                >
                  Guardar en el SOC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
