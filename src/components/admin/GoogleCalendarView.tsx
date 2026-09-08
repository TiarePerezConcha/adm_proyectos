import React, { useState } from 'react';
import { Calendar, Video, Clock, User, Phone, Mail, Plus, CheckCircle, ExternalLink } from 'lucide-react';
import { AppState, syncDealStage, saveAppState } from '../../utils/storage';
import { CalendarBooking } from '../../types';
import { syncClientToSupabase, syncDealToSupabase } from '../../services/supabaseSyncService';

interface GoogleCalendarViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

export const GoogleCalendarView: React.FC<GoogleCalendarViewProps> = ({ state, onUpdateState }) => {
  const [showModal, setShowModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [serviceInterest, setServiceInterest] = useState('Ecommerce Shopify Personalizado');
  const [date, setDate] = useState('2026-09-15');
  const [time, setTime] = useState('15:00');

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !email) return;

    const meetId = Math.random().toString(36).substring(2, 8);
    const newBooking: CalendarBooking = {
      id: `cal-${Date.now()}`,
      clientName,
      company: company || clientName,
      clientEmail: email,
      clientPhone: phone,
      serviceInterest,
      date,
      time,
      meetUrl: `https://meet.google.com/lsc-${meetId}`,
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
          source: 'Google Calendar / Webhook',
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
    setClientName('');
    setEmail('');
    setCompany('');

    // Sincronización en la nube Supabase
    const affectedClient = newClients.find((c) => c.id === clientId);
    if (affectedClient) syncClientToSupabase(affectedClient);
    const affectedDeal = updatedDeals.find((d) => d.clientId === clientId);
    if (affectedDeal) syncDealToSupabase(affectedDeal);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 font-mono">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Google Calendar & Agendamientos Web
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Reuniones sincronizadas desde tu sitio web personal. Cada nueva cita crea un deal en el CRM.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium shadow-lg transition-colors self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Simular Agendamiento Web</span>
        </button>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl flex items-center justify-between flex-wrap gap-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <div>
            <span className="text-white font-bold">Webhook Activo: </span>
            <span className="text-slate-400">https://luissalascortes.dev/api/calendar-webhook</span>
          </div>
        </div>
        <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded text-[11px]">
          Conexión Google Meet OK
        </span>
      </div>

      {/* Booking Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.calendarBookings.map((b) => (
          <div
            key={b.id}
            className="bg-[#12151C] border border-[#202634] p-5 rounded-xl space-y-4 hover:border-[#303848] transition-colors"
          >
            <div className="flex items-center justify-between border-b border-[#202634] pb-3 font-mono">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>{b.date} &bull; {b.time} hrs</span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40">
                {b.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-white font-semibold">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{b.clientName} ({b.company})</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{b.clientEmail}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{b.clientPhone}</span>
              </div>

              <div className="p-2.5 bg-[#0A0C10] rounded border border-[#1b202c] text-[11px] text-slate-300">
                <span className="text-slate-500">Servicio de interés: </span>
                <span className="text-slate-200">{b.serviceInterest}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#202634]">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Deal en CRM Activo</span>
              </div>

              <a
                href={b.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded text-xs font-mono transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Google Meet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Simular Agendamiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#12151C] border border-[#202634] p-6 rounded-2xl w-full max-w-md space-y-4 font-mono text-xs">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Simular Cita Recibida desde Web
            </h2>
            <p className="text-slate-400 text-[11px]">
              Al confirmar, se agendará la cita y se insertará automáticamente un Deal en la etapa &quot;Reunión Agendada&quot; del CRM.
            </p>

            <form onSubmit={handleCreateBooking} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Nombre Prospecto *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Marcelo Díaz"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Empresa / Marca</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ej: MBJeans"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@ejemplo.cl"
                    className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Servicio de Interés</label>
                <select
                  value={serviceInterest}
                  onChange={(e) => setServiceInterest(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Ecommerce Shopify Personalizado">Ecommerce Shopify Personalizado</option>
                  <option value="Rediseño & Optimización CRO">Rediseño & Optimización CRO</option>
                  <option value="Desarrollo Web Headless + IA">Desarrollo Web Headless + IA</option>
                  <option value="Branding & Sistema de Identidad">Branding & Sistema de Identidad</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Hora</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 bg-transparent hover:bg-slate-800 text-slate-400 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                >
                  Confirmar Agendamiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
