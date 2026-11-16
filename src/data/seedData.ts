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
  InfrastructureRate,
} from '../types';

export const DEFAULT_INFRASTRUCTURE_RATES: InfrastructureRate[] = [
  {
    id: 'infra-nic-cl',
    name: 'Dominio Nacional (.cl)',
    category: 'dominio',
    billingPeriod: 'anual',
    costCLP: 10950,
    provider: 'NIC Chile',
    notes: 'Tarifa oficial anual con IVA para dominios territoriales .cl',
    isSyncedToQuotes: true,
  },
  {
    id: 'infra-tecnoinver-shared',
    name: 'Hosting Compartido TecnoInver',
    category: 'hosting',
    billingPeriod: 'anual',
    costCLP: 30000,
    provider: 'TecnoInver',
    notes: 'Plan cPanel nacional estándar para pymes y páginas web informativas',
    isSyncedToQuotes: true,
  },
  {
    id: 'infra-wordpress-hosting',
    name: 'Hosting Especializado WordPress / WooCommerce',
    category: 'hosting',
    billingPeriod: 'anual',
    costCLP: 45000,
    provider: 'Hostinger / TecnoInver Pro',
    notes: 'Optimizado para WordPress con caché LiteSpeed, PHP 8.3 y SSL',
    isSyncedToQuotes: true,
  },
  {
    id: 'infra-vps-cloud',
    name: 'VPS Cloud Básico (1 vCPU, 2GB RAM)',
    category: 'vps',
    billingPeriod: 'mensual',
    costCLP: 8500,
    provider: 'DigitalOcean / Linode',
    notes: 'Para aplicaciones Node.js, Python FastAPI o bases de datos dedicadas',
    isSyncedToQuotes: false,
  },
  {
    id: 'infra-supabase-pro',
    name: 'Supabase Cloud Pro (Base de Datos)',
    category: 'saas',
    billingPeriod: 'mensual',
    costCLP: 24000,
    provider: 'Supabase Inc.',
    notes: 'Sin pausas automáticas de 7 días, 8GB BD PostgreSQL y backups diarios',
    isSyncedToQuotes: false,
  },
  {
    id: 'infra-ssl-letsencrypt',
    name: 'Certificado SSL Automático (Wildcard)',
    category: 'saas',
    billingPeriod: 'anual',
    costCLP: 0,
    provider: 'Cloudflare / Let\'s Encrypt',
    notes: 'Cifrado HTTPS obligatorio gratuito con renovación automática',
    isSyncedToQuotes: true,
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  deepseekApiKey: '',
  geminiApiKey: '',
  groqApiKey: '',
  mistralApiKey: '',
  openrouterApiKey: '',
  preferredModel: 'auto',
  supabaseUrl: 'https://cvfybrtblxzpawnxqsnd.supabase.co',
  supabaseAnonKey: 'sb_publishable_FaHiwWE7FIHP5-Xr7F6UQg_bJYFphXb',
  supabaseKeepAliveIntervalDays: 3,
  nicChileCostCLP: 10950,
  tecnoInverCostCLP: 30000,
  infrastructureRates: DEFAULT_INFRASTRUCTURE_RATES,
  telemetryEndpoint: 'https://cvfybrtblxzpawnxqsnd.supabase.co/rest/v1/telemetry_logs',
};

// 1. Clientes reales: Inicialmente vacío, se puebla al recibir contactos o agendamientos reales
export const SEED_CLIENTS: Client[] = [];

// 2. Deals / Negocios del CRM: Inicialmente vacío ($0 CLP), se puebla al crear cotizaciones o proyectos reales
export const SEED_DEALS: CRMDeal[] = [];

// 3. Evaluaciones: Inicialmente vacío
export const SEED_EVALUATIONS: ProspectEvaluation[] = [];

// 4. Cotizaciones: Inicialmente vacío
export const SEED_QUOTES: Quote[] = [];

// 5. Branding Projects
export const SEED_BRANDING: BrandingProject = {
  id: 'brand-init',
  clientId: '',
  brandName: 'Mi Proyecto',
  tagline: 'Innovación y diseño a medida',
  vision: 'Ser referente en soluciones web optimizadas',
  mision: 'Entregar herramientas intuitivas y seguras',
  valores: ['Innovación', 'Calidad', 'Seguridad'],
  historia: 'Iniciativa orientada a optimizar procesos digitales.',
  audienciaPrimaria: 'Pymes y particulares en Chile',
  audienciaSecundaria: 'Profesionales independientes',
  mercadosObjetivo: ['Chile'],
  auditoriaCompetencia: 'Mercado de agencias tradicionales',
  whitespaceCompetitivo: 'Atención personalizada y metodologías ágiles',
  analisisSemiotico: 'Simplicidad, confianza y orden',
  arquetipo: 'El Creador',
  positioningStatement: 'La alternativa ágil y moderna para el desarrollo web',
  propuestaValor: 'Desarrollo web a medida con telemetría integrada y monitoreo continuo',
  brandKey: 'Enfoque técnico de alto estándar',
  brandArchitecture: 'monolitica',
  prism: {
    fisicas: 'Minimalista y limpio',
    personalidad: 'Estructurada y atenta',
    cultura: 'Eficiencia y precisión',
    relacion: 'Colaborativa y transparente',
    reflejo: 'Profesionales proactivos',
    autoimagen: 'Seguridad en el producto',
  },
  tonoVoz: 'Profesional, cercano y claro',
  manifiesto: 'Construir código de calidad sin fricciones.',
  currentIteration: 1,
  logos: [],
  primaryColors: [
    { name: 'Principal', hex: '#0F172A', usage: 'Dominante', contrastOnWhite: 14.2, wcagAA: true },
    { name: 'Acento', hex: '#E11D48', usage: 'Acción / CTA', contrastOnWhite: 4.8, wcagAA: true },
  ],
  secondaryColors: [
    { name: 'Fondo Claro', hex: '#F8FAFC', usage: 'Superficie', contrastOnWhite: 1.1, wcagAA: false },
    { name: 'Borde', hex: '#E2E8F0', usage: 'Líneas', contrastOnWhite: 1.3, wcagAA: false },
  ],
  displayFont: 'Inter',
  bodyFont: 'Inter',
  activationPlan: 'Lanzamiento digital inicial',
  brandGovernance: 'Uso de tokens de diseño consistentes',
  updatedAt: new Date().toISOString().slice(0, 10),
};

// 6. Briefs de Proyectos
export const SEED_BRIEF: ProjectBrief = {
  id: 'brief-init',
  clientId: '',
  brandName: 'Proyecto Nuevo',
  targetMarket: 'Chile',
  sector: 'Desarrollo Web & Software',
  startDate: new Date().toISOString().slice(0, 10),
  responsibles: 'Tiare Pérez Concha',
  summary: 'Plataforma web con monitoreo y seguridad activa.',
  projectType: 'saas',
  ecommercePlatform: 'Custom',
  successDefinition: 'El proyecto se considera exitoso cuando cuenta con telemetría activa y 100% de uptime.',
  buyerPersonas: [],
  usabilityKPIs: ['Tiempo de carga < 2.0s', 'Disponibilidad > 99.9%'],
  updatedAt: new Date().toISOString().slice(0, 10),
};

export const SEED_DESIGN_SYSTEM: DesignSystem = {
  id: 'ds-init',
  projectId: 'brief-init',
  brandName: 'Sistema de Diseño LSC',
  colors: SEED_BRANDING.primaryColors.concat(SEED_BRANDING.secondaryColors),
  typography: {
    display: 'Inter',
    body: 'Inter',
    scale: [
      { level: 'H1', size: '36px', weight: '700' },
      { level: 'H2', size: '28px', weight: '600' },
      { level: 'H3', size: '20px', weight: '600' },
      { level: 'Body', size: '14px', weight: '400' },
      { level: 'Small', size: '12px', weight: '400' },
    ],
  },
  principles: ['Velocidad', 'Accesibilidad WCAG 2.1 AA', 'Privacidad'],
  cssTokens: ':root { --primary: #0F172A; --accent: #E11D48; }',
  assetsDescription: 'Tokens y assets digitales',
  updatedAt: new Date().toISOString().slice(0, 10),
};

// 7. SEO Keywords: Datos reales sincronizados de Google Search Console API (sc-domain:conpi.cl)
import gscLiveCache from './gsc_live_cache.json';
export const SEED_SEO_KEYWORDS: SEOKeyword[] = (
  Array.isArray(gscLiveCache)
    ? gscLiveCache
    : (gscLiveCache as any)?.periods?.['28d']?.queries || []
) as SEOKeyword[];

// 8. Bookings de Google Calendar: Inicialmente vacío, se puebla con agendamientos reales
export const SEED_CALENDAR: CalendarBooking[] = [];

// 9. Proyectos Reales Monitoreados con la API de Telemetría inyectada
export const SEED_MONITORED_PROJECTS: MonitoredProject[] = [
  {
    id: 'conpi-app',
    name: 'CONPI - Insumos & Repuestos de Carnicería (conpi.cl)',
    clientName: 'CONPI Chile (conpi.cl)',
    url: 'https://conpi.cl',
    status: 'online',
    uptimePercentage: 100.0,
    avgResponseTimeMs: 220,
    sslValid: true,
    sslExpiresDays: 365,
    lastHeartbeat: 'Verificado en Vivo (200 OK)',
    supabaseKeepAliveEnabled: false,
    lastSupabasePing: 'Alojado en cPanel TecnoInver (MySQL)',
    recentErrors: [],
    gscProperty: 'sc-domain:conpi.cl',
    gscConnected: true,
    stack: ['React 18', 'Vite', 'Tailwind CSS', 'REST API / MySQL'],
    queues: ['Worker Background Cron'],
    databaseType: 'mysql_cpanel',
    databaseStatus: 'online',
    dbStorageQuota: {
      usedMB: 142.5,
      limitMB: 2048,
      percent: 6.9,
      isFreeTier: false,
    },
    commitHash: '92c473f',
    commitDate: '2026-11-16 09:10',
    supportWarrantyDays: 90,
    pendingTasks: [
      { id: 't1', title: 'Comprimir catálogo de imágenes con WebP', completed: true, category: 'Rendimiento' },
      { id: 't2', title: 'Auditoría mensual de Core Web Vitals en móvil', completed: false, category: 'SEO' },
    ],
    backupLinks: [
      { name: 'Respaldo Completo cPanel TecnoInver (Base de datos MySQL & Archivos)', url: 'https://conpi.cl/cpanel', date: '2026-11-10' },
    ],
    dbHealthPingMs: 28,
    daysWithoutPause: 0,
    lifecycleStage: 'produccion',
    versionDeployed: 'v2.4.1 (Producción Activa)',
    qaChecklist: {
      seo: true,
      responsive: true,
      errorHandling: true,
      security: true,
      backups: true,
    },
    infraVault: {
      domainRegistrar: 'NIC Chile (.cl)',
      hostingProvider: 'cPanel TecnoInver & Cloudflare SSL',
      costCategory: 'pago_anual',
      estimatedCostCLP: 45000,
      renewalDate: '2025-10-15',
    },
    deepLinks: {
      github: 'https://github.com/TiarePerezConcha/conpi',
      searchConsole: 'https://search.google.com/search-console?resource_id=sc-domain:conpi.cl',
      cpanel: 'https://conpi.cl/cpanel',
    },
    notes: [
      'Plataforma e-commerce y catálogo técnico de repuestos para carnicerías industriales.',
      'Sincronización activa con Google Search Console API mediante cuenta de servicio oficial.',
      'Alojado en cPanel TecnoInver con base de datos MySQL.',
    ],
    incidentHistory: [
      {
        id: 'inc-conpi-01',
        date: '2026-11-16 13:11',
        author: 'Soporte TecnoInver & Administradora',
        causeType: 'ataque_fuerza_bruta',
        solutionType: 'solucionable_usuario',
        antecedentText: 'Caída de conpi.cl y bloqueo por reglas de seguridad de cPanel / cPHulk / Fail2Ban debido a múltiples intentos fallidos de autenticación en la casilla de correo contacto@conpi.cl.',
        systemVerification: '✓ Verificación del Administrador de Proyectos: El administrador opera 100% aislado de servidores de correo (no usa IMAP, POP3 ni SMTP ni almacena credenciales de correo). No generó los reintentos de login. Se recomienda auditar clientes de correo locales en celulares/notebooks y solicitar Whitelist de IP en cPanel.',
        status: 'resuelto',
      },
    ],
    isPersonalProject: false,
  },
  {
    id: 'adm-proyectos',
    name: 'Plataforma Administrador de Proyectos',
    clientName: 'Tiare Pérez Concha (Propio)',
    url: 'https://tiareperezconcha.github.io/adm_proyectos/',
    status: 'online',
    uptimePercentage: 100.0,
    avgResponseTimeMs: 260,
    sslValid: true,
    sslExpiresDays: 365,
    lastHeartbeat: 'Verificado en Vivo (200 OK)',
    supabaseKeepAliveEnabled: true,
    lastSupabasePing: 'Conectado a cvfybrtblxzpawnxqsnd',
    recentErrors: [],
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase Cloud'],
    queues: ['Keep-Alive Cron 3d', 'Google Calendar Sync Worker'],
    databaseType: 'supabase_postgres',
    databaseStatus: 'online',
    dbStorageQuota: {
      usedMB: 0.12,
      limitMB: 500,
      percent: 0.024,
      isFreeTier: true,
    },
    commitHash: '88fa8e7',
    commitDate: '2026-11-16 09:12',
    supportWarrantyDays: 365,
    pendingTasks: [
      { id: 't4', title: 'Sincronizar Service Account con Search Console para otros dominios', completed: false, category: 'SEO' },
      { id: 't5', title: 'Verificar cuota de tokens en Gemini Free Tier', completed: true, category: 'IA' },
    ],
    backupLinks: [
      { name: 'Backup Supabase telemetry_logs', url: 'https://cvfybrtblxzpawnxqsnd.supabase.co', date: '2026-11-16' },
      { name: 'GitHub Repo Snapshot (Branch main)', url: 'https://github.com/TiarePerezConcha/adm_proyectos', date: '2026-11-16' },
    ],
    dbHealthPingMs: 38,
    daysWithoutPause: 0,
    lifecycleStage: 'produccion',
    versionDeployed: 'v1.2.0 Operations & Security',
    qaChecklist: {
      seo: true,
      responsive: true,
      errorHandling: true,
      security: true,
      backups: true,
    },
    infraVault: {
      domainRegistrar: 'GitHub Pages (Gratuito)',
      hostingProvider: 'GitHub Cloud / Supabase Cloud Free Tier',
      costCategory: 'gratis_tier',
      estimatedCostCLP: 0,
      renewalDate: 'Indefinido (Tier Gratuito)',
    },
    deepLinks: {
      github: 'https://github.com/TiarePerezConcha/adm_proyectos',
      supabase: 'https://supabase.com/dashboard/project/cvfybrtblxzpawnxqsnd',
    },
    notes: [
      'Panel central de operaciones LSC: CRM, SEO Search Console, Google Calendar y Telemetría.',
      'Aloja el módulo Keep-Alive central que audita y previene pausas en la base de datos.',
    ],
    isPersonalProject: true,
    aiUsage: [
      {
        provider: 'Google AI Studio',
        model: 'Gemini 1.5 Pro / Flash',
        tokensUsed: 12500,
        tokensLimit: 500000,
        renewalDate: 'Diaria (Tier Gratis)',
        costUSD: 0.0,
      },
    ],
  },
  {
    id: 'curriculumpage-tiare',
    name: 'Portfolio & CV Tiare Pérez',
    clientName: 'Tiare Pérez Concha (Marca Personal)',
    url: 'https://tiareperezconcha.github.io/curriculum/tiare/',
    status: 'online',
    uptimePercentage: 100.0,
    avgResponseTimeMs: 215,
    sslValid: true,
    sslExpiresDays: 365,
    lastHeartbeat: 'Verificado en Vivo (200 OK)',
    supabaseKeepAliveEnabled: false,
    lastSupabasePing: '100% Frontend Estático (Sin BBDD)',
    recentErrors: [],
    stack: ['HTML5 Moderno', 'CSS3 Vanilla', 'JavaScript', 'GitHub Pages'],
    databaseType: 'static_none',
    databaseStatus: 'sin_bbdd',
    commitHash: '202611a',
    commitDate: '2026-11-14',
    pendingTasks: [
      { id: 't6', title: 'Actualizar certificaciones y nuevos proyectos en CV', completed: true, category: 'Contenido' },
    ],
    lifecycleStage: 'produccion',
    versionDeployed: 'v2.0 (Online)',
    qaChecklist: {
      seo: true,
      responsive: true,
      errorHandling: true,
      security: true,
      backups: true,
    },
    infraVault: {
      domainRegistrar: 'GitHub Pages',
      hostingProvider: 'GitHub CDN Global',
      costCategory: 'gratis_tier',
      estimatedCostCLP: 0,
      renewalDate: 'Permanente',
    },
    deepLinks: {
      github: 'https://github.com/TiarePerezConcha/curriculum',
    },
    notes: [
      'Sitio estático de presentación profesional y portafolio de proyectos.',
      'No utiliza base de datos ni requiere Keep-Alive.',
    ],
    isPersonalProject: true,
  },
  {
    id: 'curriculumpage-fernando',
    name: 'Curriculum Fernando Figueroa',
    clientName: 'Fernando Figueroa',
    url: 'https://tiareperezconcha.github.io/FERNANDO_ALEJANDRO_FIGUEROA_CERDA/',
    status: 'online',
    uptimePercentage: 100.0,
    avgResponseTimeMs: 185,
    sslValid: true,
    sslExpiresDays: 365,
    lastHeartbeat: 'Verificado en Vivo (200 OK)',
    supabaseKeepAliveEnabled: false,
    lastSupabasePing: '100% Frontend Estático (Sin BBDD)',
    recentErrors: [],
    stack: ['HTML5', 'CSS3', 'JavaScript Vanilla', 'GitHub Pages'],
    databaseType: 'static_none',
    lifecycleStage: 'produccion',
    versionDeployed: 'v1.0 (Online)',
    qaChecklist: {
      seo: true,
      responsive: true,
      errorHandling: true,
      security: true,
      backups: true,
    },
    infraVault: {
      domainRegistrar: 'GitHub Pages',
      hostingProvider: 'GitHub CDN Global',
      costCategory: 'gratis_tier',
      estimatedCostCLP: 0,
      renewalDate: 'Permanente',
    },
    deepLinks: {
      github: 'https://github.com/TiarePerezConcha/FERNANDO_ALEJANDRO_FIGUEROA_CERDA',
    },
    notes: [
      'Portfolio profesional desarrollado para Fernando Alejandro Figueroa Cerda.',
      'Sitio 100% estático frontend sin conexión a BBDD.',
    ],
    isPersonalProject: false,
  },
];

// 10. Activos de Ciberseguridad por proyecto real
export const SEED_SECURITY_ASSETS: SecurityAsset[] = [
  {
    id: 'asset-1',
    projectId: 'mon-adm-proyectos',
    name: 'Base de Datos Supabase Postgres',
    type: 'base_de_datos',
    criticality: 'alta',
    estimatedValueCLP: 5000000,
    provider: 'Supabase Cloud (cvfybrtblxzpawnxqsnd)',
  },
  {
    id: 'asset-2',
    projectId: 'mon-adm-proyectos',
    name: 'Repositorio GitHub & Actions (GitHub Pages)',
    type: 'servidor_hosting',
    criticality: 'alta',
    estimatedValueCLP: 3500000,
    provider: 'GitHub Inc.',
  },
  {
    id: 'asset-3',
    projectId: 'mon-curriculum-tiare',
    name: 'Dominio y Hosting GitHub Pages',
    type: 'dominio_dns',
    criticality: 'media',
    estimatedValueCLP: 1200000,
    provider: 'GitHub Pages / SSL DigiCert',
  },
];

// 11. Riesgos de Seguridad y Cálculo ALE Real
export const SEED_SECURITY_RISKS: SecurityRisk[] = [
  {
    id: 'risk-1',
    projectId: 'mon-adm-proyectos',
    assetId: 'asset-1',
    assetName: 'Base de Datos Supabase Postgres',
    threatName: 'Pausa por inactividad tras 7 días',
    threatCategory: 'caida_pasarela',
    impactDescription: 'Suspensión temporal del servicio y consultas de la API si no recibe pings.',
    sleCLP: 300000,
    aro: 0.1, // Mitigado a casi 0 gracias al Keep-Alive
    aleCLP: 30000,
    mitigationStrategy: 'Keep-Alive automático cada 3 días vía cron-job.org activo.',
    status: 'mitigado',
  },
  {
    id: 'risk-2',
    projectId: 'mon-adm-proyectos',
    assetId: 'asset-2',
    assetName: 'Panel Admin & Studio',
    threatName: 'Intento de inyección de código / Acceso no autorizado',
    threatCategory: 'inyeccion_sql',
    impactDescription: 'Intentos de manipular formularios o acceder sin credenciales válidas.',
    sleCLP: 1500000,
    aro: 0.05,
    aleCLP: 75000,
    mitigationStrategy: 'Sistema de 3 capas: Validación de correo tiare.perezconcha@gmail.com, PIN maestro, 2FA Google Authenticator y sanitización anti-XSS.',
    status: 'mitigado',
  },
];

// 12. Playbooks SOC
export const SEED_SECURITY_PLAYBOOKS: SecurityPlaybook[] = [
  {
    id: 'pb-1',
    triggerEvent: 'caida_supabase',
    title: 'Playbook: Restauración de Conexión Supabase',
    description: 'Procedimiento de reconexión inmediata si Supabase deja de responder.',
    steps: [
      { order: 1, action: 'Verificar estado del cron-job en console.cron-job.org', commandOrLink: 'https://console.cron-job.org/jobs' },
      { order: 2, action: 'Realizar ping manual a /auth/v1/health desde el Monitor', commandOrLink: 'https://cvfybrtblxzpawnxqsnd.supabase.co/auth/v1/health' },
      { order: 3, action: 'Revisar logs en el dashboard de Supabase', commandOrLink: 'https://supabase.com/dashboard/project/cvfybrtblxzpawnxqsnd' },
    ],
  },
  {
    id: 'pb-2',
    triggerEvent: 'anomalia_javascript',
    title: 'Playbook: Respuesta ante Errores JS en Sitios Clientes',
    description: 'Acciones al detectar anomalías o errores no controlados reportados por el agente.',
    steps: [
      { order: 1, action: 'Filtrar eventos tipo security_anomaly en telemetry_logs' },
      { order: 2, action: 'Identificar URL y navegador donde se originó el fallo' },
      { order: 3, action: 'Corregir script y desplegar parche a producción' },
    ],
  },
];
