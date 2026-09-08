import React from 'react';
import {
  LayoutDashboard,
  Search,
  Calendar,
  Activity,
  ShieldCheck,
  HelpCircle,
  ClipboardCheck,
  FileSpreadsheet,
  Kanban,
  Sparkles,
  Layers,
  Monitor,
  Settings,
  ArrowLeftRight,
  ExternalLink,
  ChevronDown,
  Briefcase,
  Users
} from 'lucide-react';
import { Environment, AdminTab, StudioTab } from '../types';

interface SidebarProps {
  currentEnv: Environment;
  onEnvChange: (env: Environment) => void;
  adminTab: AdminTab;
  onAdminTabChange: (tab: AdminTab) => void;
  studioTab: StudioTab;
  onStudioTabChange: (tab: StudioTab) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentEnv,
  onEnvChange,
  adminTab,
  onAdminTabChange,
  studioTab,
  onStudioTabChange,
  onLogout,
}) => {
  const [onboardingOpen, setOnboardingOpen] = React.useState(true);
  const [clientesOpen, setClientesOpen] = React.useState(true);

  if (currentEnv === 'admin') {
    return (
      <aside className="w-64 bg-[#0A0C10] border-r border-[#1E232F] flex flex-col justify-between h-screen sticky top-0 select-none text-slate-300">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-[#1E232F] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="font-mono text-sm tracking-wider font-bold text-white uppercase">
                  LSC ADMIN
                </span>
                <span className="block text-[10px] text-slate-500 font-mono">v1.2 Operations</span>
              </div>
            </div>
            <button
              onClick={() => onEnvChange('studio')}
              className="p-1.5 rounded-md hover:bg-[#1E232F] text-slate-400 hover:text-white transition-colors"
              title="Cambiar a Studio (Modo Claro)"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => onAdminTabChange('metricas')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                adminTab === 'metricas'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'hover:bg-[#151922] text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Métricas & Agente IA</span>
            </button>

            <button
              onClick={() => onAdminTabChange('seo')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                adminTab === 'seo'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'hover:bg-[#151922] text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>SEO Ranking (GSC)</span>
            </button>

            <button
              onClick={() => onAdminTabChange('calendar')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                adminTab === 'calendar'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'hover:bg-[#151922] text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Google Calendar</span>
            </button>

            <button
              onClick={() => onAdminTabChange('telemetria')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                adminTab === 'telemetria'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'hover:bg-[#151922] text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Monitor de Proyectos</span>
            </button>

            <button
              onClick={() => onAdminTabChange('soc')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                adminTab === 'soc'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'hover:bg-[#151922] text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="flex items-center justify-between flex-1">
                <span>Ciberseguridad & SOC</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  ALE IA
                </span>
              </div>
            </button>

            <button
              onClick={() => onAdminTabChange('faqs')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                adminTab === 'faqs'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'hover:bg-[#151922] text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQs & Base de Conocimiento</span>
            </button>
          </nav>
        </div>

        {/* Switch to Studio Banner & Logout */}
        <div className="p-3 border-t border-[#1E232F] space-y-2">
          <button
            onClick={() => onEnvChange('studio')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-800/40 hover:border-rose-500/60 text-slate-200 transition-all group text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-rose-400"></span>
              <div>
                <span className="text-xs font-semibold text-rose-200 block">Ir a Studio</span>
                <span className="text-[10px] text-slate-400">Branding, Cotizador & Maquetas</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {onLogout && (
            <div className="pt-1 flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span className="truncate max-w-[150px] font-mono text-emerald-400" title="tiare.perezconcha@gmail.com">
                🔒 tiare.perezconcha
              </span>
              <button
                onClick={onLogout}
                className="text-rose-400 hover:text-rose-300 transition-colors font-medium hover:underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </aside>
    );
  }

  // STUDIO SIDEBAR (Clean, Minimalist Light Theme matching screenshots)
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 select-none text-slate-700">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#DD8396]"></span>
            <span className="font-serif text-lg font-bold text-slate-900 tracking-tight">Studio</span>
          </div>
          <button
            onClick={() => onEnvChange('admin')}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            title="Cambiar a LSC Admin (Modo Oscuro)"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Menu */}
        <nav className="p-3 space-y-1">
          {/* Onboarding Group */}
          <div>
            <button
              onClick={() => setOnboardingOpen(!onboardingOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Onboarding</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  onboardingOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {onboardingOpen && (
              <div className="pl-4 pr-1 space-y-0.5 mt-0.5">
                <button
                  onClick={() => onStudioTabChange('evaluacion')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    studioTab === 'evaluacion'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-[#DD8396]" />
                  <span>Evaluación</span>
                </button>

                <button
                  onClick={() => onStudioTabChange('cotizador')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    studioTab === 'cotizador'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#DD8396]" />
                  <span>Cotizador</span>
                </button>
              </div>
            )}
          </div>

          {/* Clientes Group */}
          <div className="pt-2">
            <button
              onClick={() => setClientesOpen(!clientesOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Clientes</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  clientesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {clientesOpen && (
              <div className="pl-4 pr-1 space-y-0.5 mt-0.5">
                <button
                  onClick={() => onStudioTabChange('crm')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    studioTab === 'crm'
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5 text-[#DD8396]" />
                  <span>CRM Comercial</span>
                </button>
              </div>
            )}
          </div>

          {/* Branding (6 Etapas) */}
          <div className="pt-1">
            <button
              onClick={() => onStudioTabChange('branding')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                studioTab === 'branding'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#DD8396]" />
              <span>Branding con IA</span>
            </button>
          </div>

          {/* Proyectos & Brief UX */}
          <div>
            <button
              onClick={() => onStudioTabChange('proyectos')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                studioTab === 'proyectos'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#DD8396]" />
              <span>Proyectos & Brief UX</span>
            </button>
          </div>

          {/* Maquetas Interactivas */}
          <div>
            <button
              onClick={() => onStudioTabChange('maquetas')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                studioTab === 'maquetas'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-[#DD8396]" />
              <span>Maquetas Interactivas</span>
            </button>
          </div>

          {/* Configuración IA & APIs */}
          <div className="pt-2">
            <button
              onClick={() => onStudioTabChange('configuracion')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                studioTab === 'configuracion'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Configuración & APIs</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Switch to LSC Admin Banner */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        <button
          onClick={() => onEnvChange('admin')}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white hover:bg-black transition-all group text-left shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <div>
              <span className="text-xs font-semibold text-white block">LSC Admin</span>
              <span className="text-[10px] text-slate-400">Métricas, SEO, SOC & Telemetría</span>
            </div>
          </div>
          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </button>

        {onLogout && (
          <div className="pt-1 flex items-center justify-between px-1 text-[11px] text-slate-500">
            <span className="truncate max-w-[150px] font-mono text-emerald-700" title="tiare.perezconcha@gmail.com">
              🔒 tiare.perezconcha
            </span>
            <button
              onClick={onLogout}
              className="text-rose-600 hover:text-rose-800 transition-colors font-medium hover:underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
