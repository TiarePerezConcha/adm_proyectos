import React, { useState } from 'react';
import { FileSpreadsheet, Plus, Sparkles, Printer, Mail, CheckCircle2, Trash2, Edit3, Eye, ArrowLeft, Layers, Calendar, DollarSign } from 'lucide-react';
import { AppState, syncDealStage, saveAppState } from '../../utils/storage';
import { Quote, QuoteService, QuoteSprint } from '../../types';
import { generateWithAI } from '../../services/aiService';

interface CotizadorExpressViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  initialClientId?: string;
}

export const CotizadorExpressView: React.FC<CotizadorExpressViewProps> = ({
  state,
  onUpdateState,
  initialClientId,
}) => {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [improvingOutcomeAi, setImprovingOutcomeAi] = useState(false);
  const [improvingServiceIndex, setImprovingServiceIndex] = useState<number | null>(null);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
  const [projectTitle, setProjectTitle] = useState('Ecommerce Shopify Personalizado');
  const [subtitle, setSubtitle] = useState('Diseño, maquetación y pasarela de pagos para Chile');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('+56 9 ');
  const [clientCompany, setClientCompany] = useState('');
  const [outcome, setOutcome] = useState(
    'Recibirás una tienda online orientada a la conversión, con experiencia móvil optimizada, pasarela Webpay integrada y gestión ágil de catálogo.'
  );

  const [services, setServices] = useState<QuoteService[]>([
    {
      id: 's-1',
      title: 'Brief UX y Definición de Experiencia',
      description: 'Arquitectura de información, definición de buyer persona y objetivos de conversión.',
      priceCLP: 200000,
    },
    {
      id: 's-2',
      title: 'Diseño Visual, Branding & Design System',
      description: 'Paleta cromática con contraste accesible WCAG AA, tipografías y componentes interactivos.',
      priceCLP: 250000,
    },
    {
      id: 's-3',
      title: 'Desarrollo Frontend & Setup Shopify/Ecommerce',
      description: 'Maquetación responsive mobile-first, ficha de producto con selectores de talla/color y catálogo.',
      priceCLP: 400000,
    },
  ]);

  const [paymentCondition, setPaymentCondition] = useState<Quote['paymentCondition']>('100_anticipado');
  const [paymentDetails, setPaymentDetails] = useState('100% anticipado para iniciar el desarrollo y reservar el sprint.');
  const [taxDoc, setTaxDoc] = useState<'boleta' | 'factura'>('boleta');
  const [deliveryDays, setDeliveryDays] = useState(14);
  const [validityDays, setValidityDays] = useState(15);
  const [quoteStatus, setQuoteStatus] = useState<Quote['status']>('borrador');

  const [sprints, setSprints] = useState<QuoteSprint[]>([
    {
      sprintNumber: 1,
      title: 'Sprint 1: UX/UI, Wireframes & Maqueta de Alta Fidelidad',
      durationWeeks: 1,
      deliverables: ['Brief UX documentado', 'Prototipo interactivo Desktop y Mobile', 'Paleta y componentes'],
      definitionOfDone: 'Aprobación del cliente en sesión de revisión antes de pasar al código.',
    },
    {
      sprintNumber: 2,
      title: 'Sprint 2: Configuración de Plataforma, Catálogo & Checkout Webpay',
      durationWeeks: 1,
      deliverables: ['Catálogo cargado con variantes', 'Pasarela Webpay Plus conectada', 'Prueba de compra real'],
      definitionOfDone: 'Transacción de prueba procesada con éxito y boleta electrónica configurada.',
    },
  ]);

  // Autocompletar cuando se selecciona cliente del CRM
  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const cl = state.clients.find((c) => c.id === clientId);
    if (cl) {
      setClientName(cl.name);
      setClientEmail(cl.email);
      setClientPhone(cl.phone);
      setClientCompany(cl.company);
      setProjectTitle(`Ecommerce Shopify para ${cl.company}`);
    }
  };

  const handleImproveOutcomeWithAi = async () => {
    setImprovingOutcomeAi(true);
    try {
      const prompt = `Mejora y haz persuasivo el siguiente valor transformador/outcome para una cotización de proyecto web en Chile: "${outcome}". Destaca resultados de negocio, reducción de fricción y aumento de ventas.`;
      const improved = await generateWithAI(
        { prompt, taskType: 'copywriting', context: clientCompany },
        state.settings
      );
      setOutcome(improved);
    } catch (e) {
      console.error(e);
    } finally {
      setImprovingOutcomeAi(false);
    }
  };

  const handleImproveServiceWithAi = async (index: number) => {
    setImprovingServiceIndex(index);
    try {
      const serv = services[index];
      const prompt = `Mejora y profesionaliza la descripción del servicio: "${serv.title} - ${serv.description}". Redáctalo enfocado en entregables tangibles para el cliente en Chile.`;
      const improved = await generateWithAI(
        { prompt, taskType: 'copywriting', context: clientCompany },
        state.settings
      );
      const updated = [...services];
      updated[index].description = improved;
      setServices(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setImprovingServiceIndex(null);
    }
  };

  const handleAddService = () => {
    setServices([
      ...services,
      {
        id: `s-${Date.now()}`,
        title: 'Nuevo Servicio o Entregable',
        description: 'Descripción detallada de lo que incluye...',
        priceCLP: 150000,
      },
    ]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const totalCLP = services.reduce((acc, s) => acc + (s.priceCLP || 0), 0);
  const ivaCLP = taxDoc === 'factura' ? Math.round(totalCLP * 0.19) : 0;
  const grandTotalCLP = totalCLP + ivaCLP;

  const handleSaveQuote = () => {
    const quoteId = selectedQuote ? selectedQuote.id : `quote-${Date.now()}`;
    const quoteNumber = selectedQuote
      ? selectedQuote.quoteNumber
      : `N° 00${state.quotes.length + 1}`;

    const newQuote: Quote = {
      id: quoteId,
      quoteNumber,
      clientId: selectedClientId || `cli-${Date.now()}`,
      clientName,
      clientEmail,
      clientPhone,
      clientCompany: clientCompany || clientName,
      projectTitle,
      subtitle,
      outcome,
      services,
      totalCLP: grandTotalCLP,
      paymentCondition,
      paymentConditionDetails: paymentDetails,
      taxDocument: taxDoc,
      deliveryTimeDays: deliveryDays,
      validityDays,
      sprints,
      status: quoteStatus,
      createdAt: selectedQuote ? selectedQuote.createdAt : new Date().toISOString().slice(0, 10),
    };

    // ACCIÓN AUTOMÁTICA AL CRM: Mover deal según estado de la cotización
    let targetStage: any = 'propuesta_enviada';
    if (quoteStatus === 'en_negociacion') targetStage = 'en_negociacion';
    if (quoteStatus === 'aprobada' || quoteStatus === 'en_desarrollo') targetStage = 'proyecto_aprobado';
    if (quoteStatus === 'entregada') targetStage = 'en_monitoreo';

    const updatedDeals = syncDealStage(state.deals, newQuote.clientId, targetStage, {
      clientName,
      company: clientCompany || clientName,
      email: clientEmail,
      phone: clientPhone,
      title: projectTitle,
      valueCLP: grandTotalCLP,
      quoteId,
    });

    const updatedQuotes = selectedQuote
      ? state.quotes.map((q) => (q.id === selectedQuote.id ? newQuote : q))
      : [newQuote, ...state.quotes];

    const newState = {
      ...state,
      quotes: updatedQuotes,
      deals: updatedDeals,
    };

    onUpdateState(newState);
    saveAppState(newState);
    setSelectedQuote(newQuote);
    setIsEditing(false);
  };

  const handleOpenNewQuote = () => {
    setSelectedQuote(null);
    setIsEditing(true);
    if (initialClientId) handleSelectClient(initialClientId);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = (quote: Quote) => {
    const subject = encodeURIComponent(`Cotización Formal: ${quote.projectTitle} - ${quote.quoteNumber}`);
    const body = encodeURIComponent(
      `Estimado/a ${quote.clientName},\n\nEs un gusto saludarte. Adjunto la propuesta comercial formal para tu proyecto "${quote.projectTitle}".\n\nResumen de propuesta:\n- Inversión Total: $${quote.totalCLP.toLocaleString('es-CL')} CLP (${quote.taxDocument === 'factura' ? '+ IVA' : 'boleta de honorarios'}).\n- Condición comercial: ${quote.paymentConditionDetails}\n- Plazo estimado: ${quote.deliveryTimeDays} días hábiles organizados en metodología ágil de entregas por Sprints.\n\nQuedo atento a tus comentarios para coordinar el inicio del Sprint 1.\n\nSaludos cordiales,\nLuis Salas Cortés\nDesarrollo Web & Studio`
    );
    window.location.href = `mailto:${quote.clientEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#DD8396]" />
            Cotizador Express
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cotizaciones express con pautas ágiles, autocompletado desde CRM y exportación a PDF profesional.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleOpenNewQuote}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-sm transition-colors self-start flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cotización Express</span>
          </button>
        )}
      </div>

      {/* Grid of Existing Quotes (Exact layout from screenshots) */}
      {!isEditing && !selectedQuote && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.quotes.map((q) => (
            <div
              key={q.id}
              onClick={() => setSelectedQuote(q)}
              className="bg-white border border-slate-200 hover:border-slate-400 p-5 rounded-xl space-y-3 cursor-pointer transition-all shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm group-hover:text-[#DD8396] transition-colors">
                    {q.quoteNumber} &mdash; {q.projectTitle}
                  </h3>
                  <span className="text-xs text-slate-500">{q.clientName} &bull; {q.clientCompany}</span>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
                    q.status === 'aprobada'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : q.status === 'en_revision'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {q.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400">Total: </span>
                  <span className="font-bold text-slate-900">${q.totalCLP.toLocaleString('es-CL')} CLP</span>
                </div>
                <div>
                  <span className="text-slate-400">Servicios: </span>
                  <span className="font-semibold text-slate-800">{q.services.length} items</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50">
                <span>{q.createdAt}</span>
                <span className="text-[#DD8396] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Ver detalle & PDF &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Quote Detail & Printable View */}
      {selectedQuote && !isEditing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-1 font-medium"
              >
                &larr; Volver al listado
              </button>
              <h2 className="text-xl font-bold font-serif text-slate-900">
                {selectedQuote.quoteNumber}: {selectedQuote.projectTitle}
              </h2>
              <span className="text-xs text-slate-500">{selectedQuote.subtitle}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleSendEmail(selectedQuote)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-slate-600" />
                <span>Enviar por Correo</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Exportar PDF</span>
              </button>

              <button
                onClick={() => {
                  setProjectTitle(selectedQuote.projectTitle);
                  setSubtitle(selectedQuote.subtitle);
                  setClientName(selectedQuote.clientName);
                  setClientEmail(selectedQuote.clientEmail);
                  setClientPhone(selectedQuote.clientPhone);
                  setClientCompany(selectedQuote.clientCompany);
                  setOutcome(selectedQuote.outcome);
                  setServices(selectedQuote.services);
                  setPaymentCondition(selectedQuote.paymentCondition);
                  setPaymentDetails(selectedQuote.paymentConditionDetails);
                  setTaxDoc(selectedQuote.taxDocument);
                  setDeliveryDays(selectedQuote.deliveryTimeDays);
                  setValidityDays(selectedQuote.validityDays);
                  setQuoteStatus(selectedQuote.status);
                  setSprints(selectedQuote.sprints || []);
                  setIsEditing(true);
                }}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modificar</span>
              </button>
            </div>
          </div>

          {/* Printable Formal Quotation Layout */}
          <div id="printable-quote" className="p-8 bg-[#FAFBFD] rounded-xl border border-slate-200 space-y-6">
            {/* Header Document */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6">
              <div>
                <span className="font-serif text-2xl font-bold text-slate-900 block">LUIS SALAS CORTÉS</span>
                <span className="text-xs text-slate-500 font-mono">Desarrollo Web &bull; UX/UI &bull; E-Commerce</span>
                <span className="text-xs text-slate-400 block mt-1">contacto@luissalascortes.dev &bull; Chile</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-400 block uppercase">Cotización Comercial</span>
                <span className="text-lg font-mono font-bold text-slate-900">{selectedQuote.quoteNumber}</span>
                <span className="text-xs text-slate-500 block">Fecha: {selectedQuote.createdAt}</span>
                <span className="text-xs text-slate-500 block">Validez: {selectedQuote.validityDays} días</span>
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">Cliente:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedQuote.clientName}</span>
                <span className="text-slate-600 block">{selectedQuote.clientCompany}</span>
              </div>
              <div className="text-right sm:text-left">
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">Contacto:</span>
                <span className="text-slate-700 block">{selectedQuote.clientEmail}</span>
                <span className="text-slate-700 block">{selectedQuote.clientPhone}</span>
              </div>
            </div>

            {/* Outcome de Valor */}
            <div className="p-4 bg-rose-50/40 rounded-lg border border-rose-100 space-y-1">
              <span className="text-[11px] font-bold text-[#DD8396] uppercase tracking-wider block">
                Propuesta de Valor & Outcome:
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{selectedQuote.outcome}</p>
            </div>

            {/* Services Table */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Servicios & Entregables Incluidos:
              </span>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {selectedQuote.services.map((serv, i) => (
                  <div key={serv.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        {serv.title}
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed pl-6">{serv.description}</p>
                    </div>
                    <span className="font-bold text-slate-900 whitespace-nowrap">
                      ${serv.priceCLP.toLocaleString('es-CL')} CLP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sprints Metodología Ágil */}
            {selectedQuote.sprints && selectedQuote.sprints.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  Plan de Trabajo en Sprints Ágiles:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedQuote.sprints.map((sp) => (
                    <div key={sp.sprintNumber} className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="font-bold text-slate-900">{sp.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{sp.durationWeeks} sem</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <strong className="text-slate-700">Entregables: </strong>
                        {sp.deliverables.join(', ')}
                      </div>
                      <div className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded">
                        <strong>Criterio DoD: </strong> {sp.definitionOfDone}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total & Payment Conditions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white rounded-lg border border-slate-200">
              <div className="space-y-1 text-xs text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Forma de Pago: </span>
                  <span className="font-bold text-slate-900">{selectedQuote.paymentConditionDetails}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Documento: </span>
                  <span>{selectedQuote.taxDocument === 'factura' ? 'Factura Electrónica (+IVA)' : 'Boleta de Honorarios'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Plazo Estimado: </span>
                  <span>{selectedQuote.deliveryTimeDays} días hábiles</span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 block">Inversión Total</span>
                <span className="text-2xl font-bold text-slate-900">
                  ${selectedQuote.totalCLP.toLocaleString('es-CL')} CLP
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editing / Creating Form (Exact layout from screenshots) */}
      {isEditing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-1 font-medium"
              >
                &larr; Volver al cotizador
              </button>
              <h2 className="text-xl font-bold font-serif text-slate-900">Nueva cotización express</h2>
              <p className="text-xs text-slate-500">Crea una cotización ágil con autocompletado y desglose de sprints.</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveQuote();
            }}
            className="space-y-6 text-xs"
          >
            {/* Selector desde CRM */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Seleccionar desde CRM (Reunión agendada o cliente)
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleSelectClient(e.target.value)}
                className="w-full bg-black text-white p-2.5 rounded-lg border border-slate-900 text-xs font-medium focus:outline-none"
              >
                <option value="">- Sin selección manual -</option>
                {state.clients.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} ({cl.company}) - {cl.email}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Al seleccionar, se autocompletan nombre, email, teléfono y empresa.
              </p>
            </div>

            {/* Título y Subtítulo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título del proyecto *</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Ej: Ecommerce Shopify, Landing Page"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subtítulo</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Descripción breve del servicio"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del cliente *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email del cliente</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Empresa</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* Outcome con botón Mejorar con IA */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700">Qué logrará el cliente (Outcome de Valor)</label>
                <button
                  type="button"
                  onClick={handleImproveOutcomeWithAi}
                  disabled={improvingOutcomeAi}
                  className="text-[#DD8396] hover:text-[#c96f83] font-semibold flex items-center gap-1 text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{improvingOutcomeAi ? 'Mejorando...' : 'Mejorar con IA'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900 leading-relaxed"
              ></textarea>
              <p className="text-[10px] text-slate-400">
                Escribe tu idea en bruto. La IA la reforzará, ordenará y hará más persuasiva.
              </p>
            </div>

            {/* Servicios Incluidos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Servicios Incluidos ({services.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="text-xs font-semibold text-slate-800 hover:text-black flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Añadir servicio</span>
                </button>
              </div>

              <div className="space-y-3">
                {services.map((serv, idx) => (
                  <div key={serv.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={serv.title}
                          onChange={(e) => {
                            const updated = [...services];
                            updated[idx].title = e.target.value;
                            setServices(updated);
                          }}
                          className="flex-1 font-semibold text-xs border border-slate-200 rounded-lg p-1.5 bg-white focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={serv.priceCLP}
                          onChange={(e) => {
                            const updated = [...services];
                            updated[idx].priceCLP = Number(e.target.value);
                            setServices(updated);
                          }}
                          className="w-28 text-right font-mono font-bold text-xs border border-slate-200 rounded-lg p-1.5 bg-white focus:outline-none"
                        />
                        <span className="text-[11px] text-slate-500 font-mono">CLP</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-end mb-1">
                        <button
                          type="button"
                          onClick={() => handleImproveServiceWithAi(idx)}
                          disabled={improvingServiceIndex === idx}
                          className="text-[10px] text-[#DD8396] hover:text-[#c96f83] font-semibold flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{improvingServiceIndex === idx ? 'Mejorando...' : 'Mejorar con IA'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={serv.description}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[idx].description = e.target.value;
                          setServices(updated);
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-none leading-relaxed"
                      ></textarea>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Condiciones Comerciales */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-xs block">
                Condiciones Comerciales
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-600 mb-1">Forma de Pago (Predeterminado 100%)</label>
                  <select
                    value={paymentCondition}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setPaymentCondition(val);
                      if (val === '100_anticipado') {
                        setPaymentDetails('100% anticipado para iniciar el desarrollo y reservar el sprint.');
                      } else if (val === '50_50') {
                        setPaymentDetails('50% anticipo para iniciar y 50% al entregar en producción.');
                      } else if (val === '40_30_30') {
                        setPaymentDetails('40% inicio, 30% prototipo aprobado y 30% entrega final.');
                      }
                    }}
                    className="w-full bg-black text-white p-2.5 rounded-lg border border-slate-900 text-xs font-semibold focus:outline-none"
                  >
                    <option value="100_anticipado">100% Anticipado (Recomendado Desarrollo)</option>
                    <option value="50_50">50% Inicial &bull; 50% Final (Negociable)</option>
                    <option value="40_30_30">40% &bull; 30% &bull; 30% (3 Hitos Grandes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Documento Tributario</label>
                  <select
                    value={taxDoc}
                    onChange={(e) => setTaxDoc(e.target.value as any)}
                    className="w-full bg-black text-white p-2.5 rounded-lg border border-slate-900 text-xs font-semibold focus:outline-none"
                  >
                    <option value="boleta">Boleta de Honorarios</option>
                    <option value="factura">Factura Electrónica (+19% IVA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Tiempo de Entrega (Días Hábiles)</label>
                  <input
                    type="number"
                    value={deliveryDays}
                    onChange={(e) => setDeliveryDays(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-mono">
                <span className="text-slate-600">
                  Subtotal: ${totalCLP.toLocaleString('es-CL')} CLP{' '}
                  {taxDoc === 'factura' && `+ IVA ($${ivaCLP.toLocaleString('es-CL')})`}
                </span>
                <span className="text-base font-bold text-slate-900">
                  Total Final: ${grandTotalCLP.toLocaleString('es-CL')} CLP
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Guardar Cotización & Actualizar CRM</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
