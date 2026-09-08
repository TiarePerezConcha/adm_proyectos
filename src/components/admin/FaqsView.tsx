import React, { useState } from 'react';
import { HelpCircle, Plus, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { generateWithAI } from '../../services/aiService';
import { AppState } from '../../utils/storage';

interface FaqsViewProps {
  state: AppState;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const FaqsView: React.FC<FaqsViewProps> = ({ state }) => {
  const [search, setSearch] = useState('');
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
  ]);

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCat, setNewCat] = useState('E-Commerce');
  const [showAdd, setShowAdd] = useState(false);
  const [generatingWithAi, setGeneratingWithAi] = useState(false);

  const handleAiDraftAnswer = async () => {
    if (!newQuestion) return;
    setGeneratingWithAi(true);
    try {
      const draft = await generateWithAI(
        {
          prompt: `Redacta una respuesta concisa, técnica y profesional para la siguiente pregunta frecuente de clientes de desarrollo web y ecommerce en Chile: "${newQuestion}"`,
          taskType: 'copywriting',
          context: 'Plataforma LSC Admin & Studio',
        },
        state.settings
      );
      setNewAnswer(draft);
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

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 font-mono">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            FAQs & Base de Conocimiento
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Respuestas maestras para alimentar al agente de IA y resolver objeciones de clientes.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium shadow-lg transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva FAQ</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar pregunta, término técnico o categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#12151C] border border-[#202634] rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {filtered.map((faq) => (
          <div
            key={faq.id}
            className="bg-[#12151C] border border-[#202634] p-5 rounded-xl space-y-3 hover:border-[#2b3548] transition-colors"
          >
            <div className="flex items-start justify-between gap-2 border-b border-[#202634] pb-2.5">
              <h3 className="text-white font-bold text-sm leading-snug">{faq.question}</h3>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded whitespace-nowrap">
                {faq.category}
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#12151C] border border-[#202634] p-6 rounded-2xl w-full max-w-lg space-y-4 font-mono text-xs">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Crear Pregunta Frecuente
            </h2>

            <form onSubmit={handleAddFaq} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Pregunta del Cliente *</label>
                <input
                  type="text"
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Ej: ¿Cuánto tiempo toma levantar un ecommerce en Shopify?"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Categoría</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Facturación / SII">Facturación / SII</option>
                  <option value="Condiciones Comerciales">Condiciones Comerciales</option>
                  <option value="Infraestructura">Infraestructura</option>
                  <option value="Ciberseguridad">Ciberseguridad</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400">Respuesta Maestra *</label>
                  <button
                    type="button"
                    onClick={handleAiDraftAnswer}
                    disabled={generatingWithAi || !newQuestion}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{generatingWithAi ? 'Generando...' : 'Redactar con IA'}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Escribe la respuesta formal..."
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-3 py-2 bg-transparent hover:bg-slate-800 text-slate-400 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
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
