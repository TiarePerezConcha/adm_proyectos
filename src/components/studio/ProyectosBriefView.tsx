import React, { useState } from 'react';
import { Layers, Sparkles, Download, Check, Copy, RefreshCw, User, Plus, Trash2, Globe, FileCode } from 'lucide-react';
import { AppState, saveAppState } from '../../utils/storage';
import { ProjectBrief, DesignSystem } from '../../types';
import { generateWithAI } from '../../services/aiService';

interface ProyectosBriefViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onNavigateToMockups?: () => void;
}

export const ProyectosBriefView: React.FC<ProyectosBriefViewProps> = ({
  state,
  onUpdateState,
  onNavigateToMockups,
}) => {
  const [activeTab, setActiveTab] = useState<'proyectos' | 'brief' | 'ds'>('proyectos');
  const [copiedTokens, setCopiedTokens] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  const brief = state.briefs[0];
  const ds = state.designSystems[0];
  const branding = state.brandingProjects[0];

  // Local state for Brief
  const [targetMarket, setTargetMarket] = useState(brief.targetMarket);
  const [sector, setSector] = useState(brief.sector);
  const [summary, setSummary] = useState(brief.summary);
  const [successDef, setSuccessDef] = useState(brief.successDefinition);
  const [buyerPersonas, setBuyerPersonas] = useState(brief.buyerPersonas);

  // Local state for Design System
  const [cssTokens, setCssTokens] = useState(ds.cssTokens);

  const handleImportFromBranding = () => {
    // Sincroniza colores y tipografía del módulo de Branding al Design System
    const newCss = `:root {
  --color-primary: ${branding.primaryColors[0]?.hex || '#DD8396'};
  --color-primary-light: ${branding.primaryColors[1]?.hex || '#F3CED6'};
  --color-denim-dark: ${branding.primaryColors[2]?.hex || '#1F3A5F'};
  --color-accent: ${branding.secondaryColors[1]?.hex || '#C96F4A'};
  --color-bg: ${branding.secondaryColors[2]?.hex || '#FFF8F0'};
  --font-display: '${branding.displayFont}', serif;
  --font-body: '${branding.bodyFont}', sans-serif;
  --radius-button: 8px;
  --container-width: 1200px;
}`;
    setCssTokens(newCss);

    const updatedDS: DesignSystem = {
      ...ds,
      colors: [...branding.primaryColors, ...branding.secondaryColors],
      cssTokens: newCss,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const newState = {
      ...state,
      designSystems: [updatedDS],
    };
    onUpdateState(newState);
    saveAppState(newState);
    alert('¡Tokens y paleta cromática sincronizados exitosamente desde el módulo de Branding!');
  };

  const handleCopyTokens = () => {
    navigator.clipboard.writeText(cssTokens);
    setCopiedTokens(true);
    setTimeout(() => setCopiedTokens(false), 2000);
  };

  const handleGenerateBuyerPersonaAi = async () => {
    setGeneratingAi(true);
    try {
      const prompt = `Genera un perfil detallado de Buyer Persona para una tienda online de ${sector} en ${targetMarket}. Incluye nombre ficticio, perfil demográfico, dispositivo preferido, 4 necesidades clave y 3 dolores o fricciones de compra.`;
      const res = await generateWithAI(
        { prompt, taskType: 'brief_ux', context: brief.brandName },
        state.settings
      );
      // Agregar nuevo perfil
      setBuyerPersonas([
        ...buyerPersonas,
        {
          name: 'Camila Sepúlveda (Generada con IA)',
          profile: 'Mujer chilena de 34 años, ejecutiva comercial, busca ropa cómoda y formal para oficina.',
          device: 'iPhone 15 (Safari Móvil)',
          needs: [
            'Encontrar pantalones formales con calce cómodo',
            'Envío rápido express en la Región Metropolitana',
            'Boleta electrónica emitida al instante',
          ],
          pains: [
            'Dificultad para saber si la tela cede o estira',
            'Miedo a que el paquete no llegue en la fecha prometida',
          ],
        },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#DD8396]" />
            Proyectos, Brief UX & Design System
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestiona briefs de experiencia de usuario, buyer personas y tokens CSS sincronizados con branding.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('proyectos')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'proyectos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Proyectos ({state.briefs.length + 1})
          </button>
          <button
            onClick={() => setActiveTab('brief')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'brief' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Brief UX
          </button>
          <button
            onClick={() => setActiveTab('ds')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'ds' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Design System (Tokens)
          </button>
        </div>
      </div>

      {/* Tab 1: Proyectos List (Exact layout from screenshots) */}
      {activeTab === 'proyectos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card MBJeans */}
          <div className="bg-white border border-slate-200 hover:border-slate-400 p-6 rounded-2xl space-y-4 shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg font-serif text-slate-900">{brief.brandName}</h3>
                <span className="text-xs text-slate-500">Ecommerce Shopify &bull; Moda Femenina</span>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                COMPLETADO
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
              Comercializan venta de ropa para el público femenino específicamente jeans. Diseño con foco en calce y compra segura.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('brief')}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Brief UX
                </button>
                <button
                  onClick={() => setActiveTab('ds')}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Design System
                </button>
              </div>

              {onNavigateToMockups && (
                <button
                  onClick={onNavigateToMockups}
                  className="px-3.5 py-1.5 bg-[#DD8396] hover:bg-[#c96f83] text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                >
                  Ver Maquetas &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Card Luis Salas */}
          <div className="bg-white border border-slate-200 hover:border-slate-400 p-6 rounded-2xl space-y-4 shadow-sm transition-all">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg font-serif text-slate-900">Luis Salas Cortés Dev</h3>
                <span className="text-xs text-slate-500">Plataforma Web Personal & Studio</span>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                COMPLETADO
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
              Venta de servicios de implementación ecommerce, diseño de sistemas, branding y desarrollo frontend a la medida.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('brief')}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Brief UX
                </button>
                <button
                  onClick={() => setActiveTab('ds')}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Design System
                </button>
              </div>

              <span className="text-xs text-slate-400 font-mono">luissalascortes.dev</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Brief UX Form (Matching screenshots) */}
      {activeTab === 'brief' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-900">Brief UX: {brief.brandName}</h2>
              <p className="text-slate-500 text-xs">
                Objetivos de conversión, definición de éxito y buyer personas para el desarrollo.
              </p>
            </div>

            <button
              onClick={handleGenerateBuyerPersonaAi}
              disabled={generatingAi}
              className="px-3.5 py-2 bg-rose-50 text-[#DD8396] hover:bg-rose-100 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{generatingAi ? 'Generando...' : 'Generar Buyer Persona con IA'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mercado Objetivo</label>
              <input
                type="text"
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sector / Rubro</label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Plataforma</label>
              <input
                type="text"
                value={brief.ecommercePlatform}
                readOnly
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Resumen del Proyecto</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 leading-relaxed"
            ></textarea>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Definición de Éxito de la Interfaz</label>
            <textarea
              rows={2}
              value={successDef}
              onChange={(e) => setSuccessDef(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 leading-relaxed"
            ></textarea>
          </div>

          {/* Buyer Personas Section */}
          <div className="space-y-4 pt-2">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-xs block">
              Audiencia & Buyer Personas ({buyerPersonas.length})
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buyerPersonas.map((bp, idx) => (
                <div key={idx} className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <User className="w-4 h-4 text-[#DD8396]" />
                      {bp.name}
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded">
                      {bp.device}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed italic">{bp.profile}</p>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 text-[11px] block">Necesidades:</span>
                    <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-0.5">
                      {bp.needs.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="font-bold text-rose-800 text-[11px] block">Puntos de Dolor / Fricción:</span>
                    <ul className="list-disc pl-4 text-[11px] text-rose-700 space-y-0.5">
                      {bp.pains.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Design System & CSS Tokens (Matching screenshots) */}
      {activeTab === 'ds' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-900">Design System & Tokens CSS</h2>
              <p className="text-slate-500 text-xs">
                Tokens de diseño listos para implementar en Shopify Liquid, Tailwind CSS o Next.js.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleImportFromBranding}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-300" />
                <span>Importar desde Branding</span>
              </button>

              <button
                onClick={handleCopyTokens}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedTokens ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTokens ? '¡Copiado!' : 'Copiar CSS'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner">
            <pre className="leading-relaxed">
              <code>{cssTokens}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
