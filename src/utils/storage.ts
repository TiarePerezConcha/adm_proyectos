import {
  Client,
  CRMDeal,
  ProspectEvaluation,
  Quote,
  BrandingProject,
  ProjectBrief,
  DesignSystem,
  SEOKeyword,
  CalendarBooking,
  MonitoredProject,
  SecurityAsset,
  SecurityRisk,
  SecurityPlaybook,
  AppSettings,
  CRMStage,
} from '../types';

import {
  INITIAL_SETTINGS,
  DEFAULT_INFRASTRUCTURE_RATES,
  SEED_CLIENTS,
  SEED_DEALS,
  SEED_EVALUATIONS,
  SEED_QUOTES,
  SEED_BRANDING,
  SEED_BRIEF,
  SEED_DESIGN_SYSTEM,
  SEED_SEO_KEYWORDS,
  SEED_CALENDAR,
  SEED_MONITORED_PROJECTS,
  SEED_SECURITY_ASSETS,
  SEED_SECURITY_RISKS,
  SEED_SECURITY_PLAYBOOKS,
} from '../data/seedData';

const STORAGE_KEY = 'lsc_admin_studio_v3_live';

export interface AppState {
  settings: AppSettings;
  clients: Client[];
  deals: CRMDeal[];
  evaluations: ProspectEvaluation[];
  quotes: Quote[];
  brandingProjects: BrandingProject[];
  briefs: ProjectBrief[];
  designSystems: DesignSystem[];
  seoKeywords: SEOKeyword[];
  calendarBookings: CalendarBooking[];
  monitoredProjects: MonitoredProject[];
  securityAssets: SecurityAsset[];
  securityRisks: SecurityRisk[];
  securityPlaybooks: SecurityPlaybook[];
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const activeBookings = (parsed.calendarBookings && parsed.calendarBookings.length > 0) ? parsed.calendarBookings : SEED_CALENDAR;
      const rawDeals = (parsed.deals && parsed.deals.length > 0) ? parsed.deals : SEED_DEALS;
      const cleanDeals = rawDeals;

      // Limpiar y unificar proyectos monitoreados (filtrar pruebas, tratos comerciales y rutas locales)
      const rawProjects = parsed.monitoredProjects && parsed.monitoredProjects.length > 0 
        ? parsed.monitoredProjects 
        : SEED_MONITORED_PROJECTS;

      const seedMap = new Map<string, any>(SEED_MONITORED_PROJECTS.map((sp) => [sp.id, sp]));

      const cleanProjects = rawProjects
        .filter((p: any) => {
          const id = (p.id || '').toLowerCase();
          const name = (p.name || '').toLowerCase();
          const url = (p.url || '').toLowerCase();

          // 1. Filtrar tratos comerciales del CRM que se mezclaron con proyectos web
          if (id.startsWith('studio-') || id.startsWith('deal-')) return false;

          // 2. Filtrar rutas locales de archivos del sistema y endpoints internos de Supabase
          if (url.startsWith('file:') || url.includes('supabase.co')) return false;

          // 3. Filtrar proyectos de prueba y manuales
          if (id === 'test-keepalive-verify' || name.includes('test keepalive')) return false;
          if (id === 'studio-keepalive-manual' || name.includes('studio keepalive')) return false;
          if (id === 'conpi-react' || id === 'conpi-web' || name === 'conpi react' || name === 'conpi web') return false;
          return true;
        })
        .map((p: any) => {
          let canonicalId = p.id;
          if (canonicalId === 'conpi-react' || canonicalId === 'conpi-web' || (p.url && p.url.includes('conpi.cl'))) {
            canonicalId = 'conpi-app';
          }
          const seedMatch = seedMap.get(canonicalId);
          if (canonicalId === 'conpi-app' && seedMatch) {
            return {
              ...seedMatch,
              ...p,
              id: 'conpi-app',
              name: seedMatch.name,
              url: 'https://conpi.cl',
              databaseType: 'mysql_cpanel',
              databaseStatus: 'online',
              supabaseKeepAliveEnabled: false,
              lastSupabasePing: 'Alojado en cPanel TecnoInver (MySQL)',
              clientBilling: undefined,
              deepLinks: seedMatch.deepLinks,
              stack: ['React 18', 'Vite', 'Tailwind CSS', 'REST API / MySQL'],
              gscProperty: 'sc-domain:conpi.cl',
              gscConnected: true,
              incidentHistory: (p.incidentHistory && p.incidentHistory.length > 0) ? p.incidentHistory : (seedMatch.incidentHistory || []),
              externalDocs: p.externalDocs || seedMatch.externalDocs || [],
            };
          }
          if (seedMatch) {
            return {
              ...seedMatch,
              ...p,
              id: seedMatch.id,
              name: seedMatch.name,
              url: seedMatch.url,
              stack: p.stack || seedMatch.stack,
              databaseType: p.databaseType || seedMatch.databaseType,
              databaseStatus: p.databaseStatus || seedMatch.databaseStatus,
              dbStorageQuota: p.dbStorageQuota || seedMatch.dbStorageQuota,
              queues: p.queues || seedMatch.queues,
              commitHash: p.commitHash || seedMatch.commitHash,
              commitDate: p.commitDate || seedMatch.commitDate,
              supportWarrantyDays: p.supportWarrantyDays !== undefined ? p.supportWarrantyDays : seedMatch.supportWarrantyDays,
              pendingTasks: p.pendingTasks || seedMatch.pendingTasks,
              backupLinks: p.backupLinks || seedMatch.backupLinks,
              dbHealthPingMs: p.dbHealthPingMs || seedMatch.dbHealthPingMs,
              daysWithoutPause: p.daysWithoutPause !== undefined ? p.daysWithoutPause : seedMatch.daysWithoutPause,
              lifecycleStage: p.lifecycleStage || seedMatch.lifecycleStage,
              versionDeployed: p.versionDeployed || seedMatch.versionDeployed,
              qaChecklist: p.qaChecklist || seedMatch.qaChecklist,
              infraVault: p.infraVault || seedMatch.infraVault,
              deepLinks: p.deepLinks || seedMatch.deepLinks,
              notes: p.notes || seedMatch.notes,
              isPersonalProject: p.isPersonalProject !== undefined ? p.isPersonalProject : seedMatch.isPersonalProject,
              clientBilling: p.clientBilling || seedMatch.clientBilling,
              aiUsage: p.aiUsage || seedMatch.aiUsage,
              gscProperty: p.gscProperty || seedMatch.gscProperty,
              gscConnected: p.gscConnected !== undefined ? p.gscConnected : seedMatch.gscConnected,
            };
          }
          return p;
        });

      // Asegurar que conpi-app siempre exista y sea el primer elemento
      let conpiItem = cleanProjects.find((p: any) => p.id === 'conpi-app' || (p.url && p.url.includes('conpi.cl')));
      if (!conpiItem) {
        conpiItem = seedMap.get('conpi-app');
      }
      const otherProjects = cleanProjects.filter((p: any) => p.id !== 'conpi-app' && !(p.url && p.url.includes('conpi.cl')));
      const finalOrderedProjects = [conpiItem, ...otherProjects];

      const resolvedSettings: AppSettings = {
        ...INITIAL_SETTINGS,
        ...(parsed.settings || {}),
        infrastructureRates:
          parsed.settings?.infrastructureRates && parsed.settings.infrastructureRates.length > 0
            ? parsed.settings.infrastructureRates
            : DEFAULT_INFRASTRUCTURE_RATES,
      };

      return {
        settings: resolvedSettings,
        clients: (parsed.clients && parsed.clients.length > 0) ? parsed.clients : SEED_CLIENTS,
        deals: cleanDeals,
        evaluations: (parsed.evaluations && parsed.evaluations.length > 0) ? parsed.evaluations : SEED_EVALUATIONS,
        quotes: (parsed.quotes && parsed.quotes.length > 0) ? parsed.quotes : SEED_QUOTES,
        brandingProjects: (parsed.brandingProjects && parsed.brandingProjects.length > 0) ? parsed.brandingProjects : [SEED_BRANDING],
        briefs: (parsed.briefs && parsed.briefs.length > 0) ? parsed.briefs : [SEED_BRIEF],
        designSystems: (parsed.designSystems && parsed.designSystems.length > 0) ? parsed.designSystems : [SEED_DESIGN_SYSTEM],
        seoKeywords: parsed.seoKeywords && parsed.seoKeywords.length > 0 ? parsed.seoKeywords : SEED_SEO_KEYWORDS,
        calendarBookings: activeBookings,
        monitoredProjects: finalOrderedProjects,
        securityAssets: parsed.securityAssets || SEED_SECURITY_ASSETS,
        securityRisks: parsed.securityRisks || SEED_SECURITY_RISKS,
        securityPlaybooks: parsed.securityPlaybooks || SEED_SECURITY_PLAYBOOKS,
      };
    }
  } catch (e) {
    console.error('Error al cargar estado desde LocalStorage:', e);
  }

  return {
    settings: INITIAL_SETTINGS,
    clients: SEED_CLIENTS,
    deals: SEED_DEALS,
    evaluations: SEED_EVALUATIONS,
    quotes: SEED_QUOTES,
    brandingProjects: [SEED_BRANDING],
    briefs: [SEED_BRIEF],
    designSystems: [SEED_DESIGN_SYSTEM],
    seoKeywords: SEED_SEO_KEYWORDS,
    calendarBookings: SEED_CALENDAR,
    monitoredProjects: SEED_MONITORED_PROJECTS,
    securityAssets: SEED_SECURITY_ASSETS,
    securityRisks: SEED_SECURITY_RISKS,
    securityPlaybooks: SEED_SECURITY_PLAYBOOKS,
  };
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error al guardar estado en LocalStorage:', e);
  }
}

/**
 * Purga completa del almacenamiento local (LocalStorage)
 * Permite restablecer el estado del navegador a cero y sincronizar limpio desde la BBDD.
 */
export function clearAppState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Error al limpiar LocalStorage:', e);
  }
}

export function exportAppStateToJSON(state: AppState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `lsc_admin_studio_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importAppStateFromJSON(jsonString: string): AppState {
  const parsed = JSON.parse(jsonString);
  const validatedState: AppState = {
    settings: {
      ...INITIAL_SETTINGS,
      ...(parsed.settings || {}),
      infrastructureRates:
        parsed.settings?.infrastructureRates && parsed.settings.infrastructureRates.length > 0
          ? parsed.settings.infrastructureRates
          : DEFAULT_INFRASTRUCTURE_RATES,
    },
    clients: parsed.clients || SEED_CLIENTS,
    deals: parsed.deals || SEED_DEALS,
    evaluations: parsed.evaluations || SEED_EVALUATIONS,
    quotes: parsed.quotes || SEED_QUOTES,
    brandingProjects: parsed.brandingProjects || [SEED_BRANDING],
    briefs: parsed.briefs || [SEED_BRIEF],
    designSystems: parsed.designSystems || [SEED_DESIGN_SYSTEM],
    seoKeywords: parsed.seoKeywords && parsed.seoKeywords.length > 0 ? parsed.seoKeywords : SEED_SEO_KEYWORDS,
    calendarBookings: parsed.calendarBookings || SEED_CALENDAR,
    monitoredProjects: parsed.monitoredProjects || SEED_MONITORED_PROJECTS,
    securityAssets: parsed.securityAssets || SEED_SECURITY_ASSETS,
    securityRisks: parsed.securityRisks || SEED_SECURITY_RISKS,
    securityPlaybooks: parsed.securityPlaybooks || SEED_SECURITY_PLAYBOOKS,
  };
  saveAppState(validatedState);
  return validatedState;
}

// Helper para sincronizar CRM reactivamente ante cambios en otros módulos
export function syncDealStage(
  deals: CRMDeal[],
  clientId: string,
  newStage: CRMStage,
  extraData?: Partial<CRMDeal>
): CRMDeal[] {
  let found = false;
  const updated = deals.map((deal) => {
    if (deal.clientId === clientId) {
      found = true;
      return {
        ...deal,
        stage: newStage,
        updatedAt: new Date().toISOString().slice(0, 10),
        ...(extraData || {}),
      };
    }
    return deal;
  });

  if (!found && extraData?.clientName) {
    // Si no existía el deal, lo crea automáticamente
    const newDeal: CRMDeal = {
      id: `deal-${Date.now()}`,
      clientId,
      clientName: extraData.clientName,
      company: extraData.company || 'Empresa Prospecto',
      email: extraData.email || '',
      phone: extraData.phone || '',
      title: extraData.title || `Proyecto ${extraData.clientName}`,
      valueCLP: extraData.valueCLP || 850000,
      stage: newStage,
      updatedAt: new Date().toISOString().slice(0, 10),
      ...(extraData || {}),
    };
    return [newDeal, ...deals];
  }

  return updated;
}
