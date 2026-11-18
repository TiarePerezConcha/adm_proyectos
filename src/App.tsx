import React, { useState, useEffect } from 'react';
import { Environment, AdminTab, StudioTab } from './types';
import { loadAppState, saveAppState, AppState } from './utils/storage';
import { Sidebar } from './components/Sidebar';

// Admin Components
import { MetricasView } from './components/admin/MetricasView';
import { SeoRankingView } from './components/admin/SeoRankingView';
import { GoogleCalendarView } from './components/admin/GoogleCalendarView';
import { ProjectMonitorView } from './components/admin/ProjectMonitorView';
import { MiniSocView } from './components/admin/MiniSocView';
import { FaqsView } from './components/admin/FaqsView';
import { DocumentacionView } from './components/admin/DocumentacionView';

// Studio Components
import { EvaluacionView } from './components/studio/EvaluacionView';
import { CotizadorExpressView } from './components/studio/CotizadorExpressView';
import { CRMKanbanView } from './components/studio/CRMKanbanView';
import { BrandingView } from './components/studio/BrandingView';
import { ProyectosBriefView } from './components/studio/ProyectosBriefView';
import { MaquetasView } from './components/studio/MaquetasView';
import { ConfiguracionView } from './components/studio/ConfiguracionView';

import { LoginGuard } from './components/auth/LoginGuard';
import { ALLOWED_EMAIL, isEmailAuthorized, supabase } from './services/supabaseClient';
import {
  fetchInitialDataFromSupabase,
  syncAllProjectsToSupabase,
  syncDealToSupabase,
  syncClientToSupabase,
} from './services/supabaseSyncService';

export function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [currentEnv, setCurrentEnv] = useState<Environment>('admin');
  const [adminTab, setAdminTab] = useState<AdminTab>('metricas');
  const [studioTab, setStudioTab] = useState<StudioTab>('evaluacion');
  const [quoteTargetClientId, setQuoteTargetClientId] = useState<string | undefined>(undefined);
  const mainRef = React.useRef<HTMLElement>(null);

  // Asegurar que cada cambio de pestaña o vista comience siempre arriba desde el título
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentEnv, adminTab, studioTab]);

  // Sincronización Automática con Supabase Cloud (Lectura y Respaldo)
  useEffect(() => {
    async function initSupabaseData() {
      try {
        const remoteData = await fetchInitialDataFromSupabase();
        if (remoteData) {
          setState((prev) => {
            // Unificar Clientes
            const clientMap = new Map<string, any>(prev.clients.map((c) => [c.id, c]));
            (remoteData.clients || []).forEach((c: any) => clientMap.set(c.id, { ...(clientMap.get(c.id) || {}), ...c }));
            const mergedClients = Array.from(clientMap.values());

            // Unificar Deals del Pipeline CRM
            const dealMap = new Map<string, any>(prev.deals.map((d) => [d.id, d]));
            (remoteData.deals || []).forEach((d: any) => dealMap.set(d.id, { ...(dealMap.get(d.id) || {}), ...d }));
            const mergedDeals = Array.from(dealMap.values());

            // Unificar Cotizaciones
            const quoteMap = new Map<string, any>(prev.quotes.map((q) => [q.id, q]));
            (remoteData.quotes || []).forEach((q: any) => quoteMap.set(q.id, { ...(quoteMap.get(q.id) || {}), ...q }));
            const mergedQuotes = Array.from(quoteMap.values());

            // Unificar Proyectos Monitoreados (Filtrando tratos y endpoints)
            const projMap = new Map<string, any>(prev.monitoredProjects.map((p) => [p.id, p]));
            (remoteData.projects || []).forEach((p: any) => {
              const pid = (p.id || '').toLowerCase();
              const purl = (p.url || '').toLowerCase();
              if (pid.startsWith('studio-') || pid.startsWith('deal-')) return;
              if (purl.startsWith('file:') || purl.includes('supabase.co')) return;
              if (projMap.has(p.id)) {
                projMap.set(p.id, { ...projMap.get(p.id), ...p });
              }
            });
            const mergedProjects = Array.from(projMap.values()).filter((p: any) => {
              const pid = (p.id || '').toLowerCase();
              const purl = (p.url || '').toLowerCase();
              if (pid.startsWith('studio-') || pid.startsWith('deal-')) return false;
              if (purl.startsWith('file:') || purl.includes('supabase.co')) return false;
              return true;
            });

            return {
              ...prev,
              clients: mergedClients.length > 0 ? mergedClients : prev.clients,
              deals: mergedDeals.length > 0 ? mergedDeals : prev.deals,
              quotes: mergedQuotes.length > 0 ? mergedQuotes : prev.quotes,
              monitoredProjects: mergedProjects,
            };
          });

          // Si en Supabase crm_deals está vacío, respaldar los deals del estado local
          if (!remoteData.deals || remoteData.deals.length === 0) {
            state.deals.forEach((d) => syncDealToSupabase(d));
          }

          // Respaldar clientes y proyectos monitoreados
          state.clients.forEach((c) => syncClientToSupabase(c));
          syncAllProjectsToSupabase(state.monitoredProjects);
        }
      } catch (err) {
        console.warn('Sincronización inicial Supabase:', err);
      }
    }

    initSupabaseData();
  }, []);

  // Estado de Autenticación de 3 Capas
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(() => {
    const user = sessionStorage.getItem('lsc_authenticated_user');
    const authTime = sessionStorage.getItem('lsc_auth_timestamp');
    // Caducidad de sesión: 8 horas (28800000 ms)
    if (user && isEmailAuthorized(user) && authTime) {
      if (Date.now() - parseInt(authTime, 10) < 28800000) {
        return user;
      }
    }
    return null;
  });

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const handleLogout = () => {
    sessionStorage.removeItem('lsc_authenticated_user');
    sessionStorage.removeItem('lsc_auth_timestamp');
    supabase.auth.signOut().catch(() => {});
    setAuthenticatedUser(null);
  };

  const handleNavigateToQuote = (clientId: string) => {
    setQuoteTargetClientId(clientId);
    setCurrentEnv('studio');
    setStudioTab('cotizador');
  };

  const handleNavigateToMockups = () => {
    setCurrentEnv('studio');
    setStudioTab('maquetas');
  };

  // Si no está autenticado como tiare.perezconcha@gmail.com, se bloquea la renderización por completo
  if (!authenticatedUser) {
    return <LoginGuard onLoginSuccess={(email) => setAuthenticatedUser(email)} />;
  }

  return (
    <div className={`min-h-screen flex ${currentEnv === 'admin' ? 'bg-[#0A0C10]' : 'bg-[#FAFBFD]'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentEnv={currentEnv}
        onEnvChange={setCurrentEnv}
        adminTab={adminTab}
        onAdminTabChange={setAdminTab}
        studioTab={studioTab}
        onStudioTabChange={setStudioTab}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main ref={mainRef} className="flex-1 overflow-y-auto min-h-screen">
        {currentEnv === 'admin' ? (
          <div className="bg-[#0A0C10] min-h-screen">
            {adminTab === 'metricas' && <MetricasView state={state} />}
            {adminTab === 'seo' && <SeoRankingView state={state} onUpdateState={setState} />}
            {adminTab === 'calendar' && (
              <GoogleCalendarView state={state} onUpdateState={setState} />
            )}
            {adminTab === 'telemetria' && (
              <ProjectMonitorView
                state={state}
                onUpdateState={setState}
                onNavigateTab={(tab) => setAdminTab(tab)}
              />
            )}
            {adminTab === 'soc' && <MiniSocView state={state} onUpdateState={setState} />}
            {adminTab === 'faqs' && <FaqsView state={state} />}
            {adminTab === 'documentacion' && (
              <DocumentacionView state={state} onUpdateState={setState} />
            )}
            {adminTab === 'configuracion' && (
              <ConfiguracionView state={state} onUpdateState={setState} />
            )}
          </div>
        ) : (
          <div className="bg-[#FAFBFD] min-h-screen">
            {studioTab === 'evaluacion' && (
              <EvaluacionView
                state={state}
                onUpdateState={setState}
                onNavigateToQuote={handleNavigateToQuote}
              />
            )}
            {studioTab === 'cotizador' && (
              <CotizadorExpressView
                state={state}
                onUpdateState={setState}
                initialClientId={quoteTargetClientId}
              />
            )}
            {studioTab === 'crm' && (
              <CRMKanbanView
                state={state}
                onUpdateState={setState}
                onNavigateToQuote={handleNavigateToQuote}
              />
            )}
            {studioTab === 'branding' && (
              <BrandingView state={state} onUpdateState={setState} />
            )}
            {studioTab === 'proyectos' && (
              <ProyectosBriefView
                state={state}
                onUpdateState={setState}
                onNavigateToMockups={handleNavigateToMockups}
              />
            )}
            {studioTab === 'maquetas' && <MaquetasView state={state} />}
            {studioTab === 'configuracion' && (
              <ConfiguracionView state={state} onUpdateState={setState} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
