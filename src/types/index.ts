export type Environment = 'admin' | 'studio';

export type AdminTab = 'metricas' | 'seo' | 'calendar' | 'telemetria' | 'soc' | 'faqs';

export type StudioTab =
  | 'evaluacion'
  | 'cotizador'
  | 'crm'
  | 'branding'
  | 'proyectos'
  | 'maquetas'
  | 'configuracion';

export type CRMStage =
  | 'reunion_agendada'
  | 'en_evaluacion'
  | 'propuesta_enviada'
  | 'en_negociacion'
  | 'proyecto_aprobado'
  | 'en_monitoreo';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  source: string;
  createdAt: string;
}

export interface CRMDeal {
  id: string;
  clientId: string;
  clientName: string;
  company: string;
  email: string;
  phone: string;
  title: string;
  valueCLP: number;
  stage: CRMStage;
  meetingDate?: string;
  meetLink?: string;
  notes?: string;
  evaluationId?: string;
  quoteId?: string;
  projectId?: string;
  updatedAt: string;
}

export interface InfrastructureItem {
  id: string;
  name: string;
  provider: string;
  costCLP: number;
  billingPeriod: 'anual' | 'mensual' | 'gratis';
  category: 'dominio' | 'hosting' | 'database' | 'seguridad' | 'saas';
  notes?: string;
}

export interface ProspectEvaluation {
  id: string;
  clientId: string;
  clientName: string;
  company: string;
  country: string;
  email: string;
  phone: string;
  source: string;
  // Fase 2: Diagnóstico & Viabilidad
  businessModel: 'b2c_ecommerce' | 'b2b_servicios' | 'gestion_interna' | 'saas';
  currentPlatform: string;
  estimatedMonthlySalesCLP: number;
  foda: {
    fortalezas: string[];
    oportunidades: string[];
    debilidades: string[];
    amenazas: string[];
  };
  pestel: {
    politico: string;
    economico: string;
    social: string;
    tecnologico: string;
    ecologico: string;
    legal: string;
  };
  viabilityDecision: 'go_viable' | 'go_con_ajustes' | 'no_go';
  viabilityRationale: string;
  // Fase 3: Infraestructura
  nicCostCLP: number; // 9990
  hostingOption: string; // TecnoInver 30000, Cloudflare gratis, etc.
  hostingCostCLP: number;
  databaseOption: string; // Supabase (con keep-alive), Firebase, Cloudflare D1
  databaseCostCLP: number;
  architectureType: 'monolito' | 'microservicios' | 'serverless_jamstack';
  securityTier: 'esencial_cloudflare' | 'avanzado';
  // Fase 4: Score
  scoreLevel: 'Prospecto A (Prioritario)' | 'Prospecto B (Viable)' | 'Prospecto C (Riesgoso)';
  totalEstimatedBudgetCLP: number;
  createdAt: string;
}

export interface QuoteSprint {
  sprintNumber: number;
  title: string;
  durationWeeks: number;
  deliverables: string[];
  definitionOfDone: string;
}

export interface QuoteService {
  id: string;
  title: string;
  description: string;
  priceCLP: number;
}

export interface Quote {
  id: string;
  quoteNumber: string; // ej. N° 005
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany: string;
  projectTitle: string;
  subtitle: string;
  outcome: string; // Qué logrará el cliente
  services: QuoteService[];
  totalCLP: number;
  paymentCondition: '100_anticipado' | '50_50' | '40_30_30' | 'personalizado';
  paymentConditionDetails: string;
  taxDocument: 'factura' | 'boleta';
  deliveryTimeDays: number;
  validityDays: number;
  sprints: QuoteSprint[];
  status: 'borrador' | 'en_revision' | 'en_negociacion' | 'aprobada' | 'en_desarrollo' | 'entregada';
  createdAt: string;
}

export interface BrandPrismFacet {
  fisicas: string;
  personalidad: string;
  cultura: string;
  relacion: string;
  reflejo: string;
  autoimagen: string;
}

export interface LogoCandidate {
  id: string;
  iteration: number;
  svgCode: string;
  conceptName: string;
  meaning: string;
  essence: string;
  selected: boolean;
}

export interface ColorToken {
  name: string;
  hex: string;
  usage: string;
  contrastOnWhite: number; // ej. 4.5
  wcagAA: boolean;
}

export interface BrandingProject {
  id: string;
  clientId: string;
  brandName: string;
  tagline: string;
  // Etapa 1: Discovery
  vision: string;
  mision: string;
  valores: string[];
  historia: string;
  audienciaPrimaria: string;
  audienciaSecundaria: string;
  mercadosObjetivo: string[];
  auditoriaCompetencia: string;
  whitespaceCompetitivo: string;
  analisisSemiotico: string;
  // Etapa 2: Estrategia
  arquetipo: string;
  positioningStatement: string;
  propuestaValor: string;
  brandKey: string;
  brandArchitecture: 'monolitica' | 'endosada' | 'marcas_independientes';
  prism: BrandPrismFacet;
  // Etapa 3: Identidad Verbal
  tonoVoz: string;
  manifiesto: string;
  // Etapa 4: Logos
  currentIteration: number;
  logos: LogoCandidate[];
  winningLogoId?: string;
  customUploadedLogoUrl?: string;
  // Etapa 5: Sistema Visual
  primaryColors: ColorToken[];
  secondaryColors: ColorToken[];
  displayFont: string;
  bodyFont: string;
  // Etapa 6: Aplicaciones
  activationPlan: string;
  brandGovernance: string;
  updatedAt: string;
}

export interface ProjectBrief {
  id: string;
  clientId: string;
  brandName: string;
  targetMarket: string;
  sector: string;
  startDate: string;
  responsibles: string;
  summary: string;
  projectType: 'e-commerce' | 'gestion_interna' | 'b2b' | 'saas';
  ecommercePlatform: 'Shopify' | 'WooCommerce' | 'Headless' | 'Custom';
  shopifyPlan?: string;
  successDefinition: string;
  buyerPersonas: {
    name: string;
    profile: string;
    device: string;
    needs: string[];
    pains: string[];
  }[];
  usabilityKPIs: string[];
  updatedAt: string;
}

export interface DesignSystem {
  id: string;
  projectId: string;
  brandName: string;
  colors: ColorToken[];
  typography: {
    display: string;
    body: string;
    scale: { level: string; size: string; weight: string }[];
  };
  principles: string[];
  cssTokens: string;
  assetsDescription: string;
  updatedAt: string;
}

export type MockupType = 'homepage' | 'producto' | 'catalogo' | 'carrito' | 'checkout' | 'stock_dashboard' | 'b2b_landing';

export interface MockupConfig {
  id: string;
  projectId: string;
  brandName: string;
  projectType: 'e-commerce' | 'gestion_interna' | 'b2b' | 'saas';
  activeModules: MockupType[];
  currentViewport: 'desktop' | 'mobile';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

export interface SEOKeyword {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CalendarBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  company: string;
  serviceInterest: string;
  date: string;
  time: string;
  meetUrl: string;
  status: 'confirmada' | 'completada' | 'cancelada';
  crmDealCreated: boolean;
}

export interface MonitoredProject {
  id: string;
  name: string;
  clientName: string;
  url: string;
  status: 'online' | 'degraded' | 'offline';
  uptimePercentage: number;
  avgResponseTimeMs: number;
  sslValid: boolean;
  sslExpiresDays: number;
  lastHeartbeat: string;
  supabaseKeepAliveEnabled: boolean;
  lastSupabasePing?: string;
  recentErrors: { message: string; timestamp: string }[];
}

export interface SecurityAsset {
  id: string;
  projectId: string;
  name: string;
  type: 'dominio_dns' | 'servidor_hosting' | 'base_de_datos' | 'pasarela_pago' | 'panel_admin' | 'api_key';
  criticality: 'alta' | 'media' | 'baja';
  estimatedValueCLP: number;
  provider: string;
}

export interface SecurityRisk {
  id: string;
  projectId: string;
  assetId: string;
  assetName: string;
  threatName: string;
  threatCategory: 'ddos' | 'inyeccion_sql' | 'fuerza_bruta' | 'fuga_datos' | 'caida_pasarela' | 'ssl_caido';
  impactDescription: string;
  // Cálculo ALE
  sleCLP: number; // Single Loss Expectancy (pérdida por evento)
  aro: number; // Annualized Rate of Occurrence (veces por año ej 0.2, 1, 2)
  aleCLP: number; // sle * aro
  mitigationStrategy: string;
  status: 'mitigado' | 'en_progreso' | 'pendiente';
}

export interface SecurityPlaybook {
  id: string;
  triggerEvent: string;
  title: string;
  description: string;
  steps: { order: number; action: string; commandOrLink?: string }[];
}

export interface UserProfileSecurity {
  email: string;
  passwordHash?: string;
  hasCustomPassword: boolean;
  masterPin: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes: string[];
  lastLogin?: string;
}

export interface AppSettings {
  deepseekApiKey: string;
  geminiApiKey: string;
  groqApiKey: string;
  mistralApiKey: string;
  openrouterApiKey: string;
  preferredModel: 'auto' | 'gemini' | 'deepseek' | 'groq' | 'mistral' | 'openrouter' | 'offline';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseKeepAliveIntervalDays: number;
  nicChileCostCLP: number;
  tecnoInverCostCLP: number;
  telemetryEndpoint: string;
  userSecurity?: UserProfileSecurity;
}

