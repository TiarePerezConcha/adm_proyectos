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
