import React, { useState } from 'react';
import { MessageSquare, HelpCircle, Calendar, Users, Star, DollarSign, Search, Sparkles, TrendingUp } from 'lucide-react';
import { AppState } from '../../utils/storage';

interface MetricasViewProps {
  state: AppState;
}

export const MetricasView: React.FC<MetricasViewProps> = ({ state }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const servicesMetrics = [
    { service: 'WEB-IA', questions: 12, helpful: 8, published: 2, bookings: 1, clients: 1 },
    { service: 'SHOPIFY', questions: 28, helpful: 22, published: 5, bookings: 4, clients: 3 },
    { service: 'WOOCOMMERCE', questions: 14, helpful: 9, published: 3, bookings: 2, clients: 1 },
    { service: 'HEADLESS', questions: 8, helpful: 6, published: 2, bookings: 1, clients: 1 },
    { service: 'GENERAL', questions: 46, helpful: 38, published: 12, bookings: 3, clients: 2 },
  ];

  const recentConversations = [
    {
      query: 'Necesito migrar mi tienda de WooCommerce a Shopify manteniendo clientes y pedidos',
      category: 'SHOPIFY',
      date: 'Hoy, 04:15 a. m.',
      response: 'Se recomendó plan de migración con scripts ETL seguros y cotización en Sprint ágil.',
    },
    {
      query: '¿Cuánto cuesta un dominio .cl y el hosting para empezar un catálogo?',
      category: 'GENERAL',
      date: 'Ayer, 11:36 p. m.',
      response: 'Se desglosó NIC Chile a $9.990/año y hosting TecnoInver a $30.000/año.',
    },
    {
      query: 'Quiero una pasarela de pago para vender en Chile con Webpay Plus y MercadoPago',
      category: 'WEB-IA',
      date: '03-09-26, 11:35 p. m.',
      response: 'Se orientó en la integración Transbank REST API y flujo de checkout de 1 clic.',
    },
    {
      query: '¿Cómo puedo evitar que mi base de datos de Supabase se pause por inactividad?',
      category: 'GENERAL',
      date: '02-09-26, 09:20 p. m.',
      response: 'Se proporcionó el webhook cron de keep-alive programado cada 3 días de LSC.',
    },
  ];

  const filteredConversations = recentConversations.filter(
    (c) =>
      c.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBookings = state.calendarBookings.length;
  const totalClients = state.clients.length;
  const totalValueDeals = state.deals.reduce((acc, d) => acc + d.valueCLP, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          MÉTRICAS
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Resumen general del agente IA & plataforma de captación
        </p>
      </div>

      {/* KPI Top Cards (Exact dark layout from screenshots) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
            <span>Conversaciones</span>
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-2">108</div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>FAQs Publicadas</span>
          </div>
          <div className="text-2xl font-mono font-bold text-white mt-2">24</div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bookings</span>
          </div>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">{totalBookings}</div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Clientes</span>
          </div>
          <div className="text-2xl font-mono font-bold text-sky-400 mt-2">{totalClients}</div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Rating Promedio</span>
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-2">4.9 / 5</div>
        </div>

        <div className="bg-[#12151C] border border-[#202634] p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pipeline CLP</span>
          </div>
          <div className="text-lg font-mono font-bold text-white mt-2">
            ${(totalValueDeals / 1000000).toFixed(1)}M
          </div>
        </div>
      </div>

      {/* Grid: Métricas por servicio & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Métricas por servicio */}
        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#202634] pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              MÉTRICAS POR SERVICIO
            </span>
            <span className="text-[10px] font-mono text-slate-500">Últimos 30 días</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {servicesMetrics.map((item) => (
              <div
                key={item.service}
                className="flex items-center justify-between py-2 border-b border-[#1b202c] last:border-0"
              >
                <span className="text-slate-300 font-semibold">{item.service}</span>
                <div className="flex items-center gap-4 text-slate-400">
                  <span>{item.questions} consultas</span>
                  <span className="text-emerald-400">{item.helpful} útiles</span>
                  <span className="text-sky-400">{item.bookings} bookings</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#202634] pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              CONVERSION FUNNEL
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Alta Eficiencia
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {servicesMetrics.map((item) => {
              const conversionPercent = Math.round((item.clients / (item.questions || 1)) * 100);
              return (
                <div key={item.service} className="space-y-1.5">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span className="text-white font-medium">{item.service}</span>
                    <span>
                      {item.questions} Consultas &rarr; {item.bookings} Citas &rarr;{' '}
                      <span className="text-emerald-400 font-bold">{item.clients} Clientes</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#1b202c] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(conversionPercent * 3, 12)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conversaciones Recientes */}
      <div className="bg-[#12151C] border border-[#202634] p-5 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#202634] pb-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            CONVERSACIONES RECIENTES CON EL ASISTENTE IA
          </span>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por pregunta o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0A0C10] border border-[#202634] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono w-64"
            />
          </div>
        </div>

        <div className="space-y-3 font-mono">
          {filteredConversations.map((conv, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-[#0A0C10]/60 border border-[#1b202c] rounded-lg space-y-2 hover:border-[#2b3345] transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-white font-medium">{conv.query}</span>
                <span className="text-[10px] text-slate-500">{conv.date}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="bg-[#1a2130] text-emerald-400 px-2 py-0.5 rounded text-[10px]">
                  {conv.category}
                </span>
                <span className="text-slate-400 italic text-[11px]">&ldquo;{conv.response}&rdquo;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
