import { supabase } from '../services/supabaseClient';
import { Client, CRMDeal, Quote, ProspectEvaluation, MonitoredProject, CalendarBooking } from '../types';

/**
 * Servicio de Sincronización Automática Bidireccional con Supabase Cloud
 * Maneja la persistencia y lectura en tiempo real de todas las tablas relacionales.
 */

// ============================================================
// 1. CARGA INICIAL DE DATOS DESDE SUPABASE CLOUD
// ============================================================

export async function fetchInitialDataFromSupabase() {
  try {
    const [
      clientsRes,
      dealsRes,
      quotesRes,
      evaluationsRes,
      projectsRes,
      calendarRes,
      docsRes,
      gscRes,
      pagespeedRes,
      aiQuotaRes,
      domainsRes,
    ] = await Promise.allSettled([
      supabase.from('clients').select('*'),
      supabase.from('crm_deals').select('*'),
      supabase.from('quotes').select('*'),
      supabase.from('evaluations').select('*'),
      supabase.from('monitored_projects').select('*'),
      supabase.from('calendar_bookings').select('*'),
      supabase.from('project_documentation').select('*'),
      supabase.from('search_console_metrics').select('*'),
      supabase.from('pagespeed_metrics').select('*'),
      supabase.from('ai_quota_monitoring').select('*'),
      supabase.from('project_domains').select('*'),
    ]);

    const clients: Client[] =
      clientsRes.status === 'fulfilled' && clientsRes.value.data
        ? clientsRes.value.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            company: c.company || c.name,
            email: c.email || '',
            phone: c.phone || '',
            country: c.country || 'Chile',
            source: c.source || 'Manual',
            createdAt: c.created_at,
          }))
        : [];

    const deals: CRMDeal[] =
      dealsRes.status === 'fulfilled' && dealsRes.value.data
        ? dealsRes.value.data.map((d: any) => ({
            id: d.id,
            clientId: d.client_id || '',
            clientName: d.client_name,
            company: d.company || d.client_name,
            email: d.email || '',
            phone: d.phone || '',
            title: d.title,
            valueCLP: Number(d.value_clp) || 0,
            stage: d.stage || 'reunion_agendada',
            meetingDate: d.meeting_date,
            meetLink: d.meet_link,
            notes: d.notes,
            projectId: d.project_id,
            updatedAt: d.updated_at,
          }))
        : [];

    const quotes: Quote[] =
      quotesRes.status === 'fulfilled' && quotesRes.value.data
        ? quotesRes.value.data.map((q: any) => ({
            id: q.id,
            quoteNumber: q.quote_number,
            clientId: q.client_id || '',
            clientName: q.client_name,
            clientCompany: q.client_company,
            clientEmail: q.client_email || '',
            clientPhone: q.client_phone || '',
            projectTitle: q.project_title,
            subtitle: q.subtitle,
            outcome: q.outcome,
            services: q.services || [],
            sprints: q.sprints || [],
            totalCLP: Number(q.total_clp) || 0,
            paymentCondition: q.payment_condition || '50_50',
            paymentConditionDetails: q.payment_details,
            taxDocument: q.tax_document || 'factura',
            deliveryTimeDays: q.delivery_time_days || 14,
            validityDays: q.validity_days || 15,
            status: q.status || 'borrador',
            createdAt: q.created_at,
          }))
        : [];

    const evaluations: ProspectEvaluation[] =
      evaluationsRes.status === 'fulfilled' && evaluationsRes.value.data
        ? evaluationsRes.value.data.map((ev: any) => ({
            id: ev.id,
            clientId: ev.client_id || '',
            clientName: ev.client_name,
            company: ev.company || '',
            email: '',
            phone: '',
            country: 'Chile',
            source: 'Evaluación Studio',
            businessModel: ev.business_model || 'b2b_servicios',
            currentPlatform: ev.current_platform || '',
            estimatedMonthlySalesCLP: Number(ev.estimated_sales_clp) || 0,
            viabilityDecision: ev.viability_decision || 'go_viable',
            viabilityRationale: ev.viability_rationale || '',
            scoreLevel: ev.score_level || 'Prospecto A (Prioritario)',
            totalEstimatedBudgetCLP: Number(ev.budget_clp) || 0,
            nicCostCLP: ev.nic_cost_clp || 9990,
            hostingOption: ev.hosting_option || '',
            hostingCostCLP: ev.hosting_cost_clp || 30000,
            databaseOption: ev.database_option || '',
            databaseCostCLP: ev.database_cost_clp || 0,
            architectureType: ev.architecture_type || 'serverless_jamstack',
            securityTier: ev.security_tier || 'esencial_cloudflare',
            foda: ev.foda || { fortalezas: [], oportunidades: [], debilidades: [], amenazas: [] },
            pestel: ev.pestel || { politico: '', economico: '', social: '', tecnologico: '', ecologico: '', legal: '' },
            createdAt: ev.created_at,
          }))
        : [];

    const domainsList: any[] =
      domainsRes.status === 'fulfilled' && domainsRes.value.data
        ? domainsRes.value.data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            domain: d.domain_name || d.domain,
            provider: d.provider || 'NIC Chile (.cl)',
            expirationDate: d.expiration_date,
            isPrimary: d.is_primary ?? false,
            sslStatus: d.ssl_status || 'valido',
            redirectsTo: d.redirects_to,
          }))
        : [];

    const projects: Partial<MonitoredProject>[] =
      projectsRes.status === 'fulfilled' && projectsRes.value.data
        ? projectsRes.value.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            url: p.url,
            projectOwnershipType: p.project_ownership_type || 'cliente',
            isPersonalProject: p.is_personal_project ?? false,
            clientName: p.client_name,
            status: p.status || 'activo',
            uptime: Number(p.uptime_pct) || 99.8,
            latency: p.latency_ms || 240,
            ssl: p.ssl_status || 'valido',
            stack: p.stack || [],
            gscProperty: p.gsc_property,
            gscConnected: p.gsc_connected ?? false,
            incidentHistory: p.incident_history || [],
            clientBilling: p.client_billing,
            notes: p.notes || [],
            hostingProvider: p.hosting_provider || 'TecnoInver cPanel',
            hostingRenewalDate: p.hosting_renewal_date,
            domains: domainsList.filter((d: any) => d.projectId === p.id),
          }))
        : [];

    return {
      clients,
      deals,
      quotes,
      evaluations,
      projects,
      documentation: docsRes.status === 'fulfilled' ? docsRes.value.data : [],
      gsc: gscRes.status === 'fulfilled' ? gscRes.value.data : [],
      pagespeed: pagespeedRes.status === 'fulfilled' ? pagespeedRes.value.data : [],
      aiQuotas: aiQuotaRes.status === 'fulfilled' ? aiQuotaRes.value.data : [],
      calendar: calendarRes.status === 'fulfilled' ? calendarRes.value.data : [],
    };
  } catch (err) {
    console.warn('Error al obtener datos completos de Supabase:', err);
    return null;
  }
}

// ============================================================
// 2. SINCRONIZACIÓN DE CLIENTES & REPRESENTANTES LEGALES
// ============================================================

export async function syncClientToSupabase(client: Client) {
  try {
    const { error } = await supabase.from('clients').upsert({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      country: client.country || 'Chile',
      source: client.source || 'Manual',
      created_at: client.createdAt || new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (clients):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

export async function syncLegalRepToSupabase(rep: {
  id: string;
  clientId: string;
  name: string;
  rut: string;
  email?: string;
  phone?: string;
  position?: string;
}) {
  try {
    const { error } = await supabase.from('legal_representatives').upsert({
      id: rep.id,
      client_id: rep.clientId,
      name: rep.name,
      rut: rep.rut,
      email: rep.email,
      phone: rep.phone,
      position: rep.position || 'Representante Legal Autorizado',
      created_at: new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (legal_representatives):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

// ============================================================
// 3. SINCRONIZACIÓN DE DEALS DEL PIPELINE CRM
// ============================================================

export async function syncDealToSupabase(deal: CRMDeal) {
  try {
    const { error } = await supabase.from('crm_deals').upsert({
      id: deal.id,
      client_id: deal.clientId,
      project_id: deal.projectId || null,
      client_name: deal.clientName,
      company: deal.company,
      email: deal.email,
      phone: deal.phone,
      title: deal.title,
      value_clp: deal.valueCLP,
      stage: deal.stage,
      meeting_date: deal.meetingDate,
      meet_link: deal.meetLink,
      notes: deal.notes,
      updated_at: deal.updatedAt || new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (crm_deals):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

// ============================================================
// 4. SINCRONIZACIÓN DE PROYECTOS MONITOREADOS
// ============================================================

export async function syncMonitoredProjectToSupabase(project: MonitoredProject) {
  try {
    const { error } = await supabase.from('monitored_projects').upsert({
      id: project.id,
      name: project.name,
      url: project.url,
      project_ownership_type: project.projectOwnershipType || (project.isPersonalProject ? 'propio' : 'cliente'),
      is_personal_project: project.isPersonalProject ?? false,
      client_name: project.clientName || null,
      status: project.status || 'activo',
      uptime_pct: project.uptimePercentage ?? 99.8,
      latency_ms: project.avgResponseTimeMs ?? 240,
      ssl_status: project.sslValid ? 'valido' : 'sin_ssl',
      stack: project.stack || [],
      gsc_property: project.gscProperty || null,
      gsc_connected: project.gscConnected ?? false,
      incident_history: project.incidentHistory || [],
      client_billing: project.clientBilling || {},
      notes: project.notes || [],
      hosting_provider: project.hostingProvider || project.infraVault?.hostingProvider || 'TecnoInver cPanel',
      hosting_renewal_date: project.hostingRenewalDate || project.infraVault?.hostingRenewalDate || null,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (monitored_projects):', error.message);

    // Sincronizar dominios vinculados (1 a Muchos)
    if (project.domains && project.domains.length > 0) {
      for (const dom of project.domains) {
        await supabase.from('project_domains').upsert({
          id: dom.id || `dom-${project.id}-${dom.domain.replace(/[^a-z0-9]/gi, '_')}`,
          project_id: project.id,
          domain_name: dom.domain,
          provider: dom.provider || 'NIC Chile (.cl)',
          expiration_date: dom.expirationDate,
          is_primary: dom.isPrimary ?? false,
          ssl_status: dom.sslStatus || 'valido',
          redirects_to: dom.redirectsTo || null,
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

export async function syncAllProjectsToSupabase(projects: MonitoredProject[]) {
  for (const proj of projects) {
    await syncMonitoredProjectToSupabase(proj);
  }
}

// ============================================================
// 5. SINCRONIZACIÓN DE COTIZACIONES EXPRESS
// ============================================================

export async function syncQuoteToSupabase(quote: Quote) {
  try {
    const { error } = await supabase.from('quotes').upsert({
      id: quote.id,
      quote_number: quote.quoteNumber,
      client_id: quote.clientId,
      client_name: quote.clientName,
      client_company: quote.clientCompany,
      project_title: quote.projectTitle,
      subtitle: quote.subtitle,
      outcome: quote.outcome,
      services: quote.services,
      sprints: quote.sprints,
      total_clp: quote.totalCLP,
      payment_condition: quote.paymentCondition,
      payment_details: quote.paymentConditionDetails,
      tax_document: quote.taxDocument,
      delivery_time_days: quote.deliveryTimeDays,
      validity_days: quote.validityDays,
      status: quote.status,
      created_at: quote.createdAt || new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (quotes):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

// ============================================================
// 6. SINCRONIZACIÓN DE EVALUACIONES ESTRATÉGICAS
// ============================================================

export async function syncEvaluationToSupabase(evaluation: ProspectEvaluation) {
  try {
    const { error } = await supabase.from('evaluations').upsert({
      id: evaluation.id,
      client_id: evaluation.clientId,
      client_name: evaluation.clientName,
      company: evaluation.company,
      business_model: evaluation.businessModel,
      current_platform: evaluation.currentPlatform,
      estimated_sales_clp: evaluation.estimatedMonthlySalesCLP,
      viability_decision: evaluation.viabilityDecision,
      viability_rationale: evaluation.viabilityRationale,
      score_level: evaluation.scoreLevel,
      budget_clp: evaluation.totalEstimatedBudgetCLP,
      nic_cost_clp: evaluation.nicCostCLP,
      hosting_option: evaluation.hostingOption,
      database_option: evaluation.databaseOption,
      foda: evaluation.foda,
      pestel: evaluation.pestel,
      created_at: evaluation.createdAt || new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (evaluations):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

// ============================================================
// 7. SINCRONIZACIÓN DE DOCUMENTACIÓN LEGAL & CONTRATOS
// ============================================================

export async function syncDocumentationToSupabase(doc: {
  id: string;
  projectId: string;
  clientId?: string;
  legalRepId?: string;
  quoteId?: string;
  dealId?: string;
  docTitle: string;
  docCategory: string;
  documentOwnershipType?: string;
  contentText?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  totalCLP?: number;
  taxDocument?: string;
  isSigned?: boolean;
  signedDate?: string;
  notes?: string;
}) {
  try {
    const { error } = await supabase.from('project_documentation').upsert({
      id: doc.id,
      project_id: doc.projectId,
      client_id: doc.clientId || null,
      legal_rep_id: doc.legalRepId || null,
      quote_id: doc.quoteId || null,
      deal_id: doc.dealId || null,
      doc_title: doc.docTitle,
      doc_category: doc.docCategory,
      document_ownership_type: doc.documentOwnershipType || 'cliente',
      content_text: doc.contentText,
      file_url: doc.fileUrl,
      file_name: doc.fileName,
      file_size: doc.fileSize,
      total_clp: doc.totalCLP,
      tax_document: doc.taxDocument || 'factura',
      is_signed: doc.isSigned ?? false,
      signed_date: doc.signedDate,
      notes: doc.notes,
      created_at: new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (project_documentation):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

// ============================================================
// 8. SINCRONIZACIÓN DE GOOGLE SEARCH CONSOLE & PAGESPEED
// ============================================================

export async function syncSearchConsoleMetricsToSupabase(metrics: {
  id: string;
  projectId: string;
  domainProperty: string;
  syncStatus: 'vinculado' | 'por_vincular';
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  topQueries: any[];
  topPages: any[];
}) {
  try {
    const { error } = await supabase.from('search_console_metrics').upsert({
      id: metrics.id,
      project_id: metrics.projectId,
      domain_property: metrics.domainProperty,
      sync_status: metrics.syncStatus,
      total_clicks: metrics.totalClicks,
      total_impressions: metrics.totalImpressions,
      average_ctr: metrics.averageCtr,
      average_position: metrics.averagePosition,
      top_queries: metrics.topQueries,
      top_pages: metrics.topPages,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (search_console_metrics):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

export async function syncPageSpeedMetricsToSupabase(metrics: {
  id: string;
  projectId: string;
  url: string;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  fcpMs: number;
  lcpMs: number;
  cls: number;
  tbtMs: number;
}) {
  try {
    const { error } = await supabase.from('pagespeed_metrics').upsert({
      id: metrics.id,
      project_id: metrics.projectId,
      url: metrics.url,
      performance_score: metrics.performanceScore,
      accessibility_score: metrics.accessibilityScore,
      best_practices_score: metrics.bestPracticesScore,
      seo_score: metrics.seoScore,
      fcp_ms: metrics.fcpMs,
      lcp_ms: metrics.lcpMs,
      cls: metrics.cls,
      tbt_ms: metrics.tbtMs,
      analyzed_at: new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (pagespeed_metrics):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

// ============================================================
// 9. SINCRONIZACIÓN DE CUOTAS DE IA & CALENDARIO
// ============================================================

export async function syncAIQuotaToSupabase(quota: {
  id: string;
  provider: string;
  modelName: string;
  rpmLimit: number;
  tpmLimit: number;
  rpdLimit: number;
  costUSD: number;
  isActive: boolean;
  renewalDate?: string;
}) {
  try {
    const { error } = await supabase.from('ai_quota_monitoring').upsert({
      id: quota.id,
      provider: quota.provider,
      model_name: quota.modelName,
      rpm_limit: quota.rpmLimit,
      tpm_limit: quota.tpmLimit,
      rpd_limit: quota.rpdLimit,
      cost_usd: quota.costUSD,
      cost_blindado: true,
      is_active: quota.isActive,
      renewal_date: quota.renewalDate,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (ai_quota_monitoring):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

export async function syncCalendarBookingToSupabase(booking: CalendarBooking) {
  try {
    const { error } = await supabase.from('calendar_bookings').upsert({
      id: booking.id,
      client_name: booking.clientName,
      client_email: booking.clientEmail,
      client_phone: booking.clientPhone,
      company: booking.company,
      service_interest: booking.serviceInterest,
      booking_date: booking.date,
      booking_time: booking.time,
      meet_url: booking.meetUrl,
      status: booking.status,
      created_at: new Date().toISOString(),
    });
    if (error) console.warn('Error en Supabase (calendar_bookings):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}
