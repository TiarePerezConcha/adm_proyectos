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

-- Políticas de Acceso para Clave Pública (anon key)
CREATE POLICY "Permitir anon consultant_profile" ON consultant_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon legal_representatives" ON legal_representatives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir anon monitored_projects" ON monitored_projects FOR ALL USING (true) WITH CHECK (true);
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
INSERT INTO monitored_projects (id, client_id, name, url, project_ownership_type, is_personal_project, client_name, uptime_pct, latency_ms, ssl_status, stack, gsc_property, gsc_connected)
VALUES
('conpi-app', 'cli-1794802562643', 'CONPI Chile (conpi.cl)', 'https://conpi.cl', 'cliente', false, 'CONPI Chile SpA', 99.85, 240, 'valido', '["React 18", "Vite", "Tailwind CSS", "REST API / MySQL"]'::jsonb, 'sc-domain:conpi.cl', true),
('curriculum-tiare', NULL, 'Currículum Web & Portafolio', 'https://tiareperezconcha.github.io/curriculum/tiare/', 'propio', true, 'Tiare Pérez Concha', 100.00, 115, 'valido', '["HTML5", "CSS3", "JavaScript", "GitHub Pages"]'::jsonb, 'https://tiareperezconcha.github.io/curriculum/tiare/', false),
('lsc-admin-studio', NULL, 'LSC Operations Studio', 'http://localhost:5173', 'propio', true, 'LSC Internal', 100.00, 25, 'valido', '["React 18", "TypeScript", "Tailwind CSS", "Supabase Cloud"]'::jsonb, NULL, false)
ON CONFLICT (id) DO UPDATE SET updated_at = now();

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
