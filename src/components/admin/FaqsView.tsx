import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Cpu,
  ShieldCheck,
  Globe,
  Trash2,
  RefreshCw,
  ExternalLink,
  Zap,
  Layers,
  ArrowRight,
  Languages,
  AlertTriangle,
  Lock,
  Copy,
  Check
} from 'lucide-react';
import {
  generateWithAI,
  getAIUsageMetrics,
  resetAIUsageMetrics,
  sanitizeSensitiveData,
  translateContent,
  DLP_SAFETY_SHIELD_BYTES,
  TRANSLATION_SAFETY_SHIELD_CHARS
} from '../../services/aiService';
import { AppState } from '../../utils/storage';
import { AIUsageMetrics } from '../../types';

interface FaqsViewProps {
  state: AppState;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  translatedEn?: string;
  isTranslating?: boolean;
}

export const FaqsView: React.FC<FaqsViewProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'faqs' | 'estudio' | 'cuota'>('faqs');
  const [search, setSearch] = useState('');
  const [metrics, setMetrics] = useState<AIUsageMetrics>(getAIUsageMetrics());

  // Modelo temporal para pruebas en la vista
  const [selectedProvider, setSelectedProvider] = useState<
    'auto' | 'gemini' | 'groq' | 'sambanova' | 'openrouter' | 'github' | 'openai' | 'offline'
  >(state.settings.preferredModel as any || 'auto');

  // Base de Conocimiento inicial
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: 'faq-1',
      question: '¿Cuál es la diferencia entre Shopify y WooCommerce para ventas en Chile?',
      answer:
        'Shopify es una plataforma hosted que incluye servidores ultrarrápidos, soporte de alta concurrencia (CyberDay) y checkout certificado por PCI sin mantenciones técnicas complejas. WooCommerce requiere hosting propio (como TecnoInver o VPS) y actualizaciones continuas de plugins para evitar vulnerabilidades de seguridad.',
      category: 'E-Commerce',
    },
    {
      id: 'faq-2',
      question: '¿Cómo se integra Webpay Plus con boleta electrónica del SII?',
      answer:
        'Se conecta la pasarela de Transbank vía REST API o plugins oficiales. Para la emisión automática de boletas electrónicas se integran proveedores chilenos como Bsale, Lioren o Boletaify, que reciben el webhook del pago exitoso y timbran la boleta en el SII en tiempo real.',
      category: 'Facturación / SII',
    },
    {
      id: 'faq-3',
      question: '¿Por qué se requiere el 100% de pago al inicio del desarrollo?',
      answer:
        'El 100% de pago anticipado asegura el bloqueo exclusivo del sprint de desarrollo en el calendario, garantiza el aprovisionamiento de infraestructura y licencias sin demoras y permite trabajar con metodologías ágiles enfocadas totalmente en la entrega sin fricciones burocráticas.',
      category: 'Condiciones Comerciales',
    },
    {
      id: 'faq-4',
      question: '¿Cómo funciona la estrategia de base de datos gratuita con Supabase?',
      answer:
        'Supabase ofrece un plan gratuito generoso de PostgreSQL. Sin embargo, si un proyecto no recibe consultas durante 7 días, la base de datos entra en pausa. Para evitarlo, nuestro sistema ejecuta un webhook Keep-Alive ligero cada 3 días, manteniendo la base de datos despierta permanentemente a costo $0.',
      category: 'Infraestructura',
    },
    {
      id: 'faq-5',
      question: '¿Qué es el cálculo ALE en Ciberseguridad y por qué lo usamos?',
      answer:
        'El cálculo ALE (Annualized Loss Expectancy) cuantifica monetariamente en pesos chilenos el riesgo anual de un ciberataque: ALE = SLE (Pérdida por evento) x ARO (Frecuencia anual). Esto demuestra financieramente al cliente que invertir en monitoreo preventivo es 10 veces más barato que sufrir una sola caída de ventas.',
      category: 'Ciberseguridad',
    },
  ]);

  // Modal Nueva FAQ
  const [showAdd, setShowAdd] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCat, setNewCat] = useState('E-Commerce');
  const [generatingWithAi, setGeneratingWithAi] = useState(false);

  // Modo Estudio con IA
  const [studyTopic, setStudyTopic] = useState('');
  const [studyResponse, setStudyResponse] = useState('');
  const [studying, setStudying] = useState(false);
  const [copiedStudy, setCopiedStudy] = useState(false);
  const [dlpResult, setDlpResult] = useState<{ maskedCount: number; bytes: number } | null>(null);

  // Refrescar métricas periódicamente o tras cada llamada
  const refreshMetrics = () => {
    setMetrics(getAIUsageMetrics());
  };

  useEffect(() => {
    refreshMetrics();
  }, []);

  // Generar borrador de FAQ con IA
  const handleAiDraftAnswer = async () => {
    if (!newQuestion) return;
    setGeneratingWithAi(true);
    try {
      const draft = await generateWithAI(
        {
          prompt: `Redacta una respuesta concisa, técnica y profesional para la siguiente pregunta frecuente de clientes de desarrollo web y ecommerce en Chile: "${newQuestion}"`,
          taskType: 'copywriting',
          context: 'Plataforma de Tiare Pérez Concha (Desarrollo Web & UI/UX)',
          providerOverride: selectedProvider,
        },
        state.settings
      );
      setNewAnswer(draft);
      refreshMetrics();
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingWithAi(false);
    }
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !newAnswer) return;
    setFaqs([
      ...faqs,
      {
        id: `faq-${Date.now()}`,
        question: newQuestion,
        answer: newAnswer,
        category: newCat,
      },
    ]);
    setShowAdd(false);
    setNewQuestion('');
    setNewAnswer('');
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  // Traducción bilingüe de FAQ (Cloud Translation / IA)
  const handleTranslateFaq = async (faqId: string) => {
    const targetFaq = faqs.find((f) => f.id === faqId);
    if (!targetFaq) return;

    // Toggle: si ya tiene traducción, la oculta
    if (targetFaq.translatedEn) {
      setFaqs(faqs.map((f) => (f.id === faqId ? { ...f, translatedEn: undefined } : f)));
      return;
    }

    setFaqs(faqs.map((f) => (f.id === faqId ? { ...f, isTranslating: true } : f)));
    try {
      const transQ = await translateContent(targetFaq.question, 'en', state.settings);
      const transA = await translateContent(targetFaq.answer, 'en', state.settings);
      setFaqs(
        faqs.map((f) =>
          f.id === faqId
            ? {
                ...f,
                translatedEn: `**Q:** ${transQ.text}\n\n**A:** ${transA.text}`,
                isTranslating: false,
              }
            : f
        )
      );
      refreshMetrics();
    } catch {
      setFaqs(faqs.map((f) => (f.id === faqId ? { ...f, isTranslating: false } : f)));
    }
  };

  // Estudio con IA
  const handleRunStudy = async (queryTopic?: string) => {
    const topicToUse = queryTopic || studyTopic;
    if (!topicToUse.trim()) return;

    setStudying(true);
    setDlpResult(null);

    // 1. Escaneo preliminar DLP (Sensitive Data Protection)
    const dlpCheck = sanitizeSensitiveData(topicToUse);
    if (dlpCheck.maskedCount > 0) {
      setDlpResult({ maskedCount: dlpCheck.maskedCount, bytes: dlpCheck.bytesChecked });
    }

    try {
      const response = await generateWithAI(
        {
          prompt: `Explica en detalle para estudio técnico y profesional el siguiente tema: "${dlpCheck.sanitized}". Incluye conceptos clave, aplicación práctica en Chile, mejores prácticas y consideraciones de arquitectura o negocio.`,
          taskType: 'study',
          context: 'Estudio de Tecnologías Web, Supabase, Ecommerce y Seguridad de Tiare Pérez',
          providerOverride: selectedProvider,
        },
        state.settings
      );
      setStudyResponse(response);
      refreshMetrics();
    } catch (err: any) {
      setStudyResponse(`Error al conectar con la IA: ${err.message || 'Error de red'}`);
    } finally {
      setStudying(false);
    }
  };

  // Convertir respuesta de estudio en FAQ con 1 clic
  const handleSaveStudyAsFaq = () => {
    if (!studyResponse || !studyTopic) return;
    const newFaqItem: FAQItem = {
      id: `faq-study-${Date.now()}`,
      question: studyTopic.trim(),
      answer: studyResponse.trim(),
      category: 'Estudio Técnico',
    };
    setFaqs([newFaqItem, ...faqs]);
    setActiveTab('faqs');
    alert('✅ ¡Explicación guardada con éxito en la Base de Conocimiento!');
  };

  const handleCopyStudy = () => {
    navigator.clipboard.writeText(studyResponse);
    setCopiedStudy(true);
    setTimeout(() => setCopiedStudy(false), 2000);
  };

  const handleResetMetrics = () => {
    if (confirm('¿Deseas reiniciar los contadores de tokens de la sesión?')) {
      const fresh = resetAIUsageMetrics();
      setMetrics(fresh);
    }
  };

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  // Porcentajes de cuota gratuitos de seguridad
  const geminiTpmCap = 1000000; // 1M TPM límite en Gemini Free Tier
  const tokenPercentage = Math.min(100, Math.round((metrics.totalTokensUsed / geminiTpmCap) * 100));

  const dlpMbScanned = (metrics.dlpBytesScanned / (1024 * 1024)).toFixed(2);
  const dlpMaxMb = (DLP_SAFETY_SHIELD_BYTES / (1024 * 1024)).toFixed(0);
  const dlpPercentage = Math.min(100, Math.round((metrics.dlpBytesScanned / DLP_SAFETY_SHIELD_BYTES) * 100));

  const transPercentage = Math.min(
    100,
    Math.round((metrics.translationCharsUsed / TRANSLATION_SAFETY_SHIELD_CHARS) * 100)
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-200 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202634] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-emerald-400" />
            <span>FAQs & Base de Conocimiento con IA</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Respuestas maestras, tutor interactivo de estudio técnico y monitoreo de cuotas y tokens en tiempo real.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#0F141C] p-1.5 rounded-xl border border-[#202634] text-xs">
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'faqs' ? 'bg-emerald-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Base de Preguntas ({faqs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('estudio')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'estudio' ? 'bg-indigo-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tutor de Estudio IA</span>
          </button>
          <button
            onClick={() => setActiveTab('cuota')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cuota' ? 'bg-blue-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Monitor de Cuota & Escudo $0</span>
          </button>
        </div>
      </div>

      {/* BARRA SUPERIOR DE TELEMETRÍA Y CONTROL DE COSTOS $0 */}
      <div className="bg-[#0F141C] border border-[#202634] p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        {/* Token Quota */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Tokens IA Usados:</span>
            </span>
            <span className="font-mono font-bold text-white">{metrics.totalTokensUsed.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full transition-all duration-500"
              style={{ width: `${Math.max(tokenPercentage, 2)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>{tokenPercentage}% de cuota gratuita</span>
            <span>Seguro (&lt;1M TPM)</span>
          </div>
        </div>

        {/* Sensitive Data Protection (DLP) Escudo */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Escudo DLP (Protección Datos):</span>
            </span>
            <span className="font-mono text-emerald-300">{dlpMbScanned} MB</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.max(dlpPercentage, 1)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Tope seguro: {dlpMaxMb} MB</span>
            <span className="text-emerald-400 font-semibold">$0.00 USD</span>
          </div>
        </div>

        {/* Translation API */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-blue-400" />
              <span>Traductor Cloud / IA:</span>
            </span>
            <span className="font-mono text-blue-300">{metrics.translationCharsUsed.toLocaleString()} chars</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${Math.max(transPercentage, 1)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Tope: 400k / 500k chars</span>
            <span className="text-blue-400 font-semibold">100% Gratis</span>
          </div>
        </div>

        {/* Selector Rápido de Proveedor */}
        <div className="flex flex-col justify-between space-y-1">
          <label className="text-slate-400 text-[11px] font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Motor Activo:
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">$0 Costo</span>
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as any)}
            className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-1.5 text-white font-mono text-xs outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="gemini">🌟 Google Gemini (Gemini 2.5 Flash Conectado - Proyecto Conpi App)</option>
            <option value="auto">⚡ Automático (Gemini 2.5 + Fallback Local)</option>
            <option value="offline">🛡️ Motor Local Heurístico (Cero Tokens / Offline)</option>
            {state.settings.groqApiKey && <option value="groq">⚡ Groq (Llama 3.3 70B Free)</option>}
            {state.settings.sambanovaApiKey && <option value="sambanova">🚀 SambaNova (Llama 3.1 70B)</option>}
            {state.settings.openrouterApiKey && <option value="openrouter">🌐 OpenRouter (DeepSeek R1 Free)</option>}
            {state.settings.githubModelsApiKey && <option value="github">🐙 GitHub Models (gpt-4o-mini)</option>}
            {state.settings.openaiApiKey && <option value="openai">🤖 OpenAI (gpt-4o-mini)</option>}
          </select>
        </div>
      </div>

      {/* TAB 1: BASE DE PREGUNTAS (FAQS) */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar pregunta, término técnico o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#12151C] border border-[#202634] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva FAQ</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((faq) => (
              <div
                key={faq.id}
                className="bg-[#12151C] border border-[#202634] p-5 rounded-2xl space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2 border-b border-[#202634] pb-2.5">
                  <h3 className="text-white font-bold text-sm leading-snug">{faq.question}</h3>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded whitespace-nowrap font-mono">
                    {faq.category}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">{faq.answer}</p>

                {/* Traducción bilingüe si fue generada */}
                {faq.translatedEn && (
                  <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs text-blue-200 font-mono space-y-1">
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
                      🇺🇸 English Translation (Bilingual Client View):
                    </span>
                    <p className="text-[11px] leading-relaxed whitespace-pre-line">{faq.translatedEn}</p>
                  </div>
                )}

                {/* Acciones de la FAQ */}
                <div className="pt-2 border-t border-[#1E2532] flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleTranslateFaq(faq.id)}
                    disabled={faq.isTranslating}
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition cursor-pointer text-[11px]"
                    title="Traducir pregunta y respuesta para clientes extranjeros con costo $0"
                  >
                    <Languages className="w-3.5 h-3.5" />
                    <span>
                      {faq.isTranslating
                        ? 'Traduciendo...'
                        : faq.translatedEn
                        ? 'Ocultar Inglés'
                        : 'Traducir al Inglés'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                    title="Eliminar FAQ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TUTOR DE ESTUDIO TÉCNICO CON IA */}
      {activeTab === 'estudio' && (
        <div className="bg-[#12151C] border border-[#202634] rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202634] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Tutor Interactivo de Estudio y Consultas Técnicas</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Utiliza tu modelo preferido ({selectedProvider}) para aprender, preparar respuestas o estudiar arquitectura web chilena sin costo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                Protección DLP: <strong className="text-emerald-400">Activa (RUTs/Tarjetas Ocultos)</strong>
              </span>
            </div>
          </div>

          {/* Temas Rápidos de Estudio Sugeridos */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Temas de Estudio Recomendados para tu Portfolio:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                '¿Cómo funciona la integración de Webpay Plus con boletas del SII?',
                '¿Por qué Supabase entra en pausa a los 7 días y cómo actúa el Keep-Alive?',
                '¿Cómo se calcula el riesgo ALE en Ciberseguridad para un cliente en Chile?',
                '¿Cuáles son las diferencias de costo y escalabilidad entre Shopify y WooCommerce?',
                '¿Qué exige la norma WCAG 2.1 AA en accesibilidad de contraste cromático?',
              ].map((topic, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setStudyTopic(topic);
                    handleRunStudy(topic);
                  }}
                  className="px-3 py-1.5 bg-[#090C11] hover:bg-slate-800 border border-[#202634] rounded-xl text-xs text-slate-300 hover:text-white transition cursor-pointer text-left"
                >
                  &bull; {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Formulario de Consulta de Estudio */}
          <div className="space-y-3">
            <label className="block text-slate-300 font-semibold text-xs">
              Escribe el concepto, duda o tema que deseas estudiar o profundizar:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={studyTopic}
                onChange={(e) => setStudyTopic(e.target.value)}
                placeholder="Ej: Explícame cómo configurar CORS y cabeceras de seguridad CSP en Nginx y Vercel..."
                className="flex-1 bg-[#0A0C10] border border-[#202634] focus:border-indigo-500 rounded-xl px-4 py-2.5 text-white outline-none text-xs font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunStudy();
                }}
              />
              <button
                onClick={() => handleRunStudy()}
                disabled={studying || !studyTopic.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{studying ? 'Analizando con IA...' : 'Estudiar'}</span>
              </button>
            </div>
          </div>

          {/* Aviso si DLP sanitizó datos */}
          {dlpResult && (
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Escudo DLP: Se detectaron y ocultaron {dlpResult.maskedCount} dato(s) sensibles (RUTs o tarjetas) antes de enviar a la IA. Tu información personal está protegida.
              </span>
            </div>
          )}

          {/* Resultado de Estudio */}
          {studyResponse && (
            <div className="bg-[#0A0C10] border border-indigo-900/50 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Respuesta del Tutor ({selectedProvider})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyStudy}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedStudy ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedStudy ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <button
                    onClick={handleSaveStudyAsFaq}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow"
                    title="Almacena esta explicación como una pregunta frecuente en tu plataforma"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar como FAQ en Base de Conocimiento</span>
                  </button>
                </div>
              </div>

              <div className="text-slate-200 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {studyResponse}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MONITOR DE CUOTA & ESCUDO $0 COSTO */}
      {activeTab === 'cuota' && (
        <div className="bg-[#12151C] border border-[#202634] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#202634] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Monitor de Cuotas, Tokens y Blindaje de Costo $0</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Seguimiento estricto para que nunca incurras en cobros imprevistos en Google Cloud ni en proveedores de IA.
              </p>
            </div>
            <button
              onClick={handleResetMetrics}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reiniciar Sesión</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Tarjeta 1: Google Gemini */}
            <div className="bg-[#0A0C10] border border-[#202634] p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" /> Google Gemini
                </span>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded text-[10px] font-mono font-bold">
                  FREE TIER ACTIVO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Google ofrece gratuitamente hasta <strong>15 solicitudes por minuto</strong> y <strong>1.000.000 de tokens por minuto</strong> sin necesidad de tarjeta de crédito en Google AI Studio.
              </p>
              <div className="p-3 bg-slate-900 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Tokens Prompt:</span>
                  <span>{metrics.promptTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tokens Respuesta:</span>
                  <span>{metrics.completionTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                  <span>Costo Estimado:</span>
                  <span>$0.00 USD</span>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Sensitive Data Protection (DLP) */}
            <div className="bg-[#0A0C10] border border-[#202634] p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-400" /> Google DLP Shield
                </span>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded text-[10px] font-mono font-bold">
                  GRATIS &lt; 1 GB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Google Cloud DLP cobra $3/GB solo a partir del <strong>segundo gigabyte</strong>. Nuestro escudo de software frena automáticamente las inspecciones a los <strong>858 MB</strong> para costo $0 perpetuo.
              </p>
              <div className="p-3 bg-slate-900 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Escaneado:</span>
                  <span>{dlpMbScanned} MB</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tope de Seguridad:</span>
                  <span>{dlpMaxMb} MB (80% del GiB)</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                  <span>Estado Facturación:</span>
                  <span>USD $0.00 / Mes</span>
                </div>
              </div>
            </div>

            {/* Tarjeta 3: Cloud Translation & Modelos Libres */}
            <div className="bg-[#0A0C10] border border-[#202634] p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-400" /> Translation & Open AI
                </span>
                <span className="px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800/60 rounded text-[10px] font-mono font-bold">
                  PROTEGIDO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cloud Translation API incluye <strong>500.000 caracteres gratis</strong> al mes. Además, tus modelos de Groq (Llama 3.3), SambaNova y GitHub Models no generan costo en sus tiers de desarrollador.
              </p>
              <div className="p-3 bg-slate-900 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Caracteres Traducidos:</span>
                  <span>{metrics.translationCharsUsed.toLocaleString()} / 500k</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Llamadas Totales IA:</span>
                  <span>{metrics.totalCalls} ejecuciones</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                  <span>Costo Total Acumulado:</span>
                  <span>$0.00 CLP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR PREGUNTA FRECUENTE */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#12151C] border border-[#202634] p-6 rounded-2xl w-full max-w-lg space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>Crear Pregunta Frecuente</span>
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-white p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFaq} className="space-y-3.5">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Pregunta del Cliente o Concepto *</label>
                <input
                  type="text"
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ej: ¿Por qué recomiendas Supabase en vez de hosting tradicional?"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Categoría</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-xl p-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Facturación / SII">Facturación / SII</option>
                  <option value="Condiciones Comerciales">Condiciones Comerciales</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Ciberseguridad">Ciberseguridad</option>
                  <option value="Estudio Técnico">Estudio Técnico</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Respuesta Maestra *</label>
                  <button
                    type="button"
                    onClick={handleAiDraftAnswer}
                    disabled={generatingWithAi || !newQuestion}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{generatingWithAi ? 'Redactando con IA...' : `Redactar con ${selectedProvider}`}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Escribe la respuesta formal o utiliza el botón de IA para redactarla automáticamente..."
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-400 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer transition shadow"
                >
                  Guardar FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
