import React, { useState } from 'react';
import { ShieldAlert, Server, Database, CreditCard, Key, AlertOctagon, FileText, Sparkles, Plus, Calculator, CheckCircle2 } from 'lucide-react';
import { AppState, saveAppState } from '../../utils/storage';
import { SecurityAsset, SecurityRisk, SecurityPlaybook } from '../../types';
import { generateWithAI } from '../../services/aiService';

interface MiniSocViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

export const MiniSocView: React.FC<MiniSocViewProps> = ({ state, onUpdateState }) => {
  const [activeTab, setActiveTab] = useState<'matriz' | 'activos' | 'playbooks'>('matriz');
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

  const totalALE = state.securityRisks.reduce((acc, r) => acc + (r.aleCLP || r.sleCLP * r.aro), 0);

  const handleAddRisk = (e: React.FormEvent) => {
    e.preventDefault();
    const newRisk: SecurityRisk = {
      id: `risk-${Date.now()}`,
      projectId: 'mon-1',
      assetId: 'asset-1',
      assetName: 'Activo Principal',
      threatName,
      threatCategory,
      impactDescription: impactDesc || 'Impacto en operación',
      sleCLP: Number(sleCLP),
      aro: Number(aro),
      aleCLP: Number(sleCLP) * Number(aro),
      mitigationStrategy: mitigation || 'Mitigación estándar LSC',
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
      const prompt = `Genera una recomendación de mitigación preventiva para una tienda Shopify con Webpay y base de datos Supabase en Chile. Evalúa riesgos de caída, ataques DDoS a DNS y calculo estimado de Single Loss Expectancy (SLE) en CLP.`;
      const response = await generateWithAI(
        { prompt, taskType: 'general', context: 'Mini-SOC de Ciberseguridad LSC' },
        state.settings
      );
      alert(`Recomendación de Seguridad del SOC (IA):\n\n${response}`);
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
            Centro de operaciones de seguridad para supervisar riesgos en tus proyectos, calcular ALE y ejecutar playbooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateRiskAnalysisWithAI}
            disabled={generatingAi}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 rounded-lg text-xs font-mono transition-colors"
          >
            <Sparkles className={`w-3.5 h-3.5 ${generatingAi ? 'animate-spin' : ''}`} />
            <span>{generatingAi ? 'Analizando...' : 'Diagnóstico IA'}</span>
          </button>

          <button
            onClick={() => setShowAddRisk(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium shadow-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Amenaza / Riesgo</span>
          </button>
        </div>
      </div>

      {/* ALE Quantitative Risk Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl md:col-span-2 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>ALE Total en Cartera (Annualized Loss Expectancy)</span>
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">
              ${(totalALE).toLocaleString('es-CL')} CLP / año
            </div>
            <p className="text-[10px] font-mono text-slate-400 mt-1">
              Fórmula cuantitativa: <strong className="text-white">ALE = SLE × ARO</strong> (Pérdida por evento × Tasa anual de ocurrencia)
            </p>
          </div>
          <div className="hidden sm:block text-right font-mono text-xs text-slate-400 bg-[#0A0C10] p-3 rounded-lg border border-[#1b202c]">
            <div className="text-white font-bold">{state.securityRisks.length} Amenazas</div>
            <div className="text-emerald-400">{state.securityAssets.length} Activos Auditados</div>
          </div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl">
          <div className="text-xs font-mono text-slate-400">Estado de Mitigación</div>
          <div className="text-2xl font-mono font-bold text-sky-400 mt-2">83% Protegido</div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Cloudflare WAF + Backups activos</div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl">
          <div className="text-xs font-mono text-slate-400">Supabase Keep-Alive</div>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-2">Anti-Pausa Activo</div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Ping cada 3 días sin costo</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#202634] gap-2 font-mono text-xs">
        <button
          onClick={() => setActiveTab('matriz')}
          className={`pb-3 px-3 font-semibold transition-colors relative ${
            activeTab === 'matriz' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Matriz de Riesgos & Cálculo ALE
        </button>
        <button
          onClick={() => setActiveTab('activos')}
          className={`pb-3 px-3 font-semibold transition-colors relative ${
            activeTab === 'activos' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Inventario de Activos Críticos ({state.securityAssets.length})
        </button>
        <button
          onClick={() => setActiveTab('playbooks')}
          className={`pb-3 px-3 font-semibold transition-colors relative ${
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
                    <th className="p-3.5 text-right">ALE Anual (CLP)</th>
                    <th className="p-3.5">Estrategia de Mitigación</th>
                    <th className="p-3.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b202c]">
                  {state.securityRisks.map((risk) => (
                    <tr key={risk.id} className="hover:bg-[#161a24] transition-colors">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                        <span>{risk.threatName}</span>
                      </td>
                      <td className="p-3.5 text-slate-300">{risk.assetName}</td>
                      <td className="p-3.5 text-right text-slate-300 font-bold">
                        ${(risk.sleCLP).toLocaleString('es-CL')}
                      </td>
                      <td className="p-3.5 text-right text-slate-400">{risk.aro}x/año</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">
                        ${(risk.aleCLP || risk.sleCLP * risk.aro).toLocaleString('es-CL')}
                      </td>
                      <td className="p-3.5 text-slate-400 max-w-xs">{risk.mitigationStrategy}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            risk.status === 'mitigado'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                          }`}
                        >
                          {risk.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Inventario de Activos Críticos */}
      {activeTab === 'activos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {state.securityAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-[#12151C] border border-[#202634] p-5 rounded-xl space-y-3 hover:border-[#2f394c] transition-colors"
            >
              <div className="flex items-center justify-between border-b border-[#202634] pb-3">
                <div className="flex items-center gap-2">
                  {asset.type === 'dominio_dns' && <Server className="w-4 h-4 text-emerald-400" />}
                  {asset.type === 'base_de_datos' && <Database className="w-4 h-4 text-sky-400" />}
                  {asset.type === 'pasarela_pago' && <CreditCard className="w-4 h-4 text-amber-400" />}
                  {asset.type === 'servidor_hosting' && <Server className="w-4 h-4 text-purple-400" />}
                  <span className="font-bold text-white text-sm">{asset.name}</span>
                </div>
                <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800/40 font-bold">
                  {asset.criticality.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div>
                  <span className="text-slate-500">Proveedor: </span>
                  <span className="text-slate-200">{asset.provider}</span>
                </div>
                <div>
                  <span className="text-slate-500">Valor Estimado Activo: </span>
                  <span className="text-emerald-400 font-bold">
                    ${(asset.estimatedValueCLP).toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Playbooks con IA */}
      {activeTab === 'playbooks' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.securityPlaybooks.map((pb) => (
              <div
                key={pb.id}
                onClick={() => setSelectedPlaybook(pb)}
                className="bg-[#12151C] border border-[#202634] hover:border-emerald-500/50 p-5 rounded-xl space-y-3 cursor-pointer transition-all hover:translate-y-[-2px]"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <FileText className="w-4 h-4" />
                  <span>{pb.title}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{pb.description}</p>
                <div className="pt-2 border-t border-[#202634] flex items-center justify-between text-[10px] text-slate-500">
                  <span>Disparador: {pb.triggerEvent}</span>
                  <span className="text-emerald-400 font-bold">Ver Pasos &rarr;</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Playbook Viewer */}
          {selectedPlaybook && (
            <div className="bg-[#12151C] border border-emerald-500/30 p-6 rounded-2xl space-y-4 mt-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#202634] pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {selectedPlaybook.title}
                  </h3>
                  <p className="text-slate-400 text-[11px] mt-0.5">{selectedPlaybook.description}</p>
                </div>
                <button
                  onClick={() => setSelectedPlaybook(null)}
                  className="px-3 py-1 bg-[#0A0C10] hover:bg-slate-800 text-slate-400 rounded-lg text-xs"
                >
                  Cerrar Playbook
                </button>
              </div>

              <div className="space-y-3">
                {selectedPlaybook.steps.map((st) => (
                  <div key={st.order} className="flex items-start gap-3 p-3 bg-[#0A0C10] rounded-xl border border-[#1b202c]">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-800/40">
                      {st.order}
                    </span>
                    <span className="text-slate-200 text-xs leading-relaxed">{st.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Add Risk */}
      {showAddRisk && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#12151C] border border-[#202634] p-6 rounded-2xl w-full max-w-md space-y-4 font-mono text-xs">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-emerald-400" />
              Nueva Amenaza y Cálculo ALE
            </h2>

            <form onSubmit={handleAddRisk} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Nombre de la Amenaza *</label>
                <input
                  type="text"
                  required
                  value={threatName}
                  onChange={(e) => setThreatName(e.target.value)}
                  placeholder="Ej: Ataque de fuerza bruta a wp-login o /admin"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">SLE en CLP (Pérdida/Evento) *</label>
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
                    step="0.1"
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
                  placeholder="Ej: 2FA obligatorio + Cloudflare Rate Limiting"
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
