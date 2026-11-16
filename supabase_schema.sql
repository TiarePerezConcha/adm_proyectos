-- ============================================================
-- ESQUEMA SQL MAESTRO Y UNIFICADO PARA SUPABASE CLOUD (LSC OPERATIONS)
-- Plataforma: Administrador de Proyectos & LSC Studio
-- Base de Datos: PostgreSQL (Supabase Cloud)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CONSULTORA / PRESTADORA TÉCNICA
-- ============================================================
CREATE TABLE IF NOT EXISTS consultant_profile (
  id TEXT PRIMARY KEY DEFAULT 'lsc-consultant-main',
  name TEXT NOT NULL DEFAULT 'Tiare Pérez Concha',
  rut TEXT,
  company_name TEXT DEFAULT 'LSC Operations',
  email TEXT DEFAULT 'tiare.perezconcha@gmail.com',
  phone TEXT,
  role TEXT DEFAULT 'Prestadora / Consultora Técnica de Software & Auditora',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 2. CLIENTES (Empresas o Personas Naturales)
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  client_type TEXT DEFAULT 'empresa', -- 'persona_natural' | 'empresa'
  name TEXT NOT NULL,
  company TEXT,
  rut TEXT,
  email TEXT,
  phone TEXT,
  country TEXT DEFAULT 'Chile',
  source TEXT DEFAULT 'Manual / Portal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 3. REPRESENTANTES LEGALES (Para Empresas Mandantes)
-- ============================================================
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

-- ============================================================
-- 4. PROYECTOS REGISTRADOS & MONITOREADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS monitored_projects (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  project_ownership_type TEXT DEFAULT 'cliente', -- 'propio' | 'cliente' | 'solidario'
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
  hosting_provider TEXT DEFAULT 'TecnoInver',
  hosting_plan TEXT DEFAULT 'Hosting Corporativo cPanel',
  hosting_renewal_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 4.1 DOMINIOS VINCULADOS A PROYECTOS (Relación 1 a Muchos)
-- Permite múltiples dominios por proyecto (ej: conpi.cl y conpis.cl)
-- ============================================================
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

-- ============================================================
-- 5. PIPELINE CRM (Deals y Estados de Oportunidad)
-- ============================================================
CREATE TABLE IF NOT EXISTS crm_deals (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  title TEXT NOT NULL,
  value_clp BIGINT DEFAULT 850000,
  stage TEXT DEFAULT 'reunion_agendada', -- 'reunion_agendada' | 'en_evaluacion' | 'propuesta_enviada' | 'en_negociacion' | 'proyecto_aprobado' | 'en_monitoreo'
  meeting_date TEXT,
  meet_link TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 6. EVALUACIONES ESTRATÉGICAS (FODA / PESTEL / Viabilidad)
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  deal_id TEXT REFERENCES crm_deals(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  company TEXT,
  business_model TEXT,
  current_platform TEXT,
  estimated_sales_clp BIGINT,
  viability_decision TEXT,
  viability_rationale TEXT,
  score_level TEXT,
  budget_clp BIGINT,
  nic_cost_clp INT DEFAULT 9990,
  hosting_option TEXT,
  database_option TEXT,
  foda JSONB,
  pestel JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 7. COTIZACIONES EXPRESS & CLÁUSULAS ECONÓMICAS EN CLP
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  quote_number TEXT NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  deal_id TEXT REFERENCES crm_deals(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_company TEXT,
  project_title TEXT NOT NULL,
  subtitle TEXT,
  outcome TEXT,
  services JSONB,
  sprints JSONB,
  total_clp BIGINT NOT NULL,
  payment_condition TEXT DEFAULT '50_50',
  payment_details TEXT,
  tax_document TEXT DEFAULT 'factura', -- 'factura' | 'boleta' | 'exento'
  delivery_time_days INT DEFAULT 14,
  validity_days INT DEFAULT 15,
  status TEXT DEFAULT 'borrador', -- 'borrador' | 'enviada' | 'aprobada' | 'rechazada'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 8. BRANDING PROJECTS & SISTEMAS DE DISEÑO
-- ============================================================
CREATE TABLE IF NOT EXISTS branding_projects (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  tagline TEXT,
  vision TEXT,
  mision TEXT,
  valores JSONB,
  target_market JSONB,
  archetype TEXT,
  positioning_statement TEXT,
  value_proposition TEXT,
  prism JSONB,
  color_tokens JSONB,
  typography JSONB,
  logos JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 9. TELEMETRÍA, HEARTBEAT & UPTIME HISTÓRICO
-- ============================================================
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL,
  event TEXT NOT NULL, -- 'heartbeat' | 'audit' | 'error' | 'incident_note'
  url TEXT,
  load_time_ms INT,
  ssl_valid BOOLEAN DEFAULT TRUE,
  message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS project_uptime_history (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT TRUE,
  response_time_ms INT,
  http_code INT,
  ssl_status TEXT DEFAULT 'valido',
  downtime_cause TEXT
);

-- ============================================================
-- 10. GOOGLE SEARCH CONSOLE (Métricas SEO & Posicionamiento)
-- ============================================================
CREATE TABLE IF NOT EXISTS search_console_metrics (
  id TEXT PRIMARY KEY, -- e.g. 'gsc-conpi-app'
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  domain_property TEXT NOT NULL,
  sync_status TEXT DEFAULT 'vinculado', -- 'vinculado' | 'por_vincular'
  total_clicks INT DEFAULT 0,
  total_impressions INT DEFAULT 0,
  average_ctr NUMERIC(5,2) DEFAULT 0.0,
  average_position NUMERIC(5,2) DEFAULT 0.0,
  top_queries JSONB DEFAULT '[]'::jsonb,
  top_pages JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 11. GOOGLE PAGESPEED & CORE WEB VITALS
-- ============================================================
CREATE TABLE IF NOT EXISTS pagespeed_metrics (
  id TEXT PRIMARY KEY, -- e.g. 'psi-conpi-app'
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  performance_score INT DEFAULT 95,
  accessibility_score INT DEFAULT 98,
  best_practices_score INT DEFAULT 100,
  seo_score INT DEFAULT 100,
  fcp_ms INT DEFAULT 850,
  lcp_ms INT DEFAULT 1600,
  cls NUMERIC(4,3) DEFAULT 0.020,
  tbt_ms INT DEFAULT 40,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 12. MODELOS DE IA, CUOTAS & BLINDAJE COSTO $0
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_quota_monitoring (
  id TEXT PRIMARY KEY, -- e.g. 'gemini-2.5-flash'
  provider TEXT NOT NULL, -- 'Google Gemini' | 'DeepSeek' | 'Groq' | 'Mistral' | 'GitHub'
  model_name TEXT NOT NULL,
  tier TEXT DEFAULT 'Gratuito / Tier 0',
  rpm_limit INT DEFAULT 15,
  rpm_current INT DEFAULT 0,
  tpm_limit INT DEFAULT 250000,
  tpm_current INT DEFAULT 0,
  rpd_limit INT DEFAULT 500,
  rpd_current INT DEFAULT 0,
  cost_usd NUMERIC(6,2) DEFAULT 0.00,
  cost_blindado BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  renewal_date TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 13. GOOGLE CALENDAR (Reuniones & Agendamientos)
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  company TEXT,
  service_interest TEXT,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  meet_url TEXT,
  status TEXT DEFAULT 'confirmada', -- 'confirmada' | 'reprogramada' | 'cancelada'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 14. FAQS & BASE DE CONOCIMIENTO
-- ============================================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 15. DOCUMENTACIÓN LEGAL, ANEXOS Y CONTRATOS RESPALDADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS project_documentation (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  legal_rep_id TEXT REFERENCES legal_representatives(id) ON DELETE SET NULL,
  quote_id TEXT REFERENCES quotes(id) ON DELETE SET NULL,
  deal_id TEXT REFERENCES crm_deals(id) ON DELETE SET NULL,
  doc_title TEXT NOT NULL,
  doc_category TEXT DEFAULT 'contrato_firmado', -- 'contrato_firmado' | 'anexo_autorizacion' | 'cotizacion_pdf' | 'factura' | 'acta_entrega' | 'otro'
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
-- 15.1 PLANIFICACIÓN & TAREAS PENDIENTES
-- ============================================================
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

-- ============================================================
-- 15.2 CHECKLIST QA ("LISTO PARA PRODUCCIÓN")
-- ============================================================
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

-- ============================================================
-- 15.3 COPIAS DE SEGURIDAD & RESPALDOS (Backups)
-- ============================================================
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

-- ============================================================
-- 15.4 LOGS DE ERRORES EN PRODUCCIÓN (Error Tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_error_logs (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  error_type TEXT DEFAULT 'runtime_js',
  severity TEXT DEFAULT 'media',
  resolved BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 15.5 BITÁCORA TÉCNICA & HISTORIAL DE DECISIONES DE ARQUITECTURA (ADR)
-- ============================================================
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

-- ============================================================
-- 15.6 STACK & ARQUITECTURA (Componentes Tecnológicos)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_tech_stack (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  technology_name TEXT NOT NULL,
  category TEXT DEFAULT 'frontend',
  version TEXT,
  is_critical BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 15.7 DESPLIEGUE & CONTROL DE VERSIONES GIT
-- ============================================================
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

-- ============================================================
-- 15.8 TIPO, ESTADO Y CUOTA DE ALMACENAMIENTO DE BASE DE DATOS
-- ============================================================
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

-- ============================================================
-- 15.9 DIAGNÓSTICO TÉCNICO DEL CISO (SOC CON IA)
-- ============================================================
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

-- ============================================================
-- 15.10 CENTRO DE INTELIGENCIA DE AMENAZAS & FEED EN VIVO (Chile)
-- ============================================================
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

-- ============================================================
-- 15.11 MATRIZ CUANTITATIVA ALE (Riesgos Financieros de Ciberseguridad)
-- ============================================================
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

-- ============================================================
-- 15.12 DEFENSA ACTIVA (8 CAPAS DEL SOC)
-- ============================================================
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

-- ============================================================
-- 15.13 OPORTUNIDAD DE MONETIZACIÓN CON CLIENTES (Anexo a Cotización & Contrato)
-- ============================================================
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
-- 16. SEGURIDAD: ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ============================================================
ALTER TABLE consultant_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_uptime_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_console_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagespeed_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quota_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_qa_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_architecture_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tech_stack ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_database_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciso_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_threat_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_ale_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE defense_in_depth_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_commercial_opportunities ENABLE ROW LEVEL SECURITY;

-- Políticas de Acceso para Clave Pública (anon key)
CREATE POLICY "Permitir anon consultant_profile" ON consultant_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon legal_representatives" ON legal_representatives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon monitored_projects" ON monitored_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_domains" ON project_domains FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon crm_deals" ON crm_deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon evaluations" ON evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon quotes" ON quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon branding_projects" ON branding_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon telemetry_logs" ON telemetry_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_uptime_history" ON project_uptime_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon search_console_metrics" ON search_console_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon pagespeed_metrics" ON pagespeed_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon ai_quota_monitoring" ON ai_quota_monitoring FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon calendar_bookings" ON calendar_bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon faqs" ON faqs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_documentation" ON project_documentation FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_tasks" ON project_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_qa_checklist" ON project_qa_checklist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_backups" ON project_backups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_error_logs" ON project_error_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_architecture_decisions" ON project_architecture_decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_tech_stack" ON project_tech_stack FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_deployments" ON project_deployments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_database_storage" ON project_database_storage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon ciso_diagnostics" ON ciso_diagnostics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon security_threat_feed" ON security_threat_feed FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon security_ale_matrix" ON security_ale_matrix FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon defense_in_depth_layers" ON defense_in_depth_layers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon security_commercial_opportunities" ON security_commercial_opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon project_documentation" ON project_documentation FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 17. DATOS BASE (SEEDING): RESPALDO INTEGRAL SIN DEJAR NADA AL AIRE
-- ============================================================

-- 17.1 Perfil de la Consultora
INSERT INTO consultant_profile (id, name, rut, company_name, email, phone, role)
VALUES ('lsc-consultant-main', 'Tiare Pérez Concha', '', 'LSC Operations', 'tiare.perezconcha@gmail.com', '+56 9 8765 4321', 'Prestadora / Consultora Técnica de Software & Auditora')
ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- 17.2 Cliente Registrado
INSERT INTO clients (id, client_type, name, company, rut, email, phone, country, source)
VALUES ('cli-1794802562643', 'empresa', 'CONPI Chile SpA', 'conpi', '76.543.210-K', 'contacto@conpi.cl', '+56 9 8765 4321', 'Chile', 'Monitoreo & Telemetría')
ON CONFLICT (id) DO NOTHING;

-- 17.3 Representante Legal
INSERT INTO legal_representatives (id, client_id, name, rut, email, phone, position)
VALUES ('rep-conpi-01', 'cli-1794802562643', 'Representante Legal Autorizado CONPI', '15.678.901-2', 'contacto@conpi.cl', '+56 9 8765 4321', 'Representante Legal Mandante')
ON CONFLICT (id) DO NOTHING;

-- 17.4 Proyectos Monitoreados
INSERT INTO monitored_projects (id, client_id, name, url, project_ownership_type, is_personal_project, client_name, uptime_pct, latency_ms, ssl_status, stack, gsc_property, gsc_connected, hosting_provider, hosting_plan, hosting_renewal_date)
VALUES
('conpi-app', 'cli-1794802562643', 'CONPI Chile (conpi.cl)', 'https://conpi.cl', 'cliente', false, 'CONPI Chile SpA', 99.85, 240, 'valido', '["React 18", "Vite", "Tailwind CSS", "REST API / MySQL"]'::jsonb, 'sc-domain:conpi.cl', true, 'TecnoInver (cPanel / Apache / MySQL)', 'Hosting Corporativo cPanel', '2025-10-15'),
('curriculum-tiare', NULL, 'Currículum Web & Portafolio', 'https://tiareperezconcha.github.io/curriculum/tiare/', 'propio', true, 'Tiare Pérez Concha', 100.00, 115, 'valido', '["HTML5", "CSS3", "JavaScript", "GitHub Pages"]'::jsonb, 'https://tiareperezconcha.github.io/curriculum/tiare/', false, 'GitHub CDN Global', 'GitHub Pages Free', NULL),
('lsc-admin-studio', NULL, 'LSC Operations Studio', 'http://localhost:5173', 'propio', true, 'LSC Internal', 100.00, 25, 'valido', '["React 18", "TypeScript", "Tailwind CSS", "Supabase Cloud"]'::jsonb, NULL, false, 'Localhost / Supabase Cloud', 'Dev Server / Free Tier', NULL)
ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- 17.4.1 Dominios Vinculados (Relación 1 a N de Dominios por Proyecto)
INSERT INTO project_domains (id, project_id, domain_name, provider, expiration_date, is_primary, ssl_status, redirects_to)
VALUES
('dom-conpi-01', 'conpi-app', 'conpi.cl', 'NIC Chile (.cl)', '2027-06-19', true, 'valido', NULL),
('dom-conpi-02', 'conpi-app', 'conpis.cl', 'NIC Chile (.cl)', '2028-06-05', false, 'valido', 'https://conpi.cl'),
('dom-curriculum-01', 'curriculum-tiare', 'tiareperezconcha.github.io', 'GitHub Pages', '2030-01-01', true, 'valido', NULL),
('dom-lsc-01', 'lsc-admin-studio', 'localhost:5173', 'Local Dev Server', '2030-01-01', true, 'valido', NULL)
ON CONFLICT (id) DO UPDATE SET expiration_date = EXCLUDED.expiration_date;

-- 17.5 Pipeline CRM (Deals y Estados)
INSERT INTO crm_deals (id, client_id, project_id, client_name, company, email, phone, title, value_clp, stage, meeting_date, notes)
VALUES
('deal-conpi-01', 'cli-1794802562643', 'conpi-app', 'CONPI Chile (conpi.cl)', 'conpi', 'contacto@conpi.cl', '+56 9 8765 4321', 'Implementación Web, Auditoría y Telemetría CONPI', 850000, 'en_monitoreo', '2026-11-20', 'Proyecto en producción con telemetría activa en cPanel.'),
('deal-propuesta-02', 'cli-1794802562643', 'conpi-app', 'CONPI Chile (conpi.cl)', 'conpi', 'contacto@conpi.cl', '+56 9 8765 4321', 'Optimización SEO y Blindaje de Rendimiento', 450000, 'propuesta_enviada', '2026-11-22', 'Propuesta de sprint de performance y Core Web Vitals.')
ON CONFLICT (id) DO NOTHING;

-- 17.6 Cotizaciones Express (Conectadas con Cláusula Económica)
INSERT INTO quotes (id, quote_number, client_id, deal_id, project_id, client_name, client_company, project_title, total_clp, payment_condition, tax_document, status)
VALUES
('quote-conpi-01', 'COT-2026-001', 'cli-1794802562643', 'deal-conpi-01', 'conpi-app', 'CONPI Chile SpA', 'conpi', 'Servicio Integral de Auditoría de Carga y Telemetría', 850000, '50_50', 'factura', 'aprobada')
ON CONFLICT (id) DO NOTHING;

-- 17.7 Google Search Console (conpi completo y otros por vincular)
INSERT INTO search_console_metrics (id, project_id, domain_property, sync_status, total_clicks, total_impressions, average_ctr, average_position, top_queries, top_pages)
VALUES
('gsc-conpi-app', 'conpi-app', 'sc-domain:conpi.cl', 'vinculado', 142, 5120, 2.77, 8.20,
 '[{"query": "conpi chile", "clicks": 54, "impressions": 620, "ctr": 8.71, "position": 1.2}, {"query": "plataforma conpi", "clicks": 38, "impressions": 480, "ctr": 7.92, "position": 2.1}, {"query": "portal conpi proyectos", "clicks": 26, "impressions": 890, "ctr": 2.92, "position": 4.5}]'::jsonb,
 '[{"page": "https://conpi.cl/", "clicks": 86, "impressions": 2800, "ctr": 3.07, "position": 3.4}, {"page": "https://conpi.cl/contacto", "clicks": 32, "impressions": 1100, "ctr": 2.91, "position": 6.8}]'::jsonb),
('gsc-curriculum-tiare', 'curriculum-tiare', 'https://tiareperezconcha.github.io/curriculum/tiare/', 'por_vincular', 0, 0, 0.0, 0.0, '[]'::jsonb, '[]'::jsonb),
('gsc-lsc-admin-studio', 'lsc-admin-studio', 'http://localhost:5173', 'por_vincular', 0, 0, 0.0, 0.0, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- 17.8 Google PageSpeed Metrics (Métricas Completas para Todos los Proyectos)
INSERT INTO pagespeed_metrics (id, project_id, url, performance_score, accessibility_score, best_practices_score, seo_score, fcp_ms, lcp_ms, cls, tbt_ms)
VALUES
('psi-conpi-app', 'conpi-app', 'https://conpi.cl', 92, 98, 100, 100, 850, 1580, 0.015, 35),
('psi-curriculum-tiare', 'curriculum-tiare', 'https://tiareperezconcha.github.io/curriculum/tiare/', 98, 100, 100, 100, 620, 1100, 0.005, 10),
('psi-lsc-admin-studio', 'lsc-admin-studio', 'http://localhost:5173', 95, 96, 98, 96, 710, 1340, 0.020, 40)
ON CONFLICT (id) DO UPDATE SET analyzed_at = now();

-- 17.9 Monitor de Cuotas, Tokens y Blindaje de Costo $0
INSERT INTO ai_quota_monitoring (id, provider, model_name, tier, rpm_limit, rpm_current, tpm_limit, tpm_current, rpd_limit, rpd_current, cost_usd, cost_blindado, is_active, renewal_date)
VALUES
('gemini-2.5-flash', 'Google Gemini', 'Gemini 2.5 Flash', 'Producción / Tier 0', 15, 0, 250000, 0, 500, 0, 0.00, true, true, 'Mensual / Sin cobro'),
('deepseek-chat', 'DeepSeek', 'DeepSeek-V3', 'Free API Tier', 60, 0, 1000000, 0, 10000, 0, 0.00, true, true, 'Por uso'),
('groq-llama-3.3-70b', 'Groq', 'Llama 3.3 70B Versatile', 'Ultra-Fast Tier', 30, 0, 300000, 0, 14400, 0, 0.00, true, true, 'Diario'),
('mistral-small', 'Mistral AI', 'Mistral Small 24B', 'Developer Tier', 10, 0, 150000, 0, 1000, 0, 0.00, true, true, 'Mensual'),
('github-models', 'GitHub', 'GitHub Models GPT-4o-mini', 'Marketplace Free', 15, 0, 150000, 0, 150, 0, 0.00, true, true, 'Diario')
ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- 17.10 Google Calendar (Citas Confirmadas)
INSERT INTO calendar_bookings (client_name, client_email, client_phone, company, service_interest, booking_date, booking_time, meet_url, status)
VALUES
('CONPI Chile SpA', 'contacto@conpi.cl', '+56 9 8765 4321', 'conpi', 'Auditoría de Rendimiento & Gobernanza Técnica', '2026-11-20', '10:00', 'https://meet.google.com/conpi-lsc', 'confirmada')
ON CONFLICT DO NOTHING;

-- 17.11 FAQs & Base de Conocimiento
INSERT INTO faqs (question, answer, category, is_published)
VALUES
('¿Cómo se vincula un proyecto con Google Search Console?', 'Ingresa a la sección SEO Ranking (GSC), selecciona el proyecto y verifica la propiedad con DNS o la cuenta de servicio oficial.', 'SEO & GSC', true),
('¿Qué cubre la Ley N° 21.459 en las pruebas de carga?', 'Regula los delitos informáticos en Chile, estipulando que los accesos diagnósticos requieren autorización previa expresa del titular.', 'Legal & Contratos', true),
('¿Cómo funciona el blindaje de costo $0 en las APIs de IA?', 'El sistema prioriza modelos en tiers gratuitos (Gemini 2.5 Flash, Groq, DeepSeek) con límites automáticos para no incurrir en gastos.', 'Inteligencia Artificial', true)
ON CONFLICT DO NOTHING;

-- 17.12 Documentación Legal Respaldada
INSERT INTO project_documentation (id, project_id, client_id, legal_rep_id, quote_id, deal_id, doc_title, doc_category, document_ownership_type, content_text, total_clp, tax_document, is_signed)
VALUES
('doc-conpi-contrato-maestro', 'conpi-app', 'cli-1794802562643', 'rep-conpi-01', 'quote-conpi-01', 'deal-conpi-01', 'Contrato Maestro de Servicios Digitales y Auditoría', 'contrato_firmado', 'cliente', 'Contrato Maestro suscrito conforme a las Leyes 21.459, 19.628 y 19.799 de Chile.', 850000, 'factura', false),
('doc-conpi-anexo-1', 'conpi-app', 'cli-1794802562643', 'rep-conpi-01', 'quote-conpi-01', 'deal-conpi-01', 'Anexo 1: Autorización Expresa de Pruebas de Carga y Seguridad', 'anexo_autorizacion', 'cliente', 'Autorización formal de pruebas en ventana horaria valle 02:00 a 05:00 AM.', 850000, 'factura', false)
ON CONFLICT (id) DO NOTHING;

-- 17.13 Planificación & Tareas
INSERT INTO project_tasks (id, project_id, title, category, completed, due_date, priority)
VALUES
('tsk-conpi-01', 'conpi-app', 'Comprimir catálogo de imágenes con WebP', 'Rendimiento', true, '2026-11-10', 'alta'),
('tsk-conpi-02', 'conpi-app', 'Auditoría mensual de Core Web Vitals en móvil', 'SEO', false, '2026-11-25', 'media'),
('tsk-conpi-03', 'conpi-app', 'Revisar reglas de bloqueo cPHulk por correos en cPanel', 'Seguridad', true, '2026-11-16', 'alta'),
('tsk-adm-01', 'adm-proyectos', 'Sincronizar Service Account con Search Console para otros dominios', 'SEO', false, '2026-11-30', 'media'),
('tsk-adm-02', 'adm-proyectos', 'Verificar cuota de tokens en Gemini Free Tier ($0 Blindado)', 'IA', true, '2026-11-16', 'alta')
ON CONFLICT (id) DO UPDATE SET completed = EXCLUDED.completed;

-- 17.14 Checklist QA
INSERT INTO project_qa_checklist (id, project_id, seo_ready, responsive_ready, error_handling_ready, security_ready, backups_ready, score_pct, notes)
VALUES
('qa-conpi-app', 'conpi-app', true, true, true, true, true, 100, 'Sitio verificado en producción con certificados TLS vigentes y soporte cPanel.'),
('qa-curriculum-tiare', 'curriculum-tiare', true, true, true, true, true, 100, 'Frontend estático GitHub Pages validado en móvil y desktop.'),
('qa-adm-proyectos', 'lsc-admin-studio', true, true, true, true, true, 100, 'Panel de control con RLS activo y Keep-Alive continuo.')
ON CONFLICT (id) DO UPDATE SET score_pct = EXCLUDED.score_pct;

-- 17.15 Copias de Seguridad & Respaldos
INSERT INTO project_backups (id, project_id, backup_name, backup_type, backup_url, backup_date, file_size_mb, verified)
VALUES
('bk-conpi-01', 'conpi-app', 'Respaldo Completo cPanel TecnoInver (MySQL & Archivos Web)', 'cpanel', 'https://conpi.cl/cpanel', '2026-11-10', 450.00, true),
('bk-adm-01', 'lsc-admin-studio', 'Respaldo Automático Supabase Postgres (Tablas y RLS)', 'supabase', 'https://cvfybrtblxzpawnxqsnd.supabase.co', '2026-11-16', 15.20, true),
('bk-adm-02', 'lsc-admin-studio', 'Snapshot de Repositorio GitHub (Rama main)', 'git_snapshot', 'https://github.com/TiarePerezConcha/adm_proyectos', '2026-11-16', 8.50, true)
ON CONFLICT (id) DO UPDATE SET backup_date = EXCLUDED.backup_date;

-- 17.16 Bitácora Técnica de Arquitectura (ADR)
INSERT INTO project_architecture_decisions (id, project_id, title, status, context_rationale, decision, consequences, decision_date)
VALUES
('adr-conpi-01', 'conpi-app', 'Aislamiento de Telemetría respecto al Servidor de Correo', 'aceptada', 'Caída por intentos fallidos de login a contacto@conpi.cl activó firewall cPHulk.', 'El monitor opera de forma 100% pasiva vía HTTPS sin tocar puertos IMAP/SMTP.', 'Garantiza que el software nunca provocará bloqueos de IP en el hosting TecnoInver.', '2026-11-16'),
('adr-adm-01', 'lsc-admin-studio', 'Persistencia Híbrida Supabase Cloud + LocalStorage Fallback', 'aceptada', 'Se requiere tolerancia a fallos offline y sincronización instantánea en la nube.', 'Lectura prioritaria de Supabase con respaldo local automático en el navegador.', '0 pérdida de datos si la conexión sufre microcortes.', '2026-11-15')
ON CONFLICT (id) DO NOTHING;

-- 17.17 Stack & Componentes de Arquitectura
INSERT INTO project_tech_stack (id, project_id, technology_name, category, version, is_critical)
VALUES
('stk-conpi-01', 'conpi-app', 'React', 'frontend', '18.3', true),
('stk-conpi-02', 'conpi-app', 'Vite', 'devops', '5.4', true),
('stk-conpi-03', 'conpi-app', 'Tailwind CSS', 'frontend', '3.4', true),
('stk-conpi-04', 'conpi-app', 'MySQL cPanel', 'database', '8.0', true),
('stk-conpi-05', 'conpi-app', 'Apache / LiteSpeed', 'infra', '2.4', true)
ON CONFLICT (id) DO NOTHING;

-- 17.18 Despliegues & Git
INSERT INTO project_deployments (id, project_id, commit_hash, commit_message, version_deployed, environment, deployed_by)
VALUES
('dep-conpi-01', 'conpi-app', '92c473f', 'Producción activa con telemetría cPanel', 'v2.4.1', 'produccion', 'Tiare Pérez Concha'),
('dep-adm-01', 'lsc-admin-studio', '38ab8d0', 'Multi-dominio conpi.cl/conpis.cl y sync Supabase', 'v1.2.0', 'produccion', 'Tiare Pérez Concha')
ON CONFLICT (id) DO NOTHING;

-- 17.19 Cuota de BBDD & Almacenamiento
INSERT INTO project_database_storage (id, project_id, database_type, connection_status, used_mb, limit_mb, quota_percent, is_free_tier, health_ping_ms)
VALUES
('dbs-conpi-app', 'conpi-app', 'mysql_cpanel', 'online', 142.50, 2048.00, 6.95, false, 28),
('dbs-adm-proyectos', 'lsc-admin-studio', 'supabase_postgres', 'online', 0.15, 500.00, 0.03, true, 38),
('dbs-curriculum-tiare', 'curriculum-tiare', 'static_none', 'online', 0.00, 0.00, 0.00, true, 0)
ON CONFLICT (id) DO UPDATE SET used_mb = EXCLUDED.used_mb, health_ping_ms = EXCLUDED.health_ping_ms;

-- 17.20 Diagnóstico Técnico del CISO (SOC con IA)
INSERT INTO ciso_diagnostics (id, project_id, client_id, security_score, executive_summary, critical_findings, immediate_actions, commercial_value)
VALUES
('ciso-diag-01', 'conpi-app', 'cli-1794802562643', 94,
 'Evaluación de seguridad perimetral de CONPI Chile y ecosistema web LSC. Infraestructura sólida con protección activa contra inyecciones y bloqueo por reintentos en cPanel.',
 '["Reglas de cPHulk / Fail2Ban en cPanel bloquearon acceso por reintentos en correo externo contacto@conpi.cl.", "Certificado SSL emitido y vigente hasta 2027/2028 en NIC Chile.", "Ausencia de fugas de variables de entorno en frontend React."]'::jsonb,
 '["Solicitar lista blanca (Whitelist) de IP en cPanel TecnoInver.", "Activar doble factor de autenticación (2FA) en casillas corporativas.", "Vincular Cloudflare CDN como escudo perimetral gratuito."]'::jsonb,
 'Servicio comercializable de Gobernanza Técnica & Ciberseguridad Activa con tarifa mensual sugerida de $185.000 CLP.')
ON CONFLICT (id) DO UPDATE SET security_score = EXCLUDED.security_score;

-- 17.21 Feed de Ciberamenazas en Vivo (Chile)
INSERT INTO security_threat_feed (id, project_id, title, category, severity, target_project, description, mitigation_action, status, country)
VALUES
('thr-1', 'lsc-admin-studio', 'Ataque Automatizado de Fuerza Bruta Bloqueado en Login', 'fuerza_bruta', 'alta', 'Plataforma Administrador de Proyectos', 'Se detectaron 5 intentos fallidos consecutivos de acceso con diccionarios de credenciales.', 'Bloqueo temporal SHA + Registro de User-Agent en logs de telemetría.', 'bloqueado', 'Chile'),
('thr-2', 'conpi-app', 'Intento de Inyección de Script XSS Sanitizado', 'inyeccion', 'media', 'Formulario de Contacto Web', 'Petición entrante en campo mensaje con patrones de inyección <script>alert(1)</script>.', 'Capa 3 WAF activa. Caracteres peligrosos neutralizados.', 'mitigado', 'Chile'),
('thr-3', 'conpi-app', 'Alerta Global: Campaña de Phishing activa en Pasarelas de Pago en Chile', 'phishing', 'alta', 'CONPI & Tiendas E-commerce', 'Campañas de suplantación de identidad apuntando a credenciales de Webpay Plus y Mercado Pago.', 'Verificar certificados SSL vigentes, cabecera HSTS activa y 2FA obligatorio.', 'vigilando', 'Chile'),
('thr-4', 'lsc-admin-studio', 'Chequeo de Integridad de Dependencias (Supply Chain)', 'vulnerabilidad', 'informativa', 'Ecosistema de Repositorios GitHub', 'Escaneo de dependencias mediante npm audit y Dependabot en GitHub Actions. 0 vulnerabilidades.', 'Pipeline de compilación continua con auditoría automatizada.', 'mitigado', 'Chile')
ON CONFLICT (id) DO NOTHING;

-- 17.22 Matriz Cuantitativa ALE (Riesgos Financieros de Seguridad)
INSERT INTO security_ale_matrix (id, project_id, threat_name, threat_category, sle_clp, aro, ale_clp, mitigation_strategy, status)
VALUES
('ale-conpi-01', 'conpi-app', 'Caída de Servidor por Ataque de Fuerza Bruta / Bloqueo cPanel', 'fuerza_bruta', 850000, 0.40, 340000, 'Aislamiento de telemetría y reglas de rate-limiting en cPanel.', 'mitigado'),
('ale-conpi-02', 'conpi-app', 'Inyección SQL en Catálogo de Repuestos y Productos', 'inyeccion_sql', 1500000, 0.20, 300000, 'Consultas preparadas con PDO / ORM y sanitización de inputs.', 'mitigado'),
('ale-conpi-03', 'conpi-app', 'Interrupción de Pasarela Webpay / Carrito de Compras', 'caida_pasarela', 1200000, 0.50, 600000, 'Webhooks asíncronos con reintentos automáticos y fallback bancario.', 'en_progreso'),
('ale-adm-01', 'lsc-admin-studio', 'Expiración Imprevista de Dominio o Certificado TLS', 'ssl_caido', 450000, 0.10, 45000, 'Monitoreo diario de expiración en NIC Chile y AutoSSL.', 'mitigado')
ON CONFLICT (id) DO UPDATE SET ale_clp = EXCLUDED.ale_clp;

-- 17.23 Defensa Activa (8 Capas del SOC)
INSERT INTO defense_in_depth_layers (id, project_id, layer_number, shield_name, level_name, status, description, is_active)
VALUES
('def-1', 'conpi-app', 1, 'Anti-Brute Force & Credential Stuffing', 'Capa 1 y 2', 'Activo (Blindado)', 'Bloqueo temporal de 60s tras intentos fallidos. Cifrado SHA-256 en frontend y sesión efímera.', true),
('def-2', 'conpi-app', 2, 'WAF & Anti-Inyección (SQLi, XSS, Path Traversal)', 'Capa 3', 'Activo (Sanitizado)', 'Filtro regex contra <script>, eval(), comillas de escape y directivas maliciosas.', true),
('def-3', 'conpi-app', 3, 'Detección de Bots Sin JS & Scraping', 'BBDD Cloud', 'Protegido (Supabase RLS)', 'Peticiones sin tokens o que no ejecutan JS son rechazadas por Row Level Security.', true),
('def-4', 'conpi-app', 4, 'Monitoreo SSL & Expiración de Certificados', 'TLS 1.3 / HTTPS', 'Auto-Chequeo Activo', 'Agente reporta validez de SSL. Vigencia auditada en NIC Chile.', true),
('def-5', 'conpi-app', 5, 'Auditoría de Dependencias (Supply Chain)', 'Integridad', '0 Vulnerabilidades', 'Paquetes auditados con npm audit en cada pipeline de build y despliegue a producción.', true),
('def-6', 'conpi-app', 6, 'Uptime Real 24/7 (Keep-Alive Anti-Pausa)', 'Disponibilidad', '200 OK (Keep-Alive)', 'Disparadores periódicos que mantienen el servidor y bases de datos despiertos permanentemente.', true),
('def-7', 'conpi-app', 7, 'Protección Anti-Defacement & Control Git', 'Integridad Web', 'Inmutable (Git CI/CD)', 'Repositorio GitHub versionado. Todo cambio no rastreado en commit es descartado por el pipeline.', true),
('def-8', 'conpi-app', 8, 'Telemetría de Seguridad y Latencias en Vivo', 'Edge Network', 'Agente v2.0 Conectado', 'sendBeacon guardando eventos en telemetry_logs de Supabase con alertas por fallos JS.', true)
ON CONFLICT (id) DO NOTHING;

-- 17.24 Oportunidad de Monetización con Clientes (Anexo de Ciberseguridad a Cotización & Contrato)
INSERT INTO security_commercial_opportunities (id, project_id, client_id, quote_id, deal_id, plan_tier, monthly_price_clp, client_estimated_sales_clp, ale_savings_clp, roi_multiplier, contract_annex_title, status)
VALUES
('sec-com-conpi-01', 'conpi-app', 'cli-1794802562643', 'quote-conpi-01', 'deal-conpi-01', 'pro', 185000, 5000000, 1285000, 6.9, 'Anexo 2: Servicio Continuo de Ciberseguridad, SLA 99.9% & Gobernanza SOC 24/7', 'propuesto')
ON CONFLICT (id) DO UPDATE SET monthly_price_clp = EXCLUDED.monthly_price_clp;
