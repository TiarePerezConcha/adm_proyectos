import React, { useState } from 'react';
import { Sparkles, Check, CheckCircle2, Download, RefreshCw, Upload, Eye, Layers, Palette, FileText, Share2, Award, Briefcase, Mail } from 'lucide-react';
import { AppState, saveAppState } from '../../utils/storage';
import { BrandingProject, LogoCandidate, ColorToken } from '../../types';
import { generateWithAI } from '../../services/aiService';

interface BrandingViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

export const BrandingView: React.FC<BrandingViewProps> = ({ state, onUpdateState }) => {
  const project = state.brandingProjects[0];
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<'contenido' | 'visuales' | 'entregables'>('contenido');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [customLogoName, setCustomLogoName] = useState('');

  // Local state for editable fields
  const [brandName, setBrandName] = useState(project.brandName);
  const [tagline, setTagline] = useState(project.tagline);
  const [vision, setVision] = useState(project.vision);
  const [mision, setMision] = useState(project.mision);
  const [historia, setHistoria] = useState(project.historia);
  const [whitespace, setWhitespace] = useState(project.whitespaceCompetitivo);
  const [semiotico, setSemiotico] = useState(project.analisisSemiotico);
  const [arquetipo, setArquetipo] = useState(project.arquetipo);
  const [propuestaValor, setPropuestaValor] = useState(project.propuestaValor);
  const [manifiesto, setManifiesto] = useState(project.manifiesto);

  const [logos, setLogos] = useState<LogoCandidate[]>(project.logos);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>(project.winningLogoId || 'logo-opt-3');

  const handleSelectWinner = (logoId: string) => {
    setSelectedWinnerId(logoId);
    const updatedLogos = logos.map((l) => ({
      ...l,
      selected: l.id === logoId,
    }));
    setLogos(updatedLogos);

    const updatedProject: BrandingProject = {
      ...project,
      logos: updatedLogos,
      winningLogoId: logoId,
    };
    const newState = {
      ...state,
      brandingProjects: [updatedProject],
    };
    onUpdateState(newState);
    saveAppState(newState);
  };

  const handleGenerateStepWithAI = async (stepNumber: number) => {
    setGeneratingAi(true);
    try {
      if (stepNumber === 1) {
        const prompt = `Genera el Whitespace competitivo y análisis semiótico para la marca ${brandName} en Chile. Nicho: moda/jeans femeninos.`;
        const res = await generateWithAI({ prompt, taskType: 'copywriting', context: brandName }, state.settings);
        setWhitespace(res);
      } else if (stepNumber === 3) {
        const prompt = `Genera un manifiesto de marca inspirador y un tagline de alto impacto para ${brandName}.`;
        const res = await generateWithAI({ prompt, taskType: 'copywriting', context: brandName }, state.settings);
        setManifiesto(res);
      } else if (stepNumber === 4) {
        // Nueva iteración de logos
        const newLogo: LogoCandidate = {
          id: `logo-ai-${Date.now()}`,
          iteration: 3,
          conceptName: 'Monograma Minimalista Moderno',
          meaning: 'Líneas limpias que conectan la M y la B en un trazo continuo de confianza y diseño.',
          essence: 'Elegancia contemporánea y calce perfecto sin ornamentos excesivos.',
          selected: false,
          svgCode: `<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg"><circle cx="150" cy="55" r="42" fill="none" stroke="#DD8396" stroke-width="2"/><text x="150" y="65" font-family="'Playfair Display', serif" font-size="34" font-weight="700" fill="#1F3A5F" text-anchor="middle">M&amp;B</text><text x="150" y="105" font-family="'Inter', sans-serif" font-size="12" letter-spacing="8" fill="#4A6D8C" text-anchor="middle">JEANS</text></svg>`,
        };
        setLogos([...logos, newLogo]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingAi(false);
    }
  };

  const winningLogo = logos.find((l) => l.id === selectedWinnerId) || logos[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Header matching screenshots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs text-slate-400 font-mono block">&larr; Volver a Branding</span>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
            <Sparkles className="w-6 h-6 text-[#DD8396]" />
            Branding {brandName}
          </h1>
          <span className="text-xs text-slate-500 font-medium">Identidad de marca integral con IA en 6 etapas</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Brand Book generado y listo para exportar en PDF / ZIP completo.')}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>
          <button
            onClick={() => alert('¡Identidad de marca guardada en LocalStorage!')}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* Main Layout: 6-Step Vertical Nav on Left + Content Area on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Step List Nav (Exact match from screenshots) */}
        <div className="space-y-1 font-serif text-sm">
          {[
            { num: 1, label: 'Discovery', desc: 'Investigación y análisis de mercado' },
            { num: 2, label: 'Estrategia', desc: 'Brand Prism, arquitectura, arquetipo' },
            { num: 3, label: 'Identidad Verbal', desc: 'Tagline, tono de voz, manifiesto' },
            { num: 4, label: 'Logos', desc: '3 iteraciones de variantes vectoriales' },
            { num: 5, label: 'Sistema Visual', desc: 'Paleta HEX, WCAG 2.1 AA, tipografía' },
            { num: 6, label: 'Aplicaciones', desc: 'Mockups tarjetas, hojas, firma, Brand Book' },
          ].map((st) => (
            <button
              key={st.num}
              onClick={() => setCurrentStep(st.num)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                currentStep === st.num
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                  currentStep === st.num ? 'bg-[#DD8396] text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {st.num}
              </span>
              <div>
                <span className="font-bold block leading-snug font-sans text-xs">{st.label}</span>
                <span className={`text-[11px] block leading-tight font-sans ${currentStep === st.num ? 'text-slate-300' : 'text-slate-400'}`}>
                  {st.desc}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Content Panel for Current Step */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* ETAPA 1: Discovery */}
          {currentStep === 1 && (
            <div className="space-y-6 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-serif text-slate-900">Discovery</h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Punto de partida del branding. Aquí se investiga el mercado, define audiencia y audita la competencia.
                  </p>
                </div>
                <button
                  onClick={() => handleGenerateStepWithAI(1)}
                  disabled={generatingAi}
                  className="px-3.5 py-2 bg-rose-50 text-[#DD8396] hover:bg-rose-100 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingAi ? 'Analizando...' : 'Generar con IA'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Visión de la Marca</label>
                  <textarea
                    rows={3}
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 leading-relaxed focus:outline-none focus:border-slate-900"
                  ></textarea>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Misión</label>
                  <textarea
                    rows={3}
                    value={mision}
                    onChange={(e) => setMision(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 leading-relaxed focus:outline-none focus:border-slate-900"
                  ></textarea>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Historia de Marca</label>
                <textarea
                  rows={2}
                  value={historia}
                  onChange={(e) => setHistoria(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 leading-relaxed focus:outline-none focus:border-slate-900"
                ></textarea>
              </div>

              {/* Whitespace competitivo IA */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#DD8396]" />
                  Whitespace Competitivo (Detectado con IA):
                </span>
                <p className="text-slate-700 leading-relaxed">{whitespace}</p>
              </div>

              {/* Análisis semiótico */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#DD8396]" />
                  Análisis Semiótico en el Mercado Chileno:
                </span>
                <p className="text-slate-700 leading-relaxed">{semiotico}</p>
              </div>
            </div>
          )}

          {/* ETAPA 2: Estrategia (Prisma Kapferer, Arquetipo, FODA) */}
          {currentStep === 2 && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold font-serif text-slate-900">Estrategia de Marca</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Brand Prism de Kapferer (6 facetas), arquetipo de personalidad y posicionamiento formal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Arquetipo de Marca</label>
                  <input
                    type="text"
                    value={arquetipo}
                    onChange={(e) => setArquetipo(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Propuesta de Valor</label>
                  <input
                    type="text"
                    value={propuestaValor}
                    onChange={(e) => setPropuestaValor(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Prisma de Kapferer (6 Facetas) */}
              <div className="space-y-3">
                <span className="font-bold font-serif text-slate-900 text-sm block">
                  Brand Prism (Kapferer - 6 Facetas):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">1. Físicas</span>
                    <p className="text-slate-700 text-[11px]">{project.prism.fisicas}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">2. Personalidad</span>
                    <p className="text-slate-700 text-[11px]">{project.prism.personalidad}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">3. Cultura</span>
                    <p className="text-slate-700 text-[11px]">{project.prism.cultura}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">4. Relación</span>
                    <p className="text-slate-700 text-[11px]">{project.prism.relacion}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">5. Reflejo</span>
                    <p className="text-slate-700 text-[11px]">{project.prism.reflejo}</p>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">6. Autoimagen</span>
                    <p className="text-slate-700 text-[11px]">{project.prism.autoimagen}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: Identidad Verbal */}
          {currentStep === 3 && (
            <div className="space-y-6 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-serif text-slate-900">Identidad Verbal</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Tagline persuasivo, tono de voz y manifiesto de marca.</p>
                </div>
                <button
                  onClick={() => handleGenerateStepWithAI(3)}
                  disabled={generatingAi}
                  className="px-3.5 py-2 bg-rose-50 text-[#DD8396] hover:bg-rose-100 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingAi ? 'Generando...' : 'Mejorar con IA'}</span>
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline Oficial</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-bold font-serif text-slate-900 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tono de Voz</label>
                <input
                  type="text"
                  value={project.tonoVoz}
                  readOnly
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Manifiesto de Marca</label>
                <textarea
                  rows={4}
                  value={manifiesto}
                  onChange={(e) => setManifiesto(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-3 leading-relaxed focus:outline-none font-serif text-slate-800 text-sm"
                ></textarea>
              </div>
            </div>
          )}

          {/* ETAPA 4: Logos con IA (Exact layout from screenshots with 3 iterations & SVG rendering) */}
          {currentStep === 4 && (
            <div className="space-y-6 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-serif text-slate-900">Logos</h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    3 iteraciones de 3 logos con IA. Elige la propuesta ganadora o sube el logo del cliente.
                  </p>
                </div>
                <button
                  onClick={() => handleGenerateStepWithAI(4)}
                  disabled={generatingAi}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-300" />
                  <span>{generatingAi ? 'Generando...' : '+ Nueva Variante IA'}</span>
                </button>
              </div>

              {/* Grid of Interactive SVG Logos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Variantes Vectoriales Interactivas:</span>
                  <span className="text-slate-400">Haz clic para seleccionar el logotipo ganador</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {logos.map((logo) => {
                    const isWinner = logo.id === selectedWinnerId;
                    return (
                      <div
                        key={logo.id}
                        onClick={() => handleSelectWinner(logo.id)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer bg-white relative flex flex-col justify-between ${
                          isWinner
                            ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {/* Winner Checkmark Badge */}
                        {isWinner && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                            <Check className="w-4 h-4" />
                          </div>
                        )}

                        {/* Render SVG */}
                        <div
                          className="h-32 flex items-center justify-center p-2"
                          dangerouslySetInnerHTML={{ __html: logo.svgCode }}
                        />

                        <div className="border-t border-slate-100 pt-3 space-y-1">
                          <span className="font-bold text-slate-900 text-xs block">{logo.conceptName}</span>
                          <p className="text-[11px] text-slate-500 leading-snug">{logo.meaning}</p>
                          <span className="text-[10px] text-slate-400 italic block mt-1">
                            Esencia: {logo.essence}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Winner Banner */}
              {winningLogo && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-amber-600" />
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">
                        Ganador Actual: {winningLogo.conceptName}
                      </span>
                      <span className="text-[11px] text-amber-700">
                        Este logotipo se sincronizará automáticamente en las Maquetas y el Design System.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob([winningLogo.svgCode], { type: 'image/svg+xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${brandName.toLowerCase().replace(/\s+/g, '_')}_logo.svg`;
                      a.click();
                    }}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar SVG</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ETAPA 5: Sistema Visual (Paleta HEX, WCAG 2.1 AA & Tipografía) */}
          {currentStep === 5 && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold font-serif text-slate-900">Sistema Visual & Accesibilidad</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Paleta cromática con verificación en tiempo real de contraste WCAG 2.1 AA y tipografía Playfair / Inter.
                </p>
              </div>

              {/* Colores Primarios */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-xs block">
                  Colores Primarios
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {project.primaryColors.map((col, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg shadow-inner border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{col.name}</span>
                          <span className="font-mono text-slate-500 text-[11px]">{col.hex}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{col.usage}</p>
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200 font-mono">
                        <span>Ratio: {col.contrastOnWhite}:1</span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            col.wcagAA ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {col.wcagAA ? 'WCAG AA OK' : 'Fondos oscuros'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colores Secundarios */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-xs block">
                  Colores Secundarios & Acentos
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {project.secondaryColors.map((col, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg shadow-inner border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{col.name}</span>
                          <span className="font-mono text-slate-500 text-[11px]">{col.hex}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{col.usage}</p>
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200 font-mono">
                        <span>Ratio: {col.contrastOnWhite}:1</span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded ${
                            col.wcagAA ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {col.wcagAA ? 'WCAG AA OK' : 'Fondo suave'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipografía */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-xs block">
                  Jerarquía Tipográfica Oficial
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono">DISPLAY / TITULARES</span>
                    <span className="font-serif text-lg font-bold text-slate-900 block">Playfair Display</span>
                    <p className="text-[11px] text-slate-500 font-serif italic">
                      &ldquo;Jeans que te hacen sentir increíble&rdquo;
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono">BODY / INTERFAZ / E-COMMERCE</span>
                    <span className="font-sans text-lg font-bold text-slate-900 block">Inter</span>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Texto nítido, legible en móviles y con soporte completo de caracteres.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 6: Aplicaciones & Mockups en Vivo */}
          {currentStep === 6 && (
            <div className="space-y-6 text-xs">
              {/* Sub-tabs header matching screenshots */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold font-serif text-slate-900">Aplicaciones de Marca</h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Mockups reales interactivos: Tarjetas de visita, hojas membretadas, firmas y entregables ZIP.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setActiveSubTab('contenido')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeSubTab === 'contenido' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Contenido
                  </button>
                  <button
                    onClick={() => setActiveSubTab('visuales')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeSubTab === 'visuales' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Visuales Mockups
                  </button>
                  <button
                    onClick={() => setActiveSubTab('entregables')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeSubTab === 'entregables' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Entregables ZIP
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Contenido */}
              {activeSubTab === 'contenido' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 text-xs block">Plan de Activación:</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{project.activationPlan}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 text-xs block">Brand Governance (Políticas):</span>
                    <p className="text-slate-700 leading-relaxed">{project.brandGovernance}</p>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Visuales Mockups en Tiempo Real */}
              {activeSubTab === 'visuales' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mockup 1: Tarjeta de Presentación */}
                    <div className="space-y-2">
                      <span className="font-semibold text-slate-700 block">Tarjeta de Presentación (Business Card)</span>
                      <div className="w-full h-48 bg-[#FFF8F0] border border-slate-300 rounded-xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
                        <div className="w-24 h-10" dangerouslySetInnerHTML={{ __html: winningLogo.svgCode }} />
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">Marcelo Díaz</span>
                          <span className="text-[10px] text-slate-500 font-mono uppercase">Fundador & CEO</span>
                          <div className="text-[10px] text-slate-400 mt-1">marcelo@mbjeans.cl &bull; +56 9 8832 1109</div>
                        </div>
                        <div className="absolute right-0 bottom-0 w-24 h-24 bg-[#DD8396]/15 rounded-full -mr-8 -mb-8"></div>
                      </div>
                    </div>

                    {/* Mockup 2: Firma de Correo Electrónico */}
                    <div className="space-y-2">
                      <span className="font-semibold text-slate-700 block">Firma de Correo Corporativa</span>
                      <div className="w-full h-48 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-[#1F3A5F] text-white flex items-center justify-center font-bold text-base font-serif">
                          MB
                        </div>
                        <div className="space-y-1 text-xs">
                          <span className="font-bold text-slate-900 block text-sm">Equipo MBJeans Chile</span>
                          <span className="text-[11px] text-[#DD8396] font-semibold block">{tagline}</span>
                          <div className="text-[10px] text-slate-500">
                            www.mbjeans.cl &bull; Santiago, Chile
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Entregables ZIP & PDF */}
              {activeSubTab === 'entregables' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-900 text-white rounded-xl space-y-3 shadow-md">
                    <span className="font-bold text-sm flex items-center gap-2">
                      <Download className="w-4 h-4 text-rose-300" />
                      Descargar ZIP Completo de Branding
                    </span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Incluye: Logotipos en SVG/PNG, Paleta en JSON/Tailwind tokens, Tipografías, Mockups y Brand Book PDF.
                    </p>
                    <button
                      onClick={() => alert('¡Generando paquete ZIP con todos los activos de marca!')}
                      className="w-full py-2 bg-[#DD8396] hover:bg-[#c96f83] text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
                    >
                      Descargar ZIP
                    </button>
                  </div>

                  <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600" />
                      Brand Book Ejecutivo (PDF)
                    </span>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Manual de identidad de marca de 12 páginas listo para entregar al cliente o equipo de diseño.
                    </p>
                    <button
                      onClick={() => window.print()}
                      className="w-full py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold rounded-lg text-xs transition-colors"
                    >
                      Imprimir / Guardar PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
