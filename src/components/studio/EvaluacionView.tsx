import React, { useState } from 'react';
import { ClipboardCheck, Sparkles, CheckCircle, ArrowRight, ArrowLeft, Building, Globe, Server, Database, ShieldAlert } from 'lucide-react';
import { AppState, syncDealStage, saveAppState } from '../../utils/storage';
import { ProspectEvaluation, Client, CRMDeal } from '../../types';
import { generateWithAI } from '../../services/aiService';
import { syncEvaluationToSupabase, syncClientToSupabase, syncDealToSupabase } from '../../services/supabaseSyncService';

interface EvaluacionViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onNavigateToQuote?: (clientId: string) => void;
}

export const EvaluacionView: React.FC<EvaluacionViewProps> = ({ state, onUpdateState, onNavigateToQuote }) => {
  const [selectedEval, setSelectedEval] = useState<ProspectEvaluation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState('Chile');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [source, setSource] = useState('Google Search / SEO');

  // Step 2: Diagnóstico & Viabilidad
  const [businessModel, setBusinessModel] = useState<'b2c_ecommerce' | 'b2b_servicios' | 'gestion_interna' | 'saas'>('b2c_ecommerce');
  const [currentPlatform, setCurrentPlatform] = useState('Instagram / WhatsApp');
  const [monthlySales, setMonthlySales] = useState(3000000);
  const [foda, setFoda] = useState({
    fortalezas: ['Marca reconocida en nicho', 'Atención directa'],
    oportunidades: ['Centralizar compras en tienda online', 'Campañas digitales'],
    debilidades: ['Atención manual por chat lenta', 'Sin control de inventario'],
    amenazas: ['Competencia con envíos rápidos'],
  });
  const [pestel, setPestel] = useState({
    politico: 'Estabilidad de comercio electrónico',
    economico: 'Mercado activo en compras online',
    social: 'Preferencia por Webpay / débito',
    tecnologico: 'Tráfico 85% smartphone',
    ecologico: 'Interés en empaque reciclable',
    legal: 'Cumplimiento boleta SII',
  });
  const [viabilityDecision, setViabilityDecision] = useState<'go_viable' | 'go_con_ajustes' | 'no_go'>('go_viable');
  const [viabilityRationale, setViabilityRationale] = useState('Proyecto altamente viable. Retorno sobre la inversión claro en menos de 60 días.');

  // Step 3: Infraestructura
  const [nicCostCLP, setNicCostCLP] = useState(9990);
  const [hostingOption, setHostingOption] = useState('TecnoInver Hosting Chile ($30.000/año)');
  const [hostingCostCLP, setHostingCostCLP] = useState(30000);
  const [databaseOption, setDatabaseOption] = useState('Supabase Free Tier (Keep-alive programado)');
  const [architectureType, setArchitectureType] = useState<'monolito' | 'microservicios' | 'serverless_jamstack'>('monolito');

  // Step 4: Score
  const [scoreLevel, setScoreLevel] = useState<'Prospecto A (Prioritario)' | 'Prospecto B (Viable)' | 'Prospecto C (Riesgoso)'>('Prospecto A (Prioritario)');
  const [totalBudget, setTotalBudget] = useState(850000);

  const handleGenerateFodaWithAi = async () => {
    setGeneratingAi(true);
    try {
      const prompt = `Genera un análisis FODA y PESTEL conciso y una evaluación de viabilidad para un cliente de rubro: ${businessModel}, plataforma actual: ${currentPlatform}, empresa: ${company || 'Ecommerce Chile'}. Determina si el proyecto es conveniente desarrollar y el porqué.`;
      const aiResponse = await generateWithAI(
        { prompt, taskType: 'foda_pestel', context: company },
        state.settings
      );
      setViabilityRationale(aiResponse);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSaveEvaluation = () => {
    const newEvalId = `eval-${Date.now()}`;
    let clientId = `cli-${Date.now()}`;

    // Buscar o crear cliente
    const existingClient = state.clients.find((c) => c.email.toLowerCase() === email.toLowerCase());
    let newClients = state.clients;
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      newClients = [
        ...state.clients,
        {
          id: clientId,
          name: clientName,
          company: company || clientName,
          email,
          phone,
          country,
          source,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ];
    }

    const newEval: ProspectEvaluation = {
      id: newEvalId,
      clientId,
      clientName,
      company: company || clientName,
      country,
      email,
      phone,
      source,
      businessModel,
      currentPlatform,
      estimatedMonthlySalesCLP: monthlySales,
      foda,
      pestel,
      viabilityDecision,
      viabilityRationale,
      nicCostCLP,
      hostingOption,
      hostingCostCLP,
      databaseOption,
      databaseCostCLP: 0,
      architectureType,
      securityTier: 'esencial_cloudflare',
      scoreLevel,
      totalEstimatedBudgetCLP: totalBudget,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    // ACCIÓN AUTOMÁTICA AL CRM: Mover deal a 'en_evaluacion'
    const updatedDeals = syncDealStage(state.deals, clientId, 'en_evaluacion', {
      clientName,
      company: company || clientName,
      email,
      phone,
      title: `Evaluación de ${company || clientName}`,
      valueCLP: totalBudget,
      evaluationId: newEvalId,
    });

    const newState = {
      ...state,
      clients: newClients,
      evaluations: [newEval, ...state.evaluations],
      deals: updatedDeals,
    };

    onUpdateState(newState);
    saveAppState(newState);
    setIsCreating(false);
    setCurrentStep(1);
    setSelectedEval(newEval);

    // Sincronización en la nube Supabase
    syncEvaluationToSupabase(newEval);
    const affectedClient = newClients.find((c) => c.id === clientId);
    if (affectedClient) syncClientToSupabase(affectedClient);
    const affectedDeal = updatedDeals.find((d) => d.clientId === clientId);
    if (affectedDeal) syncDealToSupabase(affectedDeal);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Header matching screenshots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#DD8396]" />
            Evaluación de Prospecto
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filtra prospectos por nivel de viabilidad, costos de infraestructura y riesgo antes de invertir tiempo.
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => {
              setIsCreating(true);
              setSelectedEval(null);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start"
          >
            + Nueva Evaluación
          </button>
        )}
      </div>

      {/* List of Existing Evaluations */}
      {!isCreating && !selectedEval && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.evaluations.map((ev) => (
            <div
              key={ev.id}
              onClick={() => setSelectedEval(ev)}
              className="bg-white border border-slate-200 hover:border-slate-400 p-5 rounded-xl space-y-3 cursor-pointer transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-[#DD8396] transition-colors">
                    {ev.clientName}
                  </h3>
                  <span className="text-xs text-slate-500">{ev.company}</span>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                  {ev.scoreLevel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400">Modelo: </span>
                  <span className="font-medium text-slate-700">{ev.businessModel}</span>
                </div>
                <div>
                  <span className="text-slate-400">Presupuesto Sugerido: </span>
                  <span className="font-bold text-slate-900">${(ev.totalEstimatedBudgetCLP).toLocaleString('es-CL')} CLP</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50">
                <span>{ev.createdAt}</span>
                <span className="text-[#DD8396] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Ver detalle completo &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Viewer */}
      {selectedEval && !isCreating && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <button
                onClick={() => setSelectedEval(null)}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-2 font-medium"
              >
                &larr; Volver al listado
              </button>
              <h2 className="text-xl font-bold font-serif text-slate-900">
                {selectedEval.clientName} &bull; {selectedEval.company}
              </h2>
            </div>

            {onNavigateToQuote && (
              <button
                onClick={() => onNavigateToQuote(selectedEval.clientId)}
                className="px-4 py-2 bg-[#DD8396] hover:bg-[#c96f83] text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
              >
                Generar Cotización Express &rarr;
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Calificación</span>
              <div className="text-sm font-bold text-emerald-700">{selectedEval.scoreLevel}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Decisión de Viabilidad</span>
              <div className="text-sm font-bold text-slate-900">{selectedEval.viabilityDecision.toUpperCase()}</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Presupuesto Estimado</span>
              <div className="text-sm font-bold text-slate-900">
                ${(selectedEval.totalEstimatedBudgetCLP).toLocaleString('es-CL')} CLP
              </div>
            </div>
          </div>

          <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-900">Dictamen Estratégico (IA & Viabilidad):</span>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{selectedEval.viabilityRationale}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="font-bold text-slate-900 block">Infraestructura Proyectada:</span>
              <div>NIC Chile: <strong className="text-slate-800">${selectedEval.nicCostCLP.toLocaleString('es-CL')} CLP/año</strong></div>
              <div>Hosting: <strong className="text-slate-800">{selectedEval.hostingOption}</strong></div>
              <div>Base de Datos: <strong className="text-slate-800">{selectedEval.databaseOption}</strong></div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="font-bold text-slate-900 block">Datos de Contacto:</span>
              <div>Email: <span className="text-slate-700">{selectedEval.email}</span></div>
              <div>Teléfono: <span className="text-slate-700">{selectedEval.phone}</span></div>
              <div>Canal de Entrada: <span className="text-slate-700">{selectedEval.source}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* 4-Step Creation Wizard (matching screenshots) */}
      {isCreating && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-1"
              >
                &larr; Cancelar y volver
              </button>
              <h2 className="text-xl font-bold font-serif text-slate-900">Nueva evaluación de prospecto</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Completa las 4 fases para obtener un score automático, viabilidad y recomendación de IA.
              </p>
            </div>

            {/* Stepper indicator */}
            <div className="flex items-center gap-2 font-mono text-xs">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    currentStep === step
                      ? 'bg-slate-900 text-white'
                      : currentStep > step
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
              ))}
            </div>
          </div>

          {/* FASE 1: Contacto */}
          {currentStep === 1 && (
            <div className="space-y-4 max-w-xl">
              <h3 className="font-serif font-bold text-base text-slate-900">1. Datos del prospecto</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del contacto *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Marcelo Díaz"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa / marca *</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ej: MBJeans"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">País / mercado</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">¿Cómo llegó?</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="Google Search / SEO">Google Search / SEO</option>
                    <option value="Google Calendar / Meet">Google Calendar / Meet</option>
                    <option value="Instagram / Redes">Instagram / Redes</option>
                    <option value="Referido">Referido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@ejemplo.cl"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!clientName || !company}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-40"
                >
                  <span>Siguiente: Diagnóstico</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* FASE 2: Diagnóstico & Viabilidad */}
          {currentStep === 2 && (
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-slate-900">2. Diagnóstico & Viabilidad</h3>
                <button
                  type="button"
                  onClick={handleGenerateFodaWithAi}
                  disabled={generatingAi}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-[#DD8396] hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingAi ? 'Analizando...' : 'Generar FODA & Viabilidad con IA'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo de Negocio</label>
                  <select
                    value={businessModel}
                    onChange={(e) => setBusinessModel(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900 bg-white"
                  >
                    <option value="b2c_ecommerce">E-Commerce B2C (Moda, Retail)</option>
                    <option value="b2b_servicios">B2B / Servicios Corporativos</option>
                    <option value="gestion_interna">Gestión Interna / Backoffice ERP</option>
                    <option value="saas">SaaS / Aplicación Web</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plataforma Actual</label>
                  <input
                    type="text"
                    value={currentPlatform}
                    onChange={(e) => setCurrentPlatform(e.target.value)}
                    placeholder="Ej: Shopify, WooCommerce, Ninguna"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decisión de Viabilidad Estratégica</label>
                <select
                  value={viabilityDecision}
                  onChange={(e) => setViabilityDecision(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900 bg-white font-semibold"
                >
                  <option value="go_viable">GO (Proyecto Viable y Conveniente de Desarrollar)</option>
                  <option value="go_con_ajustes">GO CON AJUSTES (Requiere acotar alcance)</option>
                  <option value="no_go">NO GO (No conveniente o inviable en presupuesto)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fundamento del Análisis</label>
                <textarea
                  rows={4}
                  value={viabilityRationale}
                  onChange={(e) => setViabilityRationale(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900 leading-relaxed"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <span>Siguiente: Infraestructura</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* FASE 3: Infraestructura & Costos */}
          {currentStep === 3 && (
            <div className="space-y-4 max-w-xl">
              <h3 className="font-serif font-bold text-base text-slate-900">3. Necesidad & Infraestructura</h3>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Dominio NIC Chile (.cl):</span>
                  <span className="font-bold text-slate-900">${nicCostCLP.toLocaleString('es-CL')} CLP/año</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600 font-medium">Hosting Sugerido</label>
                  <select
                    value={hostingOption}
                    onChange={(e) => {
                      setHostingOption(e.target.value);
                      if (e.target.value.includes('30.000')) setHostingCostCLP(30000);
                      else if (e.target.value.includes('Cloudflare')) setHostingCostCLP(0);
                      else setHostingCostCLP(75000);
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="TecnoInver Hosting Chile ($30.000/año)">TecnoInver Hosting Chile ($30.000 CLP/año)</option>
                    <option value="Cloudflare Pages / GitHub Pages (Cero Costo)">Cloudflare Pages / GitHub Pages (100% Gratis)</option>
                    <option value="VPS Hetzner / Vultr ($75.000/año)">VPS Cloud Hetzner ($75.000 CLP/año)</option>
                    <option value="Shopify Cloud (Incluido en Plan)">Shopify Cloud (Incluido en suscripción)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600 font-medium">Base de Datos</label>
                  <select
                    value={databaseOption}
                    onChange={(e) => setDatabaseOption(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="Supabase Free Tier (Keep-alive programado)">Supabase Free Tier (Keep-Alive Activo cada 3 días - $0)</option>
                    <option value="Firebase Firestore Free Tier">Firebase Firestore (Capa Gratuita - $0)</option>
                    <option value="Cloudflare D1 SQL Serverless">Cloudflare D1 SQL (100% Gratis)</option>
                    <option value="Neon Serverless Postgres">Neon Serverless Postgres (Free Tier - $0)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600 font-medium">Tipo de Arquitectura</label>
                  <select
                    value={architectureType}
                    onChange={(e) => setArchitectureType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="monolito">Monolito (Rápido, simple y de menor costo inicial)</option>
                    <option value="microservicios">Microservicios (Alta concurrencia y desacoplamiento)</option>
                    <option value="serverless_jamstack">Serverless / Jamstack (Escalabilidad automática gratuita)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <span>Siguiente: Score Final</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* FASE 4: Score & Guardado */}
          {currentStep === 4 && (
            <div className="space-y-4 max-w-xl">
              <h3 className="font-serif font-bold text-base text-slate-900">4. Señales, Presupuesto & Score</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clasificación Multidimensional</label>
                <select
                  value={scoreLevel}
                  onChange={(e) => setScoreLevel(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900 bg-white font-bold text-emerald-800"
                >
                  <option value="Prospecto A (Prioritario)">Prospecto A (Alta Prioridad & Viabilidad Confirmada)</option>
                  <option value="Prospecto B (Viable)">Prospecto B (Viable con Ajustes de Alcance)</option>
                  <option value="Prospecto C (Riesgoso)">Prospecto C (Riesgoso / Requiere refinamiento)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Presupuesto Sugerido del Proyecto (CLP)</label>
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900 font-bold text-slate-900"
                />
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Automatización Reactiva al CRM</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Al guardar esta evaluación, el prospecto avanzará automáticamente en el tablero CRM a la etapa{' '}
                  <strong className="text-slate-900">&quot;En Evaluación & Viabilidad&quot;</strong>.
                </p>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveEvaluation}
                  className="px-6 py-2.5 bg-[#DD8396] hover:bg-[#c96f83] text-white rounded-lg text-xs font-bold shadow-md transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Guardar Evaluación Completa</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
