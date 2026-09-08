import React, { useState } from 'react';
import { Kanban, Table, Plus, DollarSign, Calendar, Phone, Mail, ArrowRight, ArrowLeft, Trash2, CheckCircle, Clock } from 'lucide-react';
import { AppState, saveAppState } from '../../utils/storage';
import { CRMDeal, CRMStage } from '../../types';

interface CRMKanbanViewProps {
  state: AppState;
  onUpdateState: (newState: AppState) => void;
  onNavigateToQuote?: (clientId: string) => void;
}

const STAGES: { id: CRMStage; title: string; color: string; badge: string }[] = [
  { id: 'reunion_agendada', title: 'Reunión Agendada', color: 'border-sky-400', badge: 'bg-sky-50 text-sky-700' },
  { id: 'en_evaluacion', title: 'En Evaluación', color: 'border-amber-400', badge: 'bg-amber-50 text-amber-700' },
  { id: 'propuesta_enviada', title: 'Propuesta Enviada', color: 'border-indigo-400', badge: 'bg-indigo-50 text-indigo-700' },
  { id: 'en_negociacion', title: 'En Negociación', color: 'border-purple-400', badge: 'bg-purple-50 text-purple-700' },
  { id: 'proyecto_aprobado', title: 'Proyecto Aprobado', color: 'border-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  { id: 'en_monitoreo', title: 'En Monitoreo & SOC', color: 'border-slate-600', badge: 'bg-slate-100 text-slate-800' },
];

export const CRMKanbanView: React.FC<CRMKanbanViewProps> = ({
  state,
  onUpdateState,
  onNavigateToQuote,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showAddDeal, setShowAddDeal] = useState(false);

  // New deal form
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [title, setTitle] = useState('');
  const [valueCLP, setValueCLP] = useState(850000);
  const [stage, setStage] = useState<CRMStage>('reunion_agendada');

  const totalValue = state.deals.reduce((acc, d) => acc + d.valueCLP, 0);

  const handleMoveStage = (dealId: string, direction: 'forward' | 'backward') => {
    const updated = state.deals.map((deal) => {
      if (deal.id === dealId) {
        const currentIndex = STAGES.findIndex((s) => s.id === deal.stage);
        const newIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= 0 && newIndex < STAGES.length) {
          return {
            ...deal,
            stage: STAGES[newIndex].id,
            updatedAt: new Date().toISOString().slice(0, 10),
          };
        }
      }
      return deal;
    });

    const newState = { ...state, deals: updated };
    onUpdateState(newState);
    saveAppState(newState);
  };

  const handleDeleteDeal = (dealId: string) => {
    const updated = state.deals.filter((d) => d.id !== dealId);
    const newState = { ...state, deals: updated };
    onUpdateState(newState);
    saveAppState(newState);
  };

  const handleAddDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title) return;

    const clientId = `cli-${Date.now()}`;
    const newDeal: CRMDeal = {
      id: `deal-${Date.now()}`,
      clientId,
      clientName: name,
      company: company || name,
      email,
      phone,
      title,
      valueCLP: Number(valueCLP),
      stage,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const newClient = {
      id: clientId,
      name,
      company: company || name,
      email,
      phone,
      country: 'Chile',
      source: 'CRM Manual',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    const newState = {
      ...state,
      clients: [newClient, ...state.clients],
      deals: [newDeal, ...state.deals],
    };

    onUpdateState(newState);
    saveAppState(newState);
    setShowAddDeal(false);
    setName('');
    setCompany('');
    setEmail('');
    setTitle('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Header matching screenshots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-2">
            <Kanban className="w-6 h-6 text-[#DD8396]" />
            CRM Comercial
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {state.deals.length} deals activos &bull; Cartera Total: ${(totalValue).toLocaleString('es-CL')} CLP
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Tabla
            </button>
          </div>

          <button
            onClick={() => setShowAddDeal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Deal</span>
          </button>
        </div>
      </div>

      {/* View Mode: Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {STAGES.map((stg) => {
            const stageDeals = state.deals.filter((d) => d.stage === stg.id);
            const stageTotalCLP = stageDeals.reduce((sum, d) => sum + d.valueCLP, 0);

            return (
              <div
                key={stg.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between min-h-[500px]"
              >
                <div>
                  {/* Column Header */}
                  <div className="border-b border-slate-200 pb-2.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 tracking-tight">{stg.title}</span>
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {stageDeals.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      ${(stageTotalCLP / 1000).toFixed(0)}k CLP
                    </div>
                  </div>

                  {/* Deals Cards */}
                  <div className="space-y-2.5">
                    {stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-white border border-slate-200 hover:border-slate-400 p-3.5 rounded-lg space-y-2.5 shadow-sm transition-all text-xs"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-bold text-slate-900 leading-snug">{deal.clientName}</span>
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                            title="Eliminar deal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-slate-500 font-medium">{deal.company}</div>

                        <div className="space-y-1 text-[10px] text-slate-400">
                          {deal.email && <div className="truncate">{deal.email}</div>}
                          {deal.phone && <div>{deal.phone}</div>}
                          {deal.meetingDate && (
                            <div className="text-sky-600 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{deal.meetingDate}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="font-bold font-mono text-slate-900 text-[11px]">
                            ${deal.valueCLP.toLocaleString('es-CL')}
                          </span>

                          {/* Quick stage navigation buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveStage(deal.id, 'backward')}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                              title="Mover a etapa anterior"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveStage(deal.id, 'forward')}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                              title="Avanzar etapa"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {onNavigateToQuote && (
                          <button
                            onClick={() => onNavigateToQuote(deal.clientId)}
                            className="w-full text-center text-[10px] text-[#DD8396] hover:underline font-semibold pt-1 block"
                          >
                            Cotizar este deal &rarr;
                          </button>
                        )}
                      </div>
                    ))}

                    {stageDeals.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-[11px] italic">Sin deals</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode: Structured Table */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <tr>
                  <th className="p-3.5">Cliente / Marca</th>
                  <th className="p-3.5">Proyecto</th>
                  <th className="p-3.5">Etapa Actual</th>
                  <th className="p-3.5 text-right">Monto CLP</th>
                  <th className="p-3.5">Contacto</th>
                  <th className="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{deal.clientName}</div>
                      <span className="text-[11px] text-slate-400 font-normal">{deal.company}</span>
                    </td>
                    <td className="p-3.5 text-slate-700">{deal.title}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                        {deal.stage.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                      ${deal.valueCLP.toLocaleString('es-CL')}
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      <div>{deal.email}</div>
                      <div>{deal.phone}</div>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleMoveStage(deal.id, 'backward')}
                          className="p-1 text-slate-400 hover:text-slate-800"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveStage(deal.id, 'forward')}
                          className="p-1 text-slate-400 hover:text-slate-800"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Deal */}
      {showAddDeal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl w-full max-w-md space-y-4 text-xs shadow-xl">
            <h2 className="text-base font-bold font-serif text-slate-900 flex items-center gap-2">
              <Kanban className="w-4 h-4 text-[#DD8396]" />
              Crear Nuevo Deal Comercial
            </h2>

            <form onSubmit={handleAddDeal} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre del Prospecto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Marcelo Díaz"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Empresa / Marca</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ej: MBJeans"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Título del Proyecto *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Ecommerce Shopify MBJeans"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Valor en CLP</label>
                  <input
                    type="number"
                    value={valueCLP}
                    onChange={(e) => setValueCLP(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Etapa Inicial</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-900 bg-white"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDeal(false)}
                  className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-lg shadow-sm"
                >
                  Crear Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
