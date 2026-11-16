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
  Inbox,
  AlertTriangle,
  Loader2,
  Share2
} from 'lucide-react';
import { AppState, syncDealStage, saveAppState } from '../../utils/storage';
import { CalendarBooking } from '../../types';
import { syncClientToSupabase, syncDealToSupabase } from '../../services/supabaseSyncService';

interface GoogleCalendarViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
}

const GOOGLE_CLIENT_ID = (
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '792714090876-n3d5t7gk4bnis9njej9jad7sr4fjj9ak.apps.googleusercontent.com'
).trim();

// Caché persistente de token de Google Calendar en sessionStorage para evitar pedir cuenta en cada recarga
function getStoredCalendarToken(): string | null {
  try {
    const token = sessionStorage.getItem('lsc_gcal_token');
    const exp = Number(sessionStorage.getItem('lsc_gcal_token_exp') || '0');
    if (token && Date.now() < exp) {
      return token;
    }
  } catch {}
  return null;
}

function setStoredCalendarToken(token: string) {
  try {
    sessionStorage.setItem('lsc_gcal_token', token);
    // 50 minutos de vigencia (el token dura 60 min en Google)
    sessionStorage.setItem('lsc_gcal_token_exp', String(Date.now() + 50 * 60 * 1000));
  } catch {}
}

// Sincronización 100% Automática con Google Calendar API (Crea evento, genera Meet real y envía invitaciones)
async function syncToGoogleCalendarApi(booking: {
  clientName: string;
  clientEmail: string;
  serviceInterest: string;
  message?: string;
  date: string;
  time: string;
  organizerEmail?: string;
  sendUpdatesToClient?: boolean;
}): Promise<{ success: boolean; meetUrl?: string; eventLink?: string; googleEventId?: string; error?: string }> {
  const organizer = booking.organizerEmail || 'tiare.carrera.2014@gmail.com';
  const updateMode = booking.sendUpdatesToClient ? 'all' : 'none';

  // Función para ejecutar la llamada a la API con un token válido
  const callCalendarApiWithToken = async (accessToken: string) => {
    const [h = '11', m = '00'] = (booking.time || '11:00').split(':');
    const startDateTime = `${booking.date}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
    const startD = new Date(startDateTime);
    const endD = new Date(startD.getTime() + 45 * 60 * 1000);
    const endHours = String(endD.getHours()).padStart(2, '0');
    const endMins = String(endD.getMinutes()).padStart(2, '0');
    const endDateTime = `${endD.toISOString().slice(0, 10)}T${endHours}:${endMins}:00`;

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=${updateMode}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: `Reunión: ${booking.serviceInterest} - ${booking.clientName} & Tiare Pérez`,
          description:
            `¡Hola ${booking.clientName}! 👋\n\n` +
            `Te confirmo nuestra reunión de coordinación para revisar requerimientos de: ${booking.serviceInterest}.\n\n` +
            (booking.message ? `📌 Contexto de tu solicitud:\n"${booking.message}"\n\n` : '') +
            `💻 Modalidad: Videollamada Google Meet (puedes unirte directamente con el botón oficial de la invitación).\n` +
            `📅 Puedes confirmar tu asistencia haciendo clic en "Sí" en los botones de abajo para que se sincronice en tu calendario.\n\n` +
            `Si necesitas reprogramar o tienes alguna consulta previa, avísame con confianza respondiendo a este mensaje o vía WhatsApp (+56 9 7809 2187).\n\n` +
            `¡Nos vemos en la reunión!\n\n` +
            `Saludos cordiales,\n` +
            `Tiare Pérez Concha\n` +
            `Desarrolladora Web & Diseñadora UI\n` +
            `Tel / WhatsApp: +56 9 7809 2187 | ${organizer}`,
          start: { dateTime: startDateTime, timeZone: 'America/Santiago' },
          end: { dateTime: endDateTime, timeZone: 'America/Santiago' },
          attendees: booking.sendUpdatesToClient
            ? [{ email: booking.clientEmail }, { email: organizer }]
            : [{ email: organizer }],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 60 },
              { method: 'popup', minutes: 10 },
            ],
          },
          conferenceData: {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
      }
    );

    const eventData = await res.json();
    if (eventData.error) {
      return {
        success: false,
        error: eventData.error.message || 'Error devuelto por la API de Google Calendar',
      };
    }

    const realMeetUrl =
      eventData.hangoutLink ||
      eventData.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri ||
      '';
    const eventLink = eventData.htmlLink || '';

    return { success: true, meetUrl: realMeetUrl, eventLink, googleEventId: eventData.id };
  };

  // 1. Si ya tenemos token válido en sessionStorage, lo usamos directamente sin ventana emergente
  const storedToken = getStoredCalendarToken();
  if (storedToken) {
    try {
      const result = await callCalendarApiWithToken(storedToken);
      if (result.success) return result;
      // Si falló por expiración silenciosa en Google, limpiamos
      sessionStorage.removeItem('lsc_gcal_token');
      sessionStorage.removeItem('lsc_gcal_token_exp');
    } catch {
      sessionStorage.removeItem('lsc_gcal_token');
      sessionStorage.removeItem('lsc_gcal_token_exp');
    }
  }

  return new Promise((resolve) => {
    let finished = false;
    const safeResolve = (res: { success: boolean; meetUrl?: string; eventLink?: string; error?: string }) => {
      if (!finished) {
        finished = true;
        clearTimeout(timer);
        resolve(res);
      }
    };

    // Timeout de seguridad de 14 segundos
    const timer = setTimeout(() => {
      safeResolve({
        success: false,
        error:
          'Se cerró o tardó la ventana de Google. Si ves Error 403 o 400, revisa los orígenes autorizados o agrega tu correo a "Usuarios de prueba".',
      });
    }, 14000);

    if (!window.google?.accounts?.oauth2) {
      safeResolve({
        success: false,
        error: 'El servicio de Google aún no está cargado. Recarga la página o inténtalo en unos segundos.',
      });
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        hint: organizer, // Ayuda a Google a elegir directamente tu cuenta activa sin preguntar cuál de tus 8 cuentas usar
        error_callback: (err: any) => {
          safeResolve({
            success: false,
            error:
              err?.message ||
              'Acceso denegado en la ventana de Google. Verifica que tu correo esté en "Usuarios de prueba" en Google Cloud.',
          });
        },
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            safeResolve({
              success: false,
              error:
                tokenResponse.error === 'access_denied'
                  ? 'Acceso denegado (Error 403): Tu correo no está en la lista de "Usuarios de prueba" en Google Cloud Console.'
                  : tokenResponse.error_description || tokenResponse.error,
            });
            return;
          }

          if (tokenResponse.access_token) {
            // Guardamos en sessionStorage para reutilizar sin popups
            setStoredCalendarToken(tokenResponse.access_token);

            try {
              const res = await callCalendarApiWithToken(tokenResponse.access_token);
              safeResolve(res);
            } catch (err: any) {
              safeResolve({ success: false, error: err.message || 'Error al conectar con la API de Google' });
            }
          }
        },
      });

      // Se envía hint de la cuenta activa para evitar popup de selector de cuentas
      tokenClient.requestAccessToken({ hint: organizer, prompt: '' });
    } catch (e: any) {
      safeResolve({ success: false, error: e.message || 'Error al inicializar el conector de Google' });
    }
  });
}

async function ensureCalendarAccessToken(organizerHint = 'tiare.carrera.2014@gmail.com'): Promise<string | null> {
  const stored = getStoredCalendarToken();
  if (stored) {
    return stored;
  }
  return new Promise((resolve) => {
    if (!window.google?.accounts?.oauth2) {
      resolve(null);
      return;
    }
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        hint: organizerHint,
        callback: (tokenResponse: any) => {
          if (tokenResponse?.access_token) {
            setStoredCalendarToken(tokenResponse.access_token);
            resolve(tokenResponse.access_token);
          } else {
            resolve(null);
          }
        },
        error_callback: () => resolve(null),
      });
      tokenClient.requestAccessToken({ hint: organizerHint, prompt: '' });
    } catch {
      resolve(null);
    }
  });
}

async function deleteGoogleCalendarEvent(
  googleEventId?: string,
  clientName?: string,
  serviceInterest?: string
): Promise<boolean> {
  try {
    const token = await ensureCalendarAccessToken();
    if (!token) return false;

    let eventIdToDelete = googleEventId;

    // Si no tenemos el ID guardado directamente (ej: citas creadas antes de la actualización), lo buscamos en Google Calendar
    if (!eventIdToDelete && (clientName || serviceInterest)) {
      const query = clientName || serviceInterest || '';
      const searchRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?q=${encodeURIComponent(query)}&maxResults=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (searchRes.ok) {
        const data = await searchRes.json();
        const found = data.items?.find((item: any) =>
          item.summary?.includes(query) || item.description?.includes(query)
        );
        if (found?.id) {
          eventIdToDelete = found.id;
        }
      }
    }

    if (!eventIdToDelete) return false;

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventIdToDelete}?sendUpdates=none`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function rescheduleGoogleCalendarEvent(
  googleEventId: string,
  newDate: string,
  newTime: string
): Promise<boolean> {
  try {
    const token = await ensureCalendarAccessToken();
    if (!token) return false;
    const [h = '11', m = '00'] = (newTime || '11:00').split(':');
    const startDateTime = `${newDate}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
    const startD = new Date(startDateTime);
    const endD = new Date(startD.getTime() + 45 * 60 * 1000);
    const endHours = String(endD.getHours()).padStart(2, '0');
    const endMins = String(endD.getMinutes()).padStart(2, '0');
    const endDateTime = `${endD.toISOString().slice(0, 10)}T${endHours}:${endMins}:00`;

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}?sendUpdates=none`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: { dateTime: startDateTime, timeZone: 'America/Santiago' },
          end: { dateTime: endDateTime, timeZone: 'America/Santiago' },
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export const GoogleCalendarView: React.FC<GoogleCalendarViewProps> = ({ state, onUpdateState }) => {
  // Modal de Agendamiento
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifyGoogleImmediately, setNotifyGoogleImmediately] = useState(false);
  const [modalErrorMsg, setModalErrorMsg] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal de Reagendamiento
  const [bookingToReschedule, setBookingToReschedule] = useState<CalendarBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [serviceInterest, setServiceInterest] = useState('Oportunidad Laboral / Trabajo');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState('11:00');
  const [preferredMeetUrl, setPreferredMeetUrl] = useState(() => {
    return localStorage.getItem('user_preferred_meet_url') || 'https://meet.google.com/aeo-fngf-air';
  });

  // Cuenta organizadora dinámica (Detectada automáticamente de la sesión activa en LoginGuard)
  const activeOrganizerEmail =
    sessionStorage.getItem('lsc_authenticated_user') ||
    state.settings.userSecurity?.email ||
    'tiare.carrera.2014@gmail.com';

  // Modal de Redacción de Correo
  const [selectedBookingForEmail, setSelectedBookingForEmail] = useState<CalendarBooking | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendCopyToMe, setSendCopyToMe] = useState(true);
  const [emailMode, setEmailMode] = useState<'automatico' | 'manual'>('automatico');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isCancellationEmail, setIsCancellationEmail] = useState(false);
  const [cancelReason, setCancelReason] = useState<'cliente' | 'agenda'>('cliente');

  // Plantilla automática por defecto
  const generateTemplateBody = (booking: CalendarBooking) => {
    return (
      `Hola ${booking.clientName},\n\n` +
      `Muchas gracias por contactarme a través de mi sitio web respecto a:\n` +
      `"${booking.message || booking.serviceInterest}"\n\n` +
      `Me encantaría que coordinemos una breve videollamada para conocernos, conversar más a fondo sobre los requerimientos y ver de qué forma puedo colaborar contigo.\n\n` +
      `Te propongo reunirnos el día ${booking.date} a las ${booking.time} hrs (hora de Chile).\n\n` +
      (booking.meetUrl && !booking.meetUrl.includes('whoops')
        ? `📹 Enlace de la videollamada (Google Meet Oficial):\n${booking.meetUrl}\n\n`
        : '') +
      `Si este horario te acomoda, por favor confírmame respondiendo este correo. Si prefieres otro horario u otro día, avísame con total confianza y lo coordinamos.\n\n` +
      `¡Quedo muy atenta y que tengas una excelente semana!\n\n` +
      `Saludos cordiales,\n` +
      `Tiare Pérez Concha\n` +
      `Desarrolladora Web & Diseñadora UI\n` +
      `Tel / WhatsApp: +56 9 7809 2187 | ${activeOrganizerEmail}\n` +
      `Santiago, Chile`
    );
  };

  const generateCancellationBody = (booking: CalendarBooking, reason: 'cliente' | 'agenda') => {
    if (reason === 'cliente') {
      return (
        `Hola ${booking.clientName},\n\n` +
        `Atendiendo a tu solicitud, te confirmo que la reunión que teníamos programada para el día ${booking.date} a las ${booking.time} hrs ha sido cancelada.\n\n` +
        `Entiendo perfectamente que surgen imprevistos o cambios de planes. Si más adelante deseas retomar la conversación o coordinar una nueva cita cuando tu tiempo te lo permita, no dudes en escribirme o responder a este correo.\n\n` +
        `¡Quedo a tu disposición y que tengas una excelente semana!\n\n` +
        `Saludos cordiales,\n` +
        `Tiare Pérez Concha\n` +
        `Desarrolladora Web & Diseñadora UI\n` +
        `Tel / WhatsApp: +56 9 7809 2187 | ${activeOrganizerEmail}\n` +
        `Santiago, Chile`
      );
    } else {
      return (
        `Hola ${booking.clientName},\n\n` +
        `Te escribo para informarte que por motivos de fuerza mayor en mi agenda no me será posible asistir a nuestra reunión programada para el día ${booking.date} a las ${booking.time} hrs.\n\n` +
        `Te ofrezco sinceras disculpas por cualquier inconveniente que esto te cause. Tu proyecto me interesa mucho; si lo deseas, podemos reagendar para otro día u horario respondiendo directamente a este correo.\n\n` +
        `¡Agradezco mucho tu comprensión y quedo atenta a tu respuesta!\n\n` +
        `Saludos cordiales,\n` +
        `Tiare Pérez Concha\n` +
        `Desarrolladora Web & Diseñadora UI\n` +
        `Tel / WhatsApp: +56 9 7809 2187 | ${activeOrganizerEmail}\n` +
        `Santiago, Chile`
      );
    }
  };

  const handleCancelReasonChange = (reason: 'cliente' | 'agenda') => {
    setCancelReason(reason);
    if (selectedBookingForEmail) {
      setEmailBody(generateCancellationBody(selectedBookingForEmail, reason));
    }
  };

  const handleOpenEmailModal = (booking: CalendarBooking) => {
    setIsCancellationEmail(false);
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
    const cc = sendCopyToMe ? activeOrganizerEmail : '';
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

  // AGENDAMIENTO AUTOMÁTICO VÍA GOOGLE CALENDAR API
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !email) return;

    setIsSubmitting(true);
    setSyncStatusMsg(null);

    // 1. Llamar a la API de Google Calendar en segundo plano
    const apiResult = await syncToGoogleCalendarApi({
      clientName: clientName.trim(),
      clientEmail: email.trim().toLowerCase(),
      serviceInterest: serviceInterest.trim(),
      message: message.trim(),
      date,
      time,
      organizerEmail: activeOrganizerEmail,
      sendUpdatesToClient: notifyGoogleImmediately,
    });

    let finalMeetUrl = apiResult.meetUrl || '';
    if (!finalMeetUrl) {
      // Usar sala fija / permanente para evitar que /new genere salas aleatorias no sincronizadas
      finalMeetUrl = preferredMeetUrl.trim() || 'https://meet.google.com/aeo-fngf-air';
    }

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
      meetUrl: finalMeetUrl,
      status: 'confirmada',
      crmDealCreated: true,
      googleEventId: apiResult.googleEventId,
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
    setIsSubmitting(false);

    if (apiResult.success) {
      setSyncStatusMsg({
        type: 'success',
        text: '✅ ¡Cita creada en Google Calendar! Se generó una sala Google Meet oficial y Google envió las invitaciones por correo automáticamente.',
      });
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: `Aviso: Se guardó en el CRM local, pero Google Calendar reportó: ${apiResult.error || 'Permiso cancelado'}. Puedes usar el enlace directo.`,
      });
    }

    // Limpiar formulario y cerrar
    setShowModal(false);
    setClientName('');
    setEmail('');
    setCompany('');
    setMessage('');

    // Sincronización en Supabase
    const affectedClient = newClients.find((c) => c.id === clientId);
    if (affectedClient) syncClientToSupabase(affectedClient);
    const affectedDeal = updatedDeals.find((d) => d.clientId === clientId);
    if (affectedDeal) syncDealToSupabase(affectedDeal);

    // Nota: No abrimos automáticamente el modal de correo ni redirigimos a Gmail.
    // Google Calendar API ya envió la invitación formal con Meet al cliente si estaba marcado el check.
    // Si la usuaria desea enviar un correo manual adicional, puede hacer clic en "Ver Texto de Correo" en la tarjeta.
  };

  const handleDeleteBooking = async (id: string) => {
    const target = state.calendarBookings.find((b) => b.id === id);
    if (!target) return;

    if (confirm(`¿Eliminar la cita con ${target.clientName}? Si está en Google Calendar, también se removerá.`)) {
      setSyncStatusMsg({ type: 'success', text: `Eliminando cita con ${target.clientName} de Google Calendar...` });
      deleteGoogleCalendarEvent(target.googleEventId, target.clientName, target.serviceInterest)
        .then((ok) => {
          if (ok) {
            setSyncStatusMsg({ type: 'success', text: `✓ Cita eliminada de Google Calendar en vivo.` });
            setTimeout(() => setSyncStatusMsg(null), 4000);
          }
        })
        .catch(() => {});

      const updatedBookings = state.calendarBookings.filter((b) => b.id !== id);
      // Sincronizar deals del CRM: si el deal estaba en etapa reunion_agendada para este cliente, se remueve
      const updatedDeals = state.deals.filter(
        (d) =>
          !(
            (d.clientName.toLowerCase() === target.clientName.toLowerCase() ||
              d.email.toLowerCase() === target.clientEmail.toLowerCase()) &&
            d.stage === 'reunion_agendada'
          )
      );
      const newState = { ...state, calendarBookings: updatedBookings, deals: updatedDeals };
      onUpdateState(newState);
      saveAppState(newState);
    }
  };

  const handleUpdateStatus = (id: string, status: 'confirmada' | 'completada' | 'cancelada') => {
    const target = state.calendarBookings.find((b) => b.id === id);
    if (target && status === 'cancelada') {
      // 1. Eliminar automáticamente de Google Calendar API (con fallback por nombre si no tiene ID)
      setSyncStatusMsg({ type: 'success', text: `Cancelando cita con ${target.clientName} en Google Calendar...` });
      deleteGoogleCalendarEvent(target.googleEventId, target.clientName, target.serviceInterest)
        .then((ok) => {
          if (ok) {
            setSyncStatusMsg({ type: 'success', text: `✓ Cita de ${target.clientName} eliminada de Google Calendar.` });
            setTimeout(() => setSyncStatusMsg(null), 4000);
          }
        })
        .catch((err) => console.warn('Error al borrar de Google Calendar:', err));

      // 2. Abrir modal de cancelación con motivos seleccionables
      setIsCancellationEmail(true);
      setCancelReason('cliente');
      setSelectedBookingForEmail(target);
      setEmailSubject(`Cancelación de reunión: ${target.serviceInterest} - Tiare Pérez`);
      setEmailBody(generateCancellationBody(target, 'cliente'));
    }
    const updated = state.calendarBookings.map((b) => (b.id === id ? { ...b, status } : b));
    const newState = { ...state, calendarBookings: updated };
    onUpdateState(newState);
    saveAppState(newState);
  };

  // Abrir Modal de Reagendamiento
  const handleOpenRescheduleModal = (booking: CalendarBooking) => {
    setBookingToReschedule(booking);
    setRescheduleDate(booking.date);
    setRescheduleTime(booking.time);
  };

  // Confirmar Reagendamiento
  const handleConfirmReschedule = async () => {
    if (!bookingToReschedule || !rescheduleDate || !rescheduleTime) return;
    setIsRescheduling(true);

    // 1. Actualizar evento en Google Calendar si tiene ID de evento
    if (bookingToReschedule.googleEventId) {
      await rescheduleGoogleCalendarEvent(
        bookingToReschedule.googleEventId,
        rescheduleDate,
        rescheduleTime
      );
    }

    // 2. Actualizar estado local y CRM
    const updatedBookings = state.calendarBookings.map((b) =>
      b.id === bookingToReschedule.id
        ? {
            ...b,
            date: rescheduleDate,
            time: rescheduleTime,
            rescheduledAt: new Date().toISOString(),
          }
        : b
    );

    const updatedDeals = state.deals.map((d) =>
      d.email === bookingToReschedule.clientEmail || d.clientName === bookingToReschedule.clientName
        ? { ...d, meetingDate: `${rescheduleDate} ${rescheduleTime}` }
        : d
    );

    const newState: AppState = {
      ...state,
      calendarBookings: updatedBookings,
      deals: updatedDeals,
    };

    onUpdateState(newState);
    saveAppState(newState);
    setIsRescheduling(false);

    const currentBooking = {
      ...bookingToReschedule,
      date: rescheduleDate,
      time: rescheduleTime,
    };
    setBookingToReschedule(null);

    // 3. Abrir redactor de correo con plantilla de reprogramación
    setSelectedBookingForEmail(currentBooking);
    setEmailSubject(`Reprogramación de reunión: ${currentBooking.serviceInterest} - Tiare Pérez`);
    setEmailBody(
      `Hola ${currentBooking.clientName},\n\n` +
      `Te escribo para coordinar la reprogramación de nuestra videollamada respecto a:\n` +
      `"${currentBooking.serviceInterest}".\n\n` +
      `Te propongo que nos reunamos el nuevo día ${rescheduleDate} a las ${rescheduleTime} hrs (hora de Chile).\n\n` +
      (currentBooking.meetUrl
        ? `📹 Enlace de la videollamada (se mantiene la misma sala oficial de Google Meet):\n${currentBooking.meetUrl}\n\n`
        : '') +
      `Por favor confírmame respondiendo este correo si este nuevo horario te acomoda o si prefieres otra fecha.\n\n` +
      `¡Quedo muy atenta y que tengas una excelente semana!\n\n` +
      `Saludos cordiales,\n` +
      `Tiare Pérez Concha\n` +
      `Desarrolladora Web & Diseñadora UI\n` +
      `Tel / WhatsApp: +56 9 7809 2187 | ${activeOrganizerEmail}`
    );
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
            Sincronización automática de reuniones con Google Calendar API & Google Meet oficial. Cada cita envía invitaciones por correo y actualiza tu CRM.
          </p>
        </div>

        <button
          onClick={() => {
            setSyncStatusMsg(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition active:scale-[0.99] cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agendar Cita con Google Calendar API</span>
        </button>
      </div>

      {syncStatusMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 border ${
            syncStatusMsg.type === 'success'
              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
              : 'bg-amber-950/50 text-amber-300 border-amber-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncStatusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{syncStatusMsg.text}</span>
          </div>
          <button
            onClick={() => setSyncStatusMsg(null)}
            className="text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tarjeta de Estado de la Conexión de Google */}
      <div className="bg-[#0F141C] border border-[#202634] p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Google Calendar API: Habilitada</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <span className="text-[11px] text-slate-400">
              Cuenta organizadora: <strong className="text-emerald-400">{activeOrganizerEmail}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Salas Google Meet Oficiales
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-300">
            Auto-Invitación por Correo
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
            Cuando recibas un correo desde el formulario de tu portafolio, haz clic en el botón de arriba para registrar la cita. Se creará automáticamente en tu Google Calendar y le enviará la invitación oficial de Meet al cliente.
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
            // Usar el enlace guardado en la cita (o la sala preferida), nunca /new
            const meetLinkToOpen =
              b.meetUrl && !b.meetUrl.includes('/new') && !b.meetUrl.includes('whoops')
                ? b.meetUrl
                : preferredMeetUrl || 'https://meet.google.com/aeo-fngf-air';
            const meetCode = meetLinkToOpen.replace(/^https?:\/\/meet\.google\.com\//, '').replace(/[/?#].*$/, '');

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
                  {/* Botón 1: Google Meet Exacto */}
                  <a
                    href={meetLinkToOpen}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                    title={`Abrir sala exacta: ${meetLinkToOpen}`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Entrar a Google Meet {meetCode ? `(${meetCode})` : ''}</span>
                    <ExternalLink className="w-3 h-3 text-blue-200" />
                  </a>

                  {/* Botón 2: Reagendar Cita */}
                  <button
                    onClick={() => handleOpenRescheduleModal(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                    title="Reprogramar fecha y hora de la cita"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-200" />
                    <span>Reagendar</span>
                  </button>

                  {/* Botón 3: Ver o Personalizar Correo */}
                  <button
                    onClick={() => handleOpenEmailModal(b)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-rose-400" />
                    <span>Ver Texto de Correo</span>
                  </button>

                  {/* Botón 4: Ver en Google Calendar */}
                  <a
                    href="https://calendar.google.com/calendar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#161B22] hover:bg-[#1E242E] text-emerald-400 border border-gray-700 rounded-lg text-xs font-mono transition cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ver en Calendar</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: REGISTRAR CITA CON GOOGLE CALENDAR API */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0F141C] border border-[#202634] p-6 rounded-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-emerald-400" />
                Agendar Cita Automática en Google Calendar
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
              Ingresa los datos recibidos en tu web. Al confirmar, <strong>Google Calendar API</strong> creará el evento en tu calendario y generará la sala de Google Meet oficial.
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
                    placeholder="Ej: Conpi / Tienda Online"
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

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-blue-400" /> Sala de Google Meet Fija / Por Defecto
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal">Reutilizable y consistente</span>
                </label>
                <input
                  type="url"
                  value={preferredMeetUrl}
                  onChange={(e) => {
                    setPreferredMeetUrl(e.target.value);
                    localStorage.setItem('user_preferred_meet_url', e.target.value);
                  }}
                  placeholder="https://meet.google.com/aeo-fngf-air"
                  className="w-full bg-[#0A0C10] border border-[#202634] focus:border-blue-500 rounded-xl p-2.5 text-white outline-none font-mono text-xs"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Google Calendar API generará una sala oficial; si falla o no está autorizado aún, usará esta sala fija asegurando que el botón y el correo coincidan 100%.
                </span>
              </div>

              {/* Opción de notificación directa opcional */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyGoogleImmediately}
                    onChange={(e) => setNotifyGoogleImmediately(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span>
                    Enviar invitación formal automática de Google Calendar al cliente (Opcional)
                  </span>
                </label>
                <span className="text-[10px] text-slate-500 block mt-1 pl-6">
                  Si lo dejas desmarcado, el evento se crea en tu calendario pero el cliente solo recibirá el correo que tú decidas enviarle desde la pantalla siguiente.
                </span>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-1 text-xs text-emerald-300">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Automatización Integrada
                </span>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  Google Calendar API generará la sala Google Meet válida y sincronizará la cita directamente con tu CRM.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Conectando con Google Calendar...</span>
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-4 h-4" />
                      <span>Agendar y Sincronizar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REAGENDAR CITA */}
      {bookingToReschedule && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0F141C] border border-[#202634] p-6 rounded-2xl w-full max-w-md max-h-[88vh] overflow-y-auto space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Reagendar Cita con {bookingToReschedule.clientName}</span>
              </h2>
              <button
                type="button"
                onClick={() => setBookingToReschedule(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Selecciona la nueva fecha y hora. Se actualizará en tu Google Calendar y se preparará el correo de notificación con la misma sala de Meet.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nueva Fecha</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-[#202634] focus:border-amber-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nueva Hora (Chile)</label>
                <input
                  type="time"
                  required
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-[#202634] focus:border-amber-500 rounded-xl p-2.5 text-white outline-none cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-200">
              <span className="font-semibold block text-white mb-0.5">Misma Sala de Google Meet:</span>
              <span className="font-mono text-[11px] text-amber-300">{bookingToReschedule.meetUrl}</span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setBookingToReschedule(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={isRescheduling}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl cursor-pointer shadow flex items-center gap-1.5"
              >
                {isRescheduling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Actualizando Calendar...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Confirmar y Redactar Correo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VISTA DEL MENSAJE / CORREO DE RESPUESTA */}
      {selectedBookingForEmail && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0F141C] border border-[#202634] p-6 rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-rose-400" />
                  {isCancellationEmail ? 'Aviso de Cancelación para ' : 'Invitación para '} {selectedBookingForEmail.clientName}
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

            <div className="space-y-3">
              {isCancellationEmail && (
                <div className="p-3 bg-[#131722] border border-rose-900/40 rounded-xl space-y-2">
                  <span className="font-semibold text-rose-300 block text-xs">
                    Motivo de la cancelación:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCancelReasonChange('cliente')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left flex items-center gap-2 ${
                        cancelReason === 'cliente'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-950 font-bold'
                          : 'bg-[#0D1017] text-slate-400 hover:text-white border border-[#232938]'
                      }`}
                    >
                      <span>👤</span>
                      <span>Solicitado por el Cliente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelReasonChange('agenda')}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left flex items-center gap-2 ${
                        cancelReason === 'agenda'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-950 font-bold'
                          : 'bg-[#0D1017] text-slate-400 hover:text-white border border-[#232938]'
                      }`}
                    >
                      <span>📅</span>
                      <span>Por Motivo de Agenda Propia</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Asunto</label>
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

              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl space-y-1 text-xs text-blue-300">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  💡 {isCancellationEmail ? 'Aviso formal al cliente' : '¿Por qué enviar este correo al cliente?'}
                </span>
                <p className="text-[11px] text-blue-200/80 leading-relaxed">
                  {isCancellationEmail
                    ? 'Este correo notifica al cliente que la reunión fue cancelada formalmente, ofreciéndole la posibilidad de reagendar cuando disponga de tiempo sin que caiga en SPAM.'
                    : 'Las invitaciones automáticas de calendario a menudo son filtradas como SPAM por servidores corporativos. Al enviar este mensaje personalizado desde tu Gmail con tu firma y el enlace oficial a Google Meet, tu cliente recibe una comunicación profesional, cálida y directa en su bandeja principal.'}
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendCopyToMe}
                  onChange={(e) => setSendCopyToMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-700 text-rose-600 focus:ring-0 cursor-pointer"
                />
                <span>
                  Enviar copia a mi correo (<strong className="text-white">{activeOrganizerEmail}</strong>)
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={handleCopyEmailText}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? '¡Texto Copiado!' : 'Copiar Texto'}</span>
              </button>

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
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium rounded-xl shadow-lg shadow-rose-950 transition flex items-center gap-1.5 cursor-pointer"
                  title="Abre Gmail con la propuesta lista para enviar al cliente con 1 clic"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar con Gmail</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
