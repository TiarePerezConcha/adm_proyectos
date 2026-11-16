import React, { useState } from 'react';
import {
  Calendar,
  Video,
  Clock,
  User,
  Phone,
  Mail,
  Plus,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Send,
  Copy,
  Trash2,
  CalendarPlus,
  Sparkles,
  Check,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { AppState, syncDealStage, saveAppState } from '../../utils/storage';
import { CalendarBooking } from '../../types';
import { syncClientToSupabase, syncDealToSupabase } from '../../services/supabaseSyncService';

interface GoogleCalendarViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

// Generador de URL para agregar evento en Google Calendar con invitados y Google Meet
function buildGoogleCalendarUrl(b: {
  clientName: string;
  clientEmail: string;
  serviceInterest: string;
  message?: string;
  date: string;
  time: string;
  meetUrl: string;
}) {
  const title = encodeURIComponent(`Reunión: ${b.serviceInterest} - ${b.clientName} & Tiare Pérez`);
  const cleanDate = (b.date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  const [hours = '11', minutes = '00'] = (b.time || '11:00').split(':');
  const startHour = hours.padStart(2, '0');
  const startMin = minutes.padStart(2, '0');

  const startD = new Date(`${b.date}T${startHour}:${startMin}:00`);
  const endD = new Date(startD.getTime() + 45 * 60 * 1000);
  const endHour = String(endD.getHours()).padStart(2, '0');
  const endMin = String(endD.getMinutes()).padStart(2, '0');
  const cleanEndDate = endD.toISOString().slice(0, 10).replace(/-/g, '');

  const dates = `${cleanDate}T${startHour}${startMin}00/${cleanEndDate}T${endHour}${endMin}00`;

  const detailsText =
    `Reunión agendada desde formulario de contacto web.\n\n` +
    `👤 Contacto: ${b.clientName}\n` +
    `📧 Correo: ${b.clientEmail}\n` +
    `💼 Oportunidad / Asunto: ${b.serviceInterest}\n` +
    (b.message ? `💬 Mensaje recibido en la web: "${b.message}"\n` : '') +
    `\n📹 Enlace Google Meet: ${b.meetUrl}\n\n` +
    `Organiza: Tiare Pérez Concha (+56 9 5001 1319 | tiare.perezconcha@gmail.com)`;

  const details = encodeURIComponent(detailsText);
  const location = encodeURIComponent(b.meetUrl);
  const guests = encodeURIComponent(`${b.clientEmail},tiare.perezconcha@gmail.com`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&add=${guests}`;
}

export const GoogleCalendarView: React.FC<GoogleCalendarViewProps> = ({ state, onUpdateState }) => {
  // Modal de Agendamiento
  const [showModal, setShowModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [serviceInterest, setServiceInterest] = useState('Oportunidad Laboral / Proyecto Web');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState('11:00');

  // Modal de Redacción de Correo
  const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<CalendarBooking | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendCopyToMe, setSendCopyToMe] = useState(true);
  const [emailMode, setEmailMode] = useState<'automatico' | 'manual'>('automatico');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Plantilla automática por defecto
  const generateTemplateBody = (booking: CalendarBooking) => {
    return (
      `Hola ${booking.clientName},\n\n` +
      `Muchas gracias por contactarme a través de mi sitio web respecto a:\n` +
      `"${booking.message || booking.serviceInterest}"\n\n` +
      `Me encantaría que coordinemos una breve videollamada para conocernos, conversar más a fondo sobre los requerimientos y ver de qué forma puedo colaborar contigo.\n\n` +
      `Te propongo reunirnos el día ${booking.date} a las ${booking.time} hrs (hora de Chile).\n\n` +
      `📹 Enlace de la videollamada (Google Meet):\n${booking.meetUrl}\n\n` +
      `Si este horario te acomoda, por favor confírmame respondiendo este correo. Si prefieres otro horario u otro día, avísame con total confianza y lo coordinamos.\n\n` +
      `¡Quedo muy atenta y que tengas una excelente semana!\n\n` +
      `Saludos cordiales,\n` +
      `Tiare Pérez Concha\n` +
      `Desarrolladora Web & Diseñadora UI\n` +
      `Tel: +56 9 5001 1319 | tiare.perezconcha@gmail.com\n` +
      `Santiago, Chile`
    );
  };

  const handleOpenEmailModal = (booking: CalendarBooking) => {
    setSelectedBookingForEmail(booking);
    setEmailSubject(`Propuesta de reunión: ${booking.serviceInterest} - Tiare Pérez`);
    setEmailBody(generateTemplateBody(booking));
    setEmailMode('automatico');
    setCopiedSuccess(false);
  };

  const handleModeChange = (mode: 'automatico' | 'manual') => {
    setEmailMode(mode);
    if (mode === 'automatico' && selectedBookingForEmail) {
      setEmailBody(generateTemplateBody(selectedBookingForEmail));
    }
  };

  const handleCopyEmailText = () => {
    navigator.clipboard.writeText(emailBody);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleOpenGmail = () => {
    if (!selectedBookingForEmail) return;
    const to = selectedBookingForEmail.clientEmail;
    const cc = sendCopyToMe ? 'tiare.perezconcha@gmail.com' : '';
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to,
      su: emailSubject,
      body: emailBody,
    });
    if (cc) params.set('cc', cc);

    window.open(`https://mail.google.com/mail/?${params.toString()}`, '_blank');
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !email) return;

    const meetId = Math.random().toString(36).substring(2, 8);
    const newBooking: CalendarBooking = {
      id: `cal-${Date.now()}`,
      clientName: clientName.trim(),
      company: (company || clientName).trim(),
      clientEmail: email.trim().toLowerCase(),
      clientPhone: phone.trim(),
      serviceInterest: serviceInterest.trim(),
      message: message.trim(),
      date,
      time,
      meetUrl: `https://meet.google.com/tp-${meetId}`,
      status: 'confirmada',
      crmDealCreated: true,
    };

    // Crear cliente si no existe
    let clientId = `cli-${Date.now()}`;
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
          country: 'Chile',
          source: 'Formulario Web Personal (Hablemos)',
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ];
    }

    // ACCIÓN AUTOMÁTICA AL CRM: Mover o crear deal en 'reunion_agendada'
    const updatedDeals = syncDealStage(state.deals, clientId, 'reunion_agendada', {
      clientName,
      company: company || clientName,
      email,
      phone,
      title: `${serviceInterest} - ${company || clientName}`,
      meetingDate: `${date} ${time}`,
      meetLink: newBooking.meetUrl,
      valueCLP: 850000,
    });

    const newState: AppState = {
      ...state,
      clients: newClients,
      deals: updatedDeals,
      calendarBookings: [newBooking, ...state.calendarBookings],
    };

    onUpdateState(newState);
    saveAppState(newState);
    setShowModal(false);

    // Limpiar formulario
    setClientName('');
    setEmail('');
    setCompany('');
    setMessage('');

    // Sincronización en Supabase
    const affectedClient = newClients.find((c) => c.id === clientId);
    if (affectedClient) syncClientToSupabase(affectedClient);
    const affectedDeal = updatedDeals.find((d) => d.clientId === clientId);
    if (affectedDeal) syncDealToSupabase(affectedDeal);

    // Abrir inmediatamente modal de correo para este cliente
    handleOpenEmailModal(newBooking);
  };

  const handleDeleteBooking = (id: string) => {
    const updated = state.calendarBookings.filter((b) => b.id !== id);
    const newState = { ...state, calendarBookings: updated };
    onUpdateState(newState);
    saveAppState(newState);
  };

  const handleUpdateStatus = (id: string, status: 'confirmada' | 'completada' | 'cancelada') => {
    const updated = state.calendarBookings.map((b) => (b.id === id ? { ...b, status } : b));
    const newState = { ...state, calendarBookings: updated };
    onUpdateState(newState);
    saveAppState(newState);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 text-slate-200 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Calendar className="w-6 h-6 text-emerald-400" />
            Google Calendar & Agendamientos Web
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona los contactos recibidos desde tu sitio web personal. Envía citas personalizadas por correo y sincroniza con Google Calendar & Meet.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition active:scale-[0.99] cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agendar Cita desde Mensaje Web</span>
        </button>
      </div>

      {/* Tarjeta de Estado del Formulario Web */}
      <div className="bg-[#0F141C] border border-[#202634] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Formulario de Contacto Web (Hablemos)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <span className="text-[11px] text-slate-400">
              Mensajes entrantes dirigidos a <strong className="text-emerald-400">tiare.perezconcha@gmail.com</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Google Calendar & Meet Listo
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-300">
            Auto-Sync CRM
          </span>
        </div>
      </div>

      {/* Grid de Agendamientos */}
      {state.calendarBookings.length === 0 ? (
        <div className="bg-[#0F141C] border border-dashed border-[#202634] rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No tienes citas agendadas todavía</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Cuando recibas un correo desde el formulario de tu portafolio, haz clic en el botón de arriba para registrar la cita, enviarle la invitación por correo al cliente y agendarla en tu Google Calendar.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agendar mi primera cita</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.calendarBookings.map((b) => {
            const calendarUrl = buildGoogleCalendarUrl(b);

            return (
              <div
                key={b.id}
                className="bg-[#0F141C] border border-[#202634] hover:border-slate-700 rounded-2xl p-5 space-y-4 transition shadow-sm"
              >
                {/* Cabecera de la tarjeta */}
                <div className="flex items-center justify-between border-b border-[#1E2532] pb-3">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      {b.date} &bull; {b.time} hrs
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={b.status}
                      onChange={(e) => handleUpdateStatus(b.id, e.target.value as any)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase outline-none cursor-pointer ${
                        b.status === 'confirmada'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
                          : b.status === 'completada'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-800/50'
                          : 'bg-rose-950/80 text-rose-300 border-rose-800/50'
                      }`}
                    >
                      <option value="confirmada">Confirmada</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                    <button
                      onClick={() => handleDeleteBooking(b.id)}
                      title="Eliminar cita"
                      className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Datos del contacto */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{b.clientName}</span>
                      {b.company && b.company !== b.clientName && (
                        <span className="text-[11px] text-slate-400 font-normal">({b.company})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <a href={`mailto:${b.clientEmail}`} className="hover:text-emerald-400 transition-colors">
                        {b.clientEmail}
                      </a>
                    </span>
                    {b.clientPhone && b.clientPhone !== '+56 9 ' && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{b.clientPhone}</span>
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 bg-[#090C11] rounded-xl border border-[#1b222e] text-[11px] space-y-1">
                    <div className="text-slate-400 font-medium">
                      <span className="text-slate-500">Motivo: </span>
                      <span className="text-emerald-300">{b.serviceInterest}</span>
                    </div>
                    {b.message && (
                      <div className="text-slate-300 italic pt-1 border-t border-slate-800/60 leading-relaxed text-[11px]">
                        &quot;{b.message}&quot;
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="pt-2 border-t border-[#1E2532] flex flex-wrap items-center justify-between gap-2">
                  {/* Botón 1: Añadir a Google Calendar */}
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 rounded-lg text-xs font-medium transition cursor-pointer"
                    title="Añade esta cita directamente a tu Google Calendar con Meet e invitados listos"
                  >
                    <CalendarPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Google Calendar</span>
                    <ExternalLink className="w-3 h-3 text-emerald-400/80" />
                  </a>

                  {/* Botón 2: Enviar / Redactar Correo al Cliente */}
                  <button
                    onClick={() => handleOpenEmailModal(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-rose-400" />
                    <span>Enviar Cita por Correo</span>
                  </button>

                  {/* Botón 3: Google Meet */}
                  <a
                    href={b.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 text-blue-300 rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-blue-400" />
                    <span>Meet</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: REGISTRAR CITA DESDE FORMULARIO WEB */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0F141C] border border-[#202634] p-6 rounded-2xl w-full max-w-lg space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-emerald-400" />
                Agendar Cita desde Mensaje de la Web
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Ingresa los datos de la persona que te escribió por tu formulario web. Podrás enviar la cita por correo y agregarla a tu Google Calendar de inmediato.
            </p>

            <form onSubmit={handleCreateBooking} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej: Marcelo Díaz"
                    className="w-full bg-[#0A0C10] border border-[#202634] focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Empresa / Proyecto</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ej: Tienda Online / Empresa"
                    className="w-full bg-[#0A0C10] border border-[#202634] focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Correo de Contacto *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="w-full bg-[#0A0C10] border border-[#202634] focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0A0C10] border border-[#202634] focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motivo / Tipo de Contacto</label>
                <select
                  value={serviceInterest}
                  onChange={(e) => setServiceInterest(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-[#202634] focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                >
                  <option value="Oportunidad Laboral / Trabajo">Oportunidad Laboral / Trabajo</option>
                  <option value="Desarrollo Web & E-commerce">Desarrollo Web & E-commerce</option>
                  <option value="Práctica Profesional / Colaboración">Práctica Profesional / Colaboración</option>
                  <option value="Rediseño & Optimización CRO">Rediseño & Optimización CRO</option>
                  <option value="Branding & Identidad">Branding & Identidad</option>
                  <option value="Consulta General">Consulta General</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mensaje recibido en el formulario (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Pega aquí el mensaje que te envió el cliente desde tu web..."
                  className="w-full bg-[#0A0C10] border border-[#202634] focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fecha de la Cita</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0A0C10] border border-[#202634] focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hora (Chile)</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#0A0C10] border border-[#202634] focus:border-emerald-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl flex items-center justify-between text-[11px] text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-emerald-400" /> Se generará sala de Google Meet automáticamente
                </span>
                <span className="font-mono text-emerald-400">45 minutos</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950 transition cursor-pointer"
                >
                  Confirmar y Redactar Correo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REDACCIÓN Y ENVÍO DE CORREO AL CLIENTE */}
      {selectedBookingForEmail && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0F141C] border border-[#202634] p-6 rounded-2xl w-full max-w-2xl space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-rose-400" />
                  Enviar Invitación por Correo a {selectedBookingForEmail.clientName}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Destinatario: <strong className="text-white">{selectedBookingForEmail.clientEmail}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBookingForEmail(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Selector de Modo: Automático vs Redacción Libre */}
            <div className="flex items-center justify-between bg-[#0A0C10] p-1.5 rounded-xl border border-gray-800">
              <span className="text-[11px] font-semibold text-slate-400 px-2">Modo de Envío:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleModeChange('automatico')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    emailMode === 'automatico'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Plantilla Automática</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('manual')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    emailMode === 'manual'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Redactar Libremente</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Asunto del Correo</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-[#202634] focus:border-rose-500 rounded-xl p-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Cuerpo del Mensaje</span>
                  <span className="text-[10px] text-slate-500">Puedes editar cualquier texto antes de enviar</span>
                </label>
                <textarea
                  rows={9}
                  value={emailBody}
                  onChange={(e) => {
                    setEmailBody(e.target.value);
                    if (emailMode === 'automatico') setEmailMode('manual');
                  }}
                  className="w-full bg-[#0A0C10] border border-[#202634] focus:border-rose-500 rounded-xl p-3 text-white outline-none font-mono text-[11px] leading-relaxed"
                />
              </div>

              {/* Casilla de Enviar Copia a Mí Misma */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendCopyToMe}
                  onChange={(e) => setSendCopyToMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <span>
                  Enviarme copia a mi correo (<strong className="text-white">tiare.perezconcha@gmail.com</strong>)
                </span>
              </label>
            </div>

            {/* Botones de Envío y Copia */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEmailText}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSuccess ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForEmail(null)}
                  className="px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-400 rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={handleOpenGmail}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold rounded-xl transition shadow-lg shadow-rose-950/50 flex items-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Send className="w-4 h-4" />
                  <span>Abrir en Gmail listo para Enviar</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
