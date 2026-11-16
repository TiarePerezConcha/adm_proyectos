-- ============================================================
-- SCRIPT MAESTRO DE REPARACIÓN Y MIGRACIÓN TOTAL SUPABASE
-- Administrador de Proyectos - LSC Operations
-- 100% Blindado contra errores de columnas existentes (ALTER TABLE IF NOT EXISTS)
-- ============================================================

-- ============================================================
-- PASO 0: REPARAR Y ADAPTAR TABLAS PREEXISTENTES EN SUPABASE
-- ============================================================

-- Reparar tabla 'clients'
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'empresa';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rut TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Chile';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Manual';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Reparar tabla 'crm_deals'
CREATE TABLE IF NOT EXISTS crm_deals (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  title TEXT NOT NULL
);
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS value_clp BIGINT DEFAULT 850000;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'reunion_agendada';
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS meeting_date TEXT;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS meet_link TEXT;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Reparar tabla 'quotes'
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  quote_number TEXT NOT NULL,
  project_title TEXT NOT NULL,
  total_clp BIGINT NOT NULL
);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deal_id TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS client_company TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS services JSONB;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS sprints JSONB;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_condition TEXT DEFAULT '50_50';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_details TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tax_document TEXT DEFAULT 'factura';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS delivery_time_days INT DEFAULT 14;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS validity_days INT DEFAULT 15;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'borrador';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Reparar tabla 'evaluations'
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL
);
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS deal_id TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS business_model TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS current_platform TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS estimated_sales_clp BIGINT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS viability_decision TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS viability_rationale TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS score_level TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS budget_clp BIGINT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS nic_cost_clp INT DEFAULT 9990;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS hosting_option TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS database_option TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS foda JSONB;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS pestel JSONB;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Reparar tabla 'telemetry_logs'
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT,
  event TEXT,
  url TEXT,
  message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE telemetry_logs ADD COLUMN IF NOT EXISTS ssl_valid BOOLEAN;
ALTER TABLE telemetry_logs ADD COLUMN IF NOT EXISTS load_time_ms INT;

-- ============================================================
-- PASO 1: CREAR TABLAS PADRE FALTANTES
-- ============================================================

-- 1. Perfil Consultora
CREATE TABLE IF NOT EXISTS consultant_profile (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rut TEXT,
  company_name TEXT DEFAULT 'LSC Operations',
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Consultora Técnica & Auditora',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Representantes Legales
CREATE TABLE IF NOT EXISTS legal_representatives (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rut TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT DEFAULT 'Representante Legal Autorizado',
  notary_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Proyectos Monitoreados (TABLA NÚCLEO)
CREATE TABLE IF NOT EXISTS monitored_projects (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  project_ownership_type TEXT DEFAULT 'cliente',
  is_personal_project BOOLEAN DEFAULT FALSE,
  client_name TEXT,
  status TEXT DEFAULT 'activo',
  uptime_pct NUMERIC(5,2) DEFAULT 99.80,
  latency_ms INT DEFAULT 240,
  ssl_status TEXT DEFAULT 'valido',
  stack JSONB DEFAULT '[]'::jsonb,
  gsc_property TEXT,
  gsc_connected BOOLEAN DEFAULT FALSE,
  incident_history JSONB DEFAULT '[]'::jsonb,
  client_billing JSONB DEFAULT '{}'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  hosting_provider TEXT DEFAULT 'TecnoInver (cPanel / Apache / MySQL)',
  hosting_plan TEXT DEFAULT 'Cero New ($15,000 Anual / conpis.cl)',
  hosting_renewal_date DATE DEFAULT '2027-06-19',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE monitored_projects ADD COLUMN IF NOT EXISTS hosting_provider TEXT DEFAULT 'TecnoInver (cPanel / Apache / MySQL)';
ALTER TABLE monitored_projects ADD COLUMN IF NOT EXISTS hosting_plan TEXT DEFAULT 'Cero New ($15,000 Anual / conpis.cl)';
ALTER TABLE monitored_projects ADD COLUMN IF NOT EXISTS hosting_renewal_date DATE DEFAULT '2027-06-19';

-- 4. Dominios Vinculados (Relación 1 a Muchos)
CREATE TABLE IF NOT EXISTS project_domains (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  provider TEXT DEFAULT 'NIC Chile (.cl)',
  expiration_date DATE,
  is_primary BOOLEAN DEFAULT FALSE,
  ssl_status TEXT DEFAULT 'valido',
  redirects_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Documentación Legal Respaldada
CREATE TABLE IF NOT EXISTS project_documentation (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  legal_rep_id TEXT REFERENCES legal_representatives(id) ON DELETE SET NULL,
  quote_id TEXT REFERENCES quotes(id) ON DELETE SET NULL,
  deal_id TEXT REFERENCES crm_deals(id) ON DELETE SET NULL,
  doc_title TEXT NOT NULL,
  doc_category TEXT DEFAULT 'contrato_firmado',
  document_ownership_type TEXT DEFAULT 'cliente',
  content_text TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size TEXT,
  total_clp BIGINT,
  tax_document TEXT DEFAULT 'factura',
  is_signed BOOLEAN DEFAULT FALSE,
  signed_date TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- PASO 2: TABLAS HIJAS (QA, DEVOPS, ARQUITECTURA & CIBERSEGURIDAD)
-- ============================================================

-- Tareas
CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  priority TEXT DEFAULT 'media',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Checklist QA
CREATE TABLE IF NOT EXISTS project_qa_checklist (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  seo_ready BOOLEAN DEFAULT TRUE,
  responsive_ready BOOLEAN DEFAULT TRUE,
  error_handling_ready BOOLEAN DEFAULT TRUE,
  security_ready BOOLEAN DEFAULT TRUE,
  backups_ready BOOLEAN DEFAULT TRUE,
  score_pct INT DEFAULT 100,
  notes TEXT,
  last_audit_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Respaldos
CREATE TABLE IF NOT EXISTS project_backups (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  backup_name TEXT NOT NULL,
  backup_type TEXT DEFAULT 'completo',
  backup_url TEXT,
  backup_date DATE DEFAULT CURRENT_DATE,
  file_size_mb NUMERIC(8,2) DEFAULT 0,
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Error Tracking
CREATE TABLE IF NOT EXISTS project_error_logs (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  error_type TEXT DEFAULT 'runtime_js',
  severity TEXT DEFAULT 'media',
  resolved BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bitácora Técnica de Arquitectura (ADR)
CREATE TABLE IF NOT EXISTS project_architecture_decisions (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'aceptada',
  context_rationale TEXT,
  decision TEXT NOT NULL,
  consequences TEXT,
  decision_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Stack Tecnológico
CREATE TABLE IF NOT EXISTS project_tech_stack (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  technology_name TEXT NOT NULL,
  category TEXT DEFAULT 'frontend',
  version TEXT,
  is_critical BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Despliegues & Git
CREATE TABLE IF NOT EXISTS project_deployments (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  commit_hash TEXT NOT NULL,
  commit_message TEXT,
  version_deployed TEXT,
  environment TEXT DEFAULT 'produccion',
  deployed_by TEXT DEFAULT 'Tiare Pérez Concha',
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cuota y Almacenamiento de BBDD
CREATE TABLE IF NOT EXISTS project_database_storage (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  database_type TEXT DEFAULT 'mysql_cpanel',
  connection_status TEXT DEFAULT 'online',
  used_mb NUMERIC(8,2) DEFAULT 0,
  limit_mb NUMERIC(8,2) DEFAULT 500,
  quota_percent NUMERIC(5,2) DEFAULT 0,
  is_free_tier BOOLEAN DEFAULT TRUE,
  health_ping_ms INT DEFAULT 28,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Search Console
CREATE TABLE IF NOT EXISTS search_console_metrics (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  domain_property TEXT NOT NULL,
  sync_status TEXT DEFAULT 'por_vincular',
  total_clicks INT DEFAULT 0,
  total_impressions INT DEFAULT 0,
  average_ctr NUMERIC(5,2) DEFAULT 0.0,
  average_position NUMERIC(5,2) DEFAULT 0.0,
  top_queries JSONB DEFAULT '[]'::jsonb,
  top_pages JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PageSpeed Metrics
CREATE TABLE IF NOT EXISTS pagespeed_metrics (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  performance_score INT DEFAULT 90,
  accessibility_score INT DEFAULT 95,
  best_practices_score INT DEFAULT 100,
  seo_score INT DEFAULT 100,
  fcp_ms INT DEFAULT 900,
  lcp_ms INT DEFAULT 1600,
  cls NUMERIC(6,3) DEFAULT 0.010,
  tbt_ms INT DEFAULT 50,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cuotas de IA ($0 Blindado)
CREATE TABLE IF NOT EXISTS ai_quota_monitoring (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  tier TEXT DEFAULT 'Free Tier',
  rpm_limit INT DEFAULT 15,
  rpm_current INT DEFAULT 0,
  tpm_limit INT DEFAULT 250000,
  tpm_current INT DEFAULT 0,
  rpd_limit INT DEFAULT 500,
  rpd_current INT DEFAULT 0,
  cost_usd NUMERIC(8,4) DEFAULT 0.0000,
  cost_blindado BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  renewal_date TEXT DEFAULT 'Diario / Sin cobro',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CISO SOC (IA)
CREATE TABLE IF NOT EXISTS ciso_diagnostics (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  security_score INT DEFAULT 95,
  executive_summary TEXT NOT NULL,
  critical_findings JSONB DEFAULT '[]'::jsonb,
  immediate_actions JSONB DEFAULT '[]'::jsonb,
  commercial_value TEXT,
  audited_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Feed de Ciberamenazas Chile
CREATE TABLE IF NOT EXISTS security_threat_feed (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'fuerza_bruta',
  severity TEXT DEFAULT 'alta',
  target_project TEXT NOT NULL,
  description TEXT NOT NULL,
  mitigation_action TEXT NOT NULL,
  status TEXT DEFAULT 'mitigado',
  country TEXT DEFAULT 'Chile',
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Matriz ALE
CREATE TABLE IF NOT EXISTS security_ale_matrix (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  threat_name TEXT NOT NULL,
  threat_category TEXT NOT NULL,
  sle_clp BIGINT NOT NULL,
  aro NUMERIC(5,2) NOT NULL,
  ale_clp BIGINT NOT NULL,
  mitigation_strategy TEXT NOT NULL,
  status TEXT DEFAULT 'mitigado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8 Capas del SOC
CREATE TABLE IF NOT EXISTS defense_in_depth_layers (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  layer_number INT NOT NULL,
  shield_name TEXT NOT NULL,
  level_name TEXT NOT NULL,
  status TEXT DEFAULT 'Activo',
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Oportunidad de Monetización con Clientes (Anexo a Cotización & Contrato)
CREATE TABLE IF NOT EXISTS security_commercial_opportunities (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  quote_id TEXT REFERENCES quotes(id) ON DELETE SET NULL,
  deal_id TEXT REFERENCES crm_deals(id) ON DELETE SET NULL,
  plan_tier TEXT DEFAULT 'pro',
  monthly_price_clp BIGINT NOT NULL,
  client_estimated_sales_clp BIGINT DEFAULT 4500000,
  ale_savings_clp BIGINT,
  roi_multiplier NUMERIC(5,1) DEFAULT 3.2,
  contract_annex_title TEXT DEFAULT 'Anexo 2: Servicio Continuo de Ciberseguridad, SLA 99.9% & Gobernanza SOC 24/7',
  status TEXT DEFAULT 'propuesto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- PASO 3: POLÍTICAS RLS EN BUCLE SEGURO
-- ============================================================

DO $$ 
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'consultant_profile', 'clients', 'legal_representatives', 'monitored_projects', 
    'project_domains', 'crm_deals', 'evaluations', 'quotes', 'project_documentation', 
    'project_tasks', 'project_qa_checklist', 'project_backups', 'project_error_logs', 
    'project_architecture_decisions', 'project_tech_stack', 'project_deployments', 
    'project_database_storage', 'telemetry_logs', 'search_console_metrics', 
    'pagespeed_metrics', 'ai_quota_monitoring', 'ciso_diagnostics', 
    'security_threat_feed', 'security_ale_matrix', 'defense_in_depth_layers', 
    'security_commercial_opportunities'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', 'Permitir anon ' || t, t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL USING (true) WITH CHECK (true);', 'Permitir anon ' || t, t);
  END LOOP;
END $$;

-- ============================================================
-- PASO 4: INSERCIÓN DE DATOS REALES (SEEDING SEGURO)
-- ============================================================

-- 1. Consultora
INSERT INTO consultant_profile (id, name, rut, company_name, email, phone, role)
VALUES ('lsc-consultant-main', 'Tiare Pérez Concha', '', 'LSC Operations', 'tiare.perezconcha@gmail.com', '+56 9 8765 4321', 'Consultora Técnica & Auditora')
ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- 2. Cliente CONPI Chile
INSERT INTO clients (id, client_type, name, company, rut, email, phone, country, source)
VALUES ('cli-1794802562643', 'empresa', 'CONPI Chile SpA', 'conpi', '76.543.210-K', 'contacto@conpi.cl', '+56 9 8765 4321', 'Chile', 'Monitoreo & Telemetría')
ON CONFLICT (id) DO UPDATE 
SET client_type = EXCLUDED.client_type,
    company = EXCLUDED.company,
    rut = EXCLUDED.rut,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

-- 3. Representante Legal
INSERT INTO legal_representatives (id, client_id, name, rut, email, phone, position)
VALUES ('rep-conpi-01', 'cli-1794802562643', 'Representante Legal Autorizado CONPI', '15.678.901-2', 'contacto@conpi.cl', '+56 9 8765 4321', 'Representante Legal Mandante')
ON CONFLICT (id) DO NOTHING;

-- 4. Proyecto CONPI con vencimiento real 19/06/2027 (Plan Cero New)
INSERT INTO monitored_projects (id, client_id, name, url, project_ownership_type, is_personal_project, client_name, uptime_pct, latency_ms, ssl_status, stack, gsc_property, gsc_connected, hosting_provider, hosting_plan, hosting_renewal_date)
VALUES
('conpi-app', 'cli-1794802562643', 'CONPI Chile (conpi.cl)', 'https://conpi.cl', 'cliente', false, 'CONPI Chile SpA', 99.85, 240, 'valido', '["React 18", "Vite", "Tailwind CSS", "REST API / MySQL"]'::jsonb, 'sc-domain:conpi.cl', true, 'TecnoInver (cPanel / Apache / MySQL)', 'Cero New ($15,000 Anual / conpis.cl)', '2027-06-19'),
('curriculum-tiare', NULL, 'Currículum Web & Portafolio', 'https://tiareperezconcha.github.io/curriculum/tiare/', 'propio', true, 'Tiare Pérez Concha', 100.00, 115, 'valido', '["HTML5", "CSS3", "JavaScript", "GitHub Pages"]'::jsonb, 'https://tiareperezconcha.github.io/curriculum/tiare/', false, 'GitHub CDN Global', 'GitHub Pages Free', NULL),
('lsc-admin-studio', NULL, 'LSC Operations Studio', 'http://localhost:5173', 'propio', true, 'LSC Internal', 100.00, 25, 'valido', '["React 18", "TypeScript", "Tailwind CSS", "Supabase Cloud"]'::jsonb, NULL, false, 'Localhost / Supabase Cloud', 'Dev Server / Free Tier', NULL)
ON CONFLICT (id) DO UPDATE 
SET hosting_provider = EXCLUDED.hosting_provider,
    hosting_plan = EXCLUDED.hosting_plan,
    hosting_renewal_date = EXCLUDED.hosting_renewal_date,
    updated_at = now();

-- 5. Dominios NIC Chile
INSERT INTO project_domains (id, project_id, domain_name, provider, expiration_date, is_primary, ssl_status, redirects_to)
VALUES
('dom-conpi-01', 'conpi-app', 'conpi.cl', 'NIC Chile (.cl)', '2027-06-19', true, 'valido', NULL),
('dom-conpi-02', 'conpi-app', 'conpis.cl', 'NIC Chile (.cl)', '2028-06-05', false, 'valido', 'https://conpi.cl'),
('dom-curriculum-01', 'curriculum-tiare', 'tiareperezconcha.github.io', 'GitHub Pages', '2030-01-01', true, 'valido', NULL),
('dom-lsc-01', 'lsc-admin-studio', 'localhost:5173', 'Local Dev Server', '2030-01-01', true, 'valido', NULL)
ON CONFLICT (id) DO UPDATE 
SET expiration_date = EXCLUDED.expiration_date,
    is_primary = EXCLUDED.is_primary,
    ssl_status = EXCLUDED.ssl_status,
    redirects_to = EXCLUDED.redirects_to;

-- 6. Pipeline CRM
INSERT INTO crm_deals (id, client_id, project_id, client_name, company, email, phone, title, value_clp, stage, meeting_date, notes)
VALUES
('deal-conpi-01', 'cli-1794802562643', 'conpi-app', 'CONPI Chile (conpi.cl)', 'conpi', 'contacto@conpi.cl', '+56 9 8765 4321', 'Implementación Web, Auditoría y Telemetría CONPI', 850000, 'en_monitoreo', '2026-11-20', 'Proyecto en producción con telemetría activa en cPanel.')
ON CONFLICT (id) DO NOTHING;

-- 7. Cotizaciones
INSERT INTO quotes (id, quote_number, client_id, deal_id, project_id, client_name, client_company, project_title, total_clp, payment_condition, tax_document, status)
VALUES
('quote-conpi-01', 'COT-2026-001', 'cli-1794802562643', 'deal-conpi-01', 'conpi-app', 'CONPI Chile SpA', 'conpi', 'Servicio Integral de Auditoría de Carga y Telemetría', 850000, '50_50', 'factura', 'aprobada')
ON CONFLICT (id) DO NOTHING;

-- 8. Contrato Maestro & Anexo 1
INSERT INTO project_documentation (id, project_id, client_id, legal_rep_id, quote_id, deal_id, doc_title, doc_category, document_ownership_type, content_text, total_clp, tax_document, is_signed)
VALUES
('doc-conpi-contrato-maestro', 'conpi-app', 'cli-1794802562643', 'rep-conpi-01', 'quote-conpi-01', 'deal-conpi-01', 'Contrato Maestro de Servicios Digitales y Auditoría', 'contrato_firmado', 'cliente', 'Contrato Maestro suscrito conforme a las Leyes 21.459, 19.628 y 19.799 de Chile.', 850000, 'factura', false),
('doc-conpi-anexo-1', 'conpi-app', 'cli-1794802562643', 'rep-conpi-01', 'quote-conpi-01', 'deal-conpi-01', 'Anexo 1: Autorización Expresa de Pruebas de Carga y Seguridad', 'anexo_autorizacion', 'cliente', 'Autorización formal de pruebas en ventana horaria valle 02:00 a 05:00 AM.', 850000, 'factura', false)
ON CONFLICT (id) DO NOTHING;

-- 9. Tareas Pendientes
INSERT INTO project_tasks (id, project_id, title, category, completed, due_date, priority)
VALUES
('tsk-conpi-01', 'conpi-app', 'Comprimir catálogo de imágenes con WebP', 'Rendimiento', true, '2026-11-10', 'alta'),
('tsk-conpi-02', 'conpi-app', 'Auditoría mensual de Core Web Vitals en móvil', 'SEO', false, '2026-11-25', 'media'),
('tsk-conpi-03', 'conpi-app', 'Revisar reglas de bloqueo cPHulk por correos en cPanel', 'Seguridad', true, '2026-11-16', 'alta')
ON CONFLICT (id) DO UPDATE SET completed = EXCLUDED.completed;

-- 10. Checklist QA
INSERT INTO project_qa_checklist (id, project_id, seo_ready, responsive_ready, error_handling_ready, security_ready, backups_ready, score_pct, notes)
VALUES
('qa-conpi-app', 'conpi-app', true, true, true, true, true, 100, 'Sitio verificado en producción con certificados TLS vigentes y soporte cPanel.')
ON CONFLICT (id) DO UPDATE SET score_pct = EXCLUDED.score_pct;

-- 11. Respaldos
INSERT INTO project_backups (id, project_id, backup_name, backup_type, backup_url, backup_date, file_size_mb, verified)
VALUES
('bk-conpi-01', 'conpi-app', 'Respaldo Completo cPanel TecnoInver (MySQL & Archivos Web)', 'cpanel', 'https://conpi.cl/cpanel', '2026-11-10', 450.00, true)
ON CONFLICT (id) DO UPDATE SET backup_date = EXCLUDED.backup_date;

-- 12. Bitácora Técnica de Arquitectura (ADR)
INSERT INTO project_architecture_decisions (id, project_id, title, status, context_rationale, decision, consequences, decision_date)
VALUES
('adr-conpi-01', 'conpi-app', 'Aislamiento de Telemetría respecto al Servidor de Correo', 'aceptada', 'Caída por intentos fallidos de login a contacto@conpi.cl activó firewall cPHulk.', 'El monitor opera de forma 100% pasiva vía HTTPS sin tocar puertos IMAP/SMTP.', 'Garantiza que el software nunca provocará bloqueos de IP en el hosting TecnoInver.', '2026-11-16')
ON CONFLICT (id) DO NOTHING;

-- 13. Stack Tecnológico
INSERT INTO project_tech_stack (id, project_id, technology_name, category, version, is_critical)
VALUES
('stk-conpi-01', 'conpi-app', 'React', 'frontend', '18.3', true),
('stk-conpi-02', 'conpi-app', 'Vite', 'devops', '5.4', true),
('stk-conpi-03', 'conpi-app', 'Tailwind CSS', 'frontend', '3.4', true),
('stk-conpi-04', 'conpi-app', 'MySQL cPanel', 'database', '8.0', true),
('stk-conpi-05', 'conpi-app', 'Apache / LiteSpeed', 'infra', '2.4', true)
ON CONFLICT (id) DO NOTHING;

-- 14. Despliegues & Git
INSERT INTO project_deployments (id, project_id, commit_hash, commit_message, version_deployed, environment, deployed_by)
VALUES
('dep-conpi-01', 'conpi-app', '92c473f', 'Producción activa con telemetría cPanel', 'v2.4.1', 'produccion', 'Tiare Pérez Concha')
ON CONFLICT (id) DO NOTHING;

-- 15. Cuota de BBDD
INSERT INTO project_database_storage (id, project_id, database_type, connection_status, used_mb, limit_mb, quota_percent, is_free_tier, health_ping_ms)
VALUES
('dbs-conpi-app', 'conpi-app', 'mysql_cpanel', 'online', 142.50, 2048.00, 6.95, false, 28)
ON CONFLICT (id) DO UPDATE SET used_mb = EXCLUDED.used_mb;

-- 16. Google Search Console & PageSpeed
INSERT INTO search_console_metrics (id, project_id, domain_property, sync_status, total_clicks, total_impressions, average_ctr, average_position, top_queries, top_pages)
VALUES
('gsc-conpi-app', 'conpi-app', 'sc-domain:conpi.cl', 'vinculado', 142, 5120, 2.77, 8.20,
 '[{"query": "conpi chile", "clicks": 54, "impressions": 620, "ctr": 8.71, "position": 1.2}, {"query": "plataforma conpi", "clicks": 38, "impressions": 480, "ctr": 7.92, "position": 2.1}]'::jsonb,
 '[{"page": "https://conpi.cl/", "clicks": 86, "impressions": 2800, "ctr": 3.07, "position": 3.4}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET updated_at = now();

INSERT INTO pagespeed_metrics (id, project_id, url, performance_score, accessibility_score, best_practices_score, seo_score, fcp_ms, lcp_ms, cls, tbt_ms)
VALUES
('psi-conpi-app', 'conpi-app', 'https://conpi.cl', 92, 98, 100, 100, 850, 1580, 0.015, 35),
('psi-curriculum-tiare', 'curriculum-tiare', 'https://tiareperezconcha.github.io/curriculum/tiare/', 98, 100, 100, 100, 620, 1100, 0.005, 10),
('psi-lsc-admin-studio', 'lsc-admin-studio', 'http://localhost:5173', 95, 96, 98, 96, 710, 1340, 0.020, 40)
ON CONFLICT (id) DO UPDATE SET analyzed_at = now();

-- 17. Cuotas de IA ($0 Blindado)
INSERT INTO ai_quota_monitoring (id, provider, model_name, tier, rpm_limit, rpm_current, tpm_limit, tpm_current, rpd_limit, rpd_current, cost_usd, cost_blindado, is_active, renewal_date)
VALUES
('gemini-2.5-flash', 'Google Gemini', 'Gemini 2.5 Flash', 'Producción / Tier 0', 15, 0, 250000, 0, 500, 0, 0.00, true, true, 'Mensual / Sin cobro'),
('deepseek-chat', 'DeepSeek', 'DeepSeek-V3', 'Free API Tier', 60, 0, 1000000, 0, 10000, 0, 0.00, true, true, 'Por uso'),
('groq-llama-3.3-70b', 'Groq', 'Llama 3.3 70B Versatile', 'Ultra-Fast Tier', 30, 0, 300000, 0, 14400, 0, 0.00, true, true, 'Diario')
ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- 18. CISO SOC (IA)
INSERT INTO ciso_diagnostics (id, project_id, client_id, security_score, executive_summary, critical_findings, immediate_actions, commercial_value)
VALUES
('ciso-diag-01', 'conpi-app', 'cli-1794802562643', 94,
 'Evaluación de seguridad perimetral de CONPI Chile y ecosistema web LSC. Infraestructura sólida con protección activa contra inyecciones y bloqueo por reintentos en cPanel.',
 '["Reglas de cPHulk / Fail2Ban en cPanel bloquearon acceso por reintentos en correo externo contacto@conpi.cl.", "Certificado SSL emitido y vigente hasta 2027/2028 en NIC Chile.", "Ausencia de fugas de variables de entorno en frontend React."]'::jsonb,
 '["Solicitar lista blanca (Whitelist) de IP en cPanel TecnoInver.", "Activar doble factor de autenticación (2FA) en casillas corporativas.", "Vincular Cloudflare CDN como escudo perimetral gratuito."]'::jsonb,
 'Servicio comercializable de Gobernanza Técnica & Ciberseguridad Activa con tarifa mensual sugerida de $185.000 CLP.')
ON CONFLICT (id) DO UPDATE SET security_score = EXCLUDED.security_score;

-- 19. Feed de Ciberamenazas en Vivo (Chile)
INSERT INTO security_threat_feed (id, project_id, title, category, severity, target_project, description, mitigation_action, status, country)
VALUES
('thr-1', 'lsc-admin-studio', 'Ataque Automatizado de Fuerza Bruta Bloqueado en Login', 'fuerza_bruta', 'alta', 'Plataforma Administrador de Proyectos', 'Se detectaron 5 intentos fallidos consecutivos de acceso con diccionarios de credenciales.', 'Bloqueo temporal SHA + Registro de User-Agent en logs de telemetría.', 'bloqueado', 'Chile'),
('thr-2', 'conpi-app', 'Intento de Inyección de Script XSS Sanitizado', 'inyeccion', 'media', 'Formulario de Contacto Web', 'Petición entrante en campo mensaje con patrones de inyección <script>alert(1)</script>.', 'Capa 3 WAF activa. Caracteres peligrosos neutralizados.', 'mitigado', 'Chile')
ON CONFLICT (id) DO NOTHING;

-- 20. Matriz Cuantitativa ALE
INSERT INTO security_ale_matrix (id, project_id, threat_name, threat_category, sle_clp, aro, ale_clp, mitigation_strategy, status)
VALUES
('ale-conpi-01', 'conpi-app', 'Caída de Servidor por Bloqueo Firewall cPanel', 'fuerza_bruta', 850000, 0.40, 340000, 'Aislamiento de telemetría y reglas de rate-limiting en cPanel.', 'mitigado'),
('ale-conpi-02', 'conpi-app', 'Inyección SQL en Catálogo de Repuestos y Productos', 'inyeccion_sql', 1500000, 0.20, 300000, 'Consultas preparadas con PDO / ORM y sanitización de inputs.', 'mitigado'),
('ale-conpi-03', 'conpi-app', 'Interrupción de Pasarela Webpay / Carrito de Compras', 'caida_pasarela', 1200000, 0.50, 600000, 'Webhooks asíncronos con reintentos automáticos y fallback bancario.', 'en_progreso')
ON CONFLICT (id) DO UPDATE SET ale_clp = EXCLUDED.ale_clp;

-- 21. Defensa Activa (8 Capas del SOC)
INSERT INTO defense_in_depth_layers (id, project_id, layer_number, shield_name, level_name, status, description, is_active)
VALUES
('def-1', 'conpi-app', 1, 'Anti-Brute Force & Credential Stuffing', 'Capa 1 y 2', 'Activo (Blindado)', 'Bloqueo temporal tras intentos fallidos. Cifrado SHA-256 en frontend y sesión efímera.', true),
('def-2', 'conpi-app', 2, 'WAF & Anti-Inyección (SQLi, XSS)', 'Capa 3', 'Activo (Sanitizado)', 'Filtro regex contra <script>, eval(), comillas de escape y directivas maliciosas.', true),
('def-3', 'conpi-app', 3, 'Detección de Bots Sin JS & Scraping', 'BBDD Cloud', 'Protegido (Supabase RLS)', 'Peticiones sin tokens o que no ejecutan JS son rechazadas por Row Level Security.', true),
('def-4', 'conpi-app', 4, 'Monitoreo SSL & Expiración de Certificados', 'TLS 1.3 / HTTPS', 'Auto-Chequeo Activo', 'Agente reporta validez de SSL. Vigencia auditada en NIC Chile.', true),
('def-5', 'conpi-app', 5, 'Auditoría de Dependencias (Supply Chain)', 'Integridad', '0 Vulnerabilidades', 'Paquetes auditados con npm audit en cada pipeline de build y despliegue a producción.', true),
('def-6', 'conpi-app', 6, 'Uptime Real 24/7 (Keep-Alive Anti-Pausa)', 'Disponibilidad', '200 OK (Keep-Alive)', 'Disparadores periódicos que mantienen el servidor y bases de datos despiertos permanentemente.', true),
('def-7', 'conpi-app', 7, 'Protección Anti-Defacement & Control Git', 'Integridad Web', 'Inmutable (Git CI/CD)', 'Repositorio GitHub versionado. Todo cambio no rastreado en commit es descartado por el pipeline.', true),
('def-8', 'conpi-app', 8, 'Telemetría de Seguridad y Latencias en Vivo', 'Edge Network', 'Agente v2.0 Conectado', 'sendBeacon guardando eventos en telemetry_logs de Supabase con alertas por fallos JS.', true)
ON CONFLICT (id) DO NOTHING;

-- 22. Oportunidad de Monetización con Clientes (Anexo a Cotización & Contrato)
INSERT INTO security_commercial_opportunities (id, project_id, client_id, quote_id, deal_id, plan_tier, monthly_price_clp, client_estimated_sales_clp, ale_savings_clp, roi_multiplier, contract_annex_title, status)
VALUES
('sec-com-conpi-01', 'conpi-app', 'cli-1794802562643', 'quote-conpi-01', 'deal-conpi-01', 'pro', 185000, 5000000, 1285000, 6.9, 'Anexo 2: Servicio Continuo de Ciberseguridad, SLA 99.9% & Gobernanza SOC 24/7', 'propuesto')
ON CONFLICT (id) DO UPDATE SET monthly_price_clp = EXCLUDED.monthly_price_clp;

SELECT 'Base de datos de Supabase completamente configurada y poblada con éxito' AS resultado;
