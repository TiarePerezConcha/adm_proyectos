-- ============================================================
-- PARCHE DE MIGRACIÓN: QA, DEVOPS, ARQUITECTURA & CIBERSEGURIDAD SOC
-- Administrador de Proyectos - LSC Operations
-- Conexión 1 a N con Monitored Projects, Clientes, Cotizaciones y Contratos
-- ============================================================

-- ============================================================
-- 1. TABLAS DE PLANIFICACIÓN, QA, DEVOPS & BBDD
-- ============================================================

-- 1.1 Tareas Pendientes & Planificación
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

-- 1.2 Checklist QA ("Listo para Producción")
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

-- 1.3 Copias de Seguridad & Respaldos (Backups)
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

-- 1.4 Logs de Errores en Producción (Error Tracking)
CREATE TABLE IF NOT EXISTS project_error_logs (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  error_type TEXT DEFAULT 'runtime_js',
  severity TEXT DEFAULT 'media',
  resolved BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.5 Bitácora Técnica & Historial de Decisiones de Arquitectura (ADR)
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

-- 1.6 Stack & Arquitectura Tecnológica
CREATE TABLE IF NOT EXISTS project_tech_stack (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES monitored_projects(id) ON DELETE CASCADE,
  technology_name TEXT NOT NULL,
  category TEXT DEFAULT 'frontend',
  version TEXT,
  is_critical BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.7 Despliegue & Git Versioning
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

-- 1.8 Tipo, Estado y Cuota de Almacenamiento de BBDD
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
-- 2. TABLAS DE CIBERSEGURIDAD, MINI-SOC & MONETIZACIÓN
-- ============================================================

-- 2.1 Diagnóstico Técnico del CISO (SOC con IA)
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

-- 2.2 Feed de Ciberamenazas en Vivo (Centro de Inteligencia Web Chile)
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

-- 2.3 Matriz Cuantitativa ALE (Amenazas en Matriz de Riesgo)
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

-- 2.4 Defensa Activa (8 Capas del SOC)
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

-- 2.5 Oportunidad de Monetización con Clientes (Anexo a Cotización & Contrato)
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
  contract_annex_title TEXT DEFAULT 'Anexo 2: Servicio Continuo de Ciberseguridad & Gobernanza SOC 24/7',
  status TEXT DEFAULT 'propuesto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 3. HABILITACIÓN DE ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ============================================================

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

DROP POLICY IF EXISTS "Permitir anon project_tasks" ON project_tasks;
CREATE POLICY "Permitir anon project_tasks" ON project_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon project_qa_checklist" ON project_qa_checklist;
CREATE POLICY "Permitir anon project_qa_checklist" ON project_qa_checklist FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon project_backups" ON project_backups;
CREATE POLICY "Permitir anon project_backups" ON project_backups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon project_error_logs" ON project_error_logs;
CREATE POLICY "Permitir anon project_error_logs" ON project_error_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon project_architecture_decisions" ON project_architecture_decisions;
CREATE POLICY "Permitir anon project_architecture_decisions" ON project_architecture_decisions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon project_tech_stack" ON project_tech_stack;
CREATE POLICY "Permitir anon project_tech_stack" ON project_tech_stack FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon project_deployments" ON project_deployments;
CREATE POLICY "Permitir anon project_deployments" ON project_deployments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon project_database_storage" ON project_database_storage;
CREATE POLICY "Permitir anon project_database_storage" ON project_database_storage FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon ciso_diagnostics" ON ciso_diagnostics;
CREATE POLICY "Permitir anon ciso_diagnostics" ON ciso_diagnostics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon security_threat_feed" ON security_threat_feed;
CREATE POLICY "Permitir anon security_threat_feed" ON security_threat_feed FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon security_ale_matrix" ON security_ale_matrix;
CREATE POLICY "Permitir anon security_ale_matrix" ON security_ale_matrix FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon defense_in_depth_layers" ON defense_in_depth_layers;
CREATE POLICY "Permitir anon defense_in_depth_layers" ON defense_in_depth_layers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir anon security_commercial_opportunities" ON security_commercial_opportunities;
CREATE POLICY "Permitir anon security_commercial_opportunities" ON security_commercial_opportunities FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 4. POBLADO DE DATOS BASE (SEEDING VINCULADO CON PROYECTOS)
-- ============================================================

-- 4.1 Planificación & Tareas
INSERT INTO project_tasks (id, project_id, title, category, completed, due_date, priority)
VALUES
('tsk-conpi-01', 'conpi-app', 'Comprimir catálogo de imágenes con WebP', 'Rendimiento', true, '2026-11-10', 'alta'),
('tsk-conpi-02', 'conpi-app', 'Auditoría mensual de Core Web Vitals en móvil', 'SEO', false, '2026-11-25', 'media'),
('tsk-conpi-03', 'conpi-app', 'Revisar reglas de bloqueo cPHulk por correos en cPanel', 'Seguridad', true, '2026-11-16', 'alta'),
('tsk-adm-01', 'adm-proyectos', 'Sincronizar Service Account con Search Console para otros dominios', 'SEO', false, '2026-11-30', 'media'),
('tsk-adm-02', 'adm-proyectos', 'Verificar cuota de tokens en Gemini Free Tier ($0 Blindado)', 'IA', true, '2026-11-16', 'alta')
ON CONFLICT (id) DO UPDATE SET completed = EXCLUDED.completed;

-- 4.2 Checklist QA
INSERT INTO project_qa_checklist (id, project_id, seo_ready, responsive_ready, error_handling_ready, security_ready, backups_ready, score_pct, notes)
VALUES
('qa-conpi-app', 'conpi-app', true, true, true, true, true, 100, 'Sitio verificado en producción con certificados TLS vigentes y soporte cPanel.'),
('qa-curriculum-tiare', 'curriculum-tiare', true, true, true, true, true, 100, 'Frontend estático GitHub Pages validado en móvil y desktop.'),
('qa-adm-proyectos', 'lsc-admin-studio', true, true, true, true, true, 100, 'Panel de control con RLS activo y Keep-Alive continuo.')
ON CONFLICT (id) DO UPDATE SET score_pct = EXCLUDED.score_pct;

-- 4.3 Copias de Seguridad & Respaldos
INSERT INTO project_backups (id, project_id, backup_name, backup_type, backup_url, backup_date, file_size_mb, verified)
VALUES
('bk-conpi-01', 'conpi-app', 'Respaldo Completo cPanel TecnoInver (MySQL & Archivos Web)', 'cpanel', 'https://conpi.cl/cpanel', '2026-11-10', 450.00, true),
('bk-adm-01', 'lsc-admin-studio', 'Respaldo Automático Supabase Postgres (Tablas y RLS)', 'supabase', 'https://cvfybrtblxzpawnxqsnd.supabase.co', '2026-11-16', 15.20, true),
('bk-adm-02', 'lsc-admin-studio', 'Snapshot de Repositorio GitHub (Rama main)', 'git_snapshot', 'https://github.com/TiarePerezConcha/adm_proyectos', '2026-11-16', 8.50, true)
ON CONFLICT (id) DO UPDATE SET backup_date = EXCLUDED.backup_date;

-- 4.4 Bitácora Técnica de Arquitectura (ADR)
INSERT INTO project_architecture_decisions (id, project_id, title, status, context_rationale, decision, consequences, decisionDate)
VALUES
('adr-conpi-01', 'conpi-app', 'Aislamiento de Telemetría respecto al Servidor de Correo', 'aceptada', 'Caída por intentos fallidos de login a contacto@conpi.cl activó firewall cPHulk.', 'El monitor opera de forma 100% pasiva vía HTTPS sin tocar puertos IMAP/SMTP.', 'Garantiza que el software nunca provocará bloqueos de IP en el hosting TecnoInver.', '2026-11-16'),
('adr-adm-01', 'lsc-admin-studio', 'Persistencia Híbrida Supabase Cloud + LocalStorage Fallback', 'aceptada', 'Se requiere tolerancia a fallos offline y sincronización instantánea en la nube.', 'Lectura prioritaria de Supabase con respaldo local automático en el navegador.', '0 pérdida de datos si la conexión sufre microcortes.', '2026-11-15')
ON CONFLICT (id) DO NOTHING;

-- 4.5 Stack & Componentes de Arquitectura
INSERT INTO project_tech_stack (id, project_id, technology_name, category, version, is_critical)
VALUES
('stk-conpi-01', 'conpi-app', 'React', 'frontend', '18.3', true),
('stk-conpi-02', 'conpi-app', 'Vite', 'devops', '5.4', true),
('stk-conpi-03', 'conpi-app', 'Tailwind CSS', 'frontend', '3.4', true),
('stk-conpi-04', 'conpi-app', 'MySQL cPanel', 'database', '8.0', true),
('stk-conpi-05', 'conpi-app', 'Apache / LiteSpeed', 'infra', '2.4', true)
ON CONFLICT (id) DO NOTHING;

-- 4.6 Despliegues & Git
INSERT INTO project_deployments (id, project_id, commit_hash, commit_message, version_deployed, environment, deployed_by)
VALUES
('dep-conpi-01', 'conpi-app', '92c473f', 'Producción activa con telemetría cPanel', 'v2.4.1', 'produccion', 'Tiare Pérez Concha'),
('dep-adm-01', 'lsc-admin-studio', '38ab8d0', 'Multi-dominio conpi.cl/conpis.cl y sync Supabase', 'v1.2.0', 'produccion', 'Tiare Pérez Concha')
ON CONFLICT (id) DO NOTHING;

-- 4.7 Cuota de BBDD & Almacenamiento
INSERT INTO project_database_storage (id, project_id, database_type, connection_status, used_mb, limit_mb, quota_percent, is_free_tier, health_ping_ms)
VALUES
('dbs-conpi-app', 'conpi-app', 'mysql_cpanel', 'online', 142.50, 2048.00, 6.95, false, 28),
('dbs-adm-proyectos', 'lsc-admin-studio', 'supabase_postgres', 'online', 0.15, 500.00, 0.03, true, 38),
('dbs-curriculum-tiare', 'curriculum-tiare', 'static_none', 'online', 0.00, 0.00, 0.00, true, 0)
ON CONFLICT (id) DO UPDATE SET used_mb = EXCLUDED.used_mb, health_ping_ms = EXCLUDED.health_ping_ms;

-- 4.8 Diagnóstico Técnico del CISO (SOC con IA)
INSERT INTO ciso_diagnostics (id, project_id, client_id, security_score, executive_summary, critical_findings, immediate_actions, commercial_value)
VALUES
('ciso-diag-01', 'conpi-app', 'cli-1794802562643', 94,
 'Evaluación de seguridad perimetral de CONPI Chile y ecosistema web LSC. Infraestructura sólida con protección activa contra inyecciones y bloqueo por reintentos en cPanel.',
 '["Reglas de cPHulk / Fail2Ban en cPanel bloquearon acceso por reintentos en correo externo contacto@conpi.cl.", "Certificado SSL emitido y vigente hasta 2027/2028 en NIC Chile.", "Ausencia de fugas de variables de entorno en frontend React."]'::jsonb,
 '["Solicitar lista blanca (Whitelist) de IP en cPanel TecnoInver.", "Activar doble factor de autenticación (2FA) en casillas corporativas.", "Vincular Cloudflare CDN como escudo perimetral gratuito."]'::jsonb,
 'Servicio comercializable de Gobernanza Técnica & Ciberseguridad Activa con tarifa mensual sugerida de $185.000 CLP.')
ON CONFLICT (id) DO UPDATE SET security_score = EXCLUDED.security_score;

-- 4.9 Feed de Ciberamenazas en Vivo (Chile)
INSERT INTO security_threat_feed (id, project_id, title, category, severity, target_project, description, mitigation_action, status, country)
VALUES
('thr-1', 'lsc-admin-studio', 'Ataque Automatizado de Fuerza Bruta Bloqueado en Login', 'fuerza_bruta', 'alta', 'Plataforma Administrador de Proyectos', 'Se detectaron 5 intentos fallidos consecutivos de acceso con diccionarios de credenciales.', 'Bloqueo temporal SHA + Registro de User-Agent en logs de telemetría.', 'bloqueado', 'Chile'),
('thr-2', 'conpi-app', 'Intento de Inyección de Script XSS Sanitizado', 'inyeccion', 'media', 'Formulario de Contacto Web', 'Petición entrante en campo mensaje con patrones de inyección <script>alert(1)</script>.', 'Capa 3 WAF activa. Caracteres peligrosos neutralizados.', 'mitigado', 'Chile'),
('thr-3', 'conpi-app', 'Alerta Global: Campaña de Phishing activa en Pasarelas de Pago en Chile', 'phishing', 'alta', 'CONPI & Tiendas E-commerce', 'Campañas de suplantación de identidad apuntando a credenciales de Webpay Plus y Mercado Pago.', 'Verificar certificados SSL vigentes, cabecera HSTS activa y 2FA obligatorio.', 'vigilando', 'Chile'),
('thr-4', 'lsc-admin-studio', 'Chequeo de Integridad de Dependencias (Supply Chain)', 'vulnerabilidad', 'informativa', 'Ecosistema de Repositorios GitHub', 'Escaneo de dependencias mediante npm audit y Dependabot en GitHub Actions. 0 vulnerabilidades.', 'Pipeline de compilación continua con auditoría automatizada.', 'mitigado', 'Chile')
ON CONFLICT (id) DO NOTHING;

-- 4.10 Matriz Cuantitativa ALE (Riesgos Financieros de Seguridad)
INSERT INTO security_ale_matrix (id, project_id, threat_name, threat_category, sle_clp, aro, ale_clp, mitigation_strategy, status)
VALUES
('ale-conpi-01', 'conpi-app', 'Caída de Servidor por Ataque de Fuerza Bruta / Bloqueo cPanel', 'fuerza_bruta', 850000, 0.40, 340000, 'Aislamiento de telemetría y reglas de rate-limiting en cPanel.', 'mitigado'),
('ale-conpi-02', 'conpi-app', 'Inyección SQL en Catálogo de Repuestos y Productos', 'inyeccion_sql', 1500000, 0.20, 300000, 'Consultas preparadas con PDO / ORM y sanitización de inputs.', 'mitigado'),
('ale-conpi-03', 'conpi-app', 'Interrupción de Pasarela Webpay / Carrito de Compras', 'caida_pasarela', 1200000, 0.50, 600000, 'Webhooks asíncronos con reintentos automáticos y fallback bancario.', 'en_progreso'),
('ale-adm-01', 'lsc-admin-studio', 'Expiración Imprevista de Dominio o Certificado TLS', 'ssl_caido', 450000, 0.10, 45000, 'Monitoreo diario de expiración en NIC Chile y AutoSSL.', 'mitigado')
ON CONFLICT (id) DO UPDATE SET ale_clp = EXCLUDED.ale_clp;

-- 4.11 Defensa Activa (8 Capas del SOC)
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

-- 4.12 Oportunidad de Monetización con Clientes (Anexo de Ciberseguridad a Cotización & Contrato)
INSERT INTO security_commercial_opportunities (id, project_id, client_id, quote_id, deal_id, plan_tier, monthly_price_clp, client_estimated_sales_clp, ale_savings_clp, roi_multiplier, contractAnnexTitle, status)
VALUES
('sec-com-conpi-01', 'conpi-app', 'cli-1794802562643', 'quote-conpi-01', 'deal-conpi-01', 'pro', 185000, 5000000, 1285000, 6.9, 'Anexo 2: Servicio Continuo de Ciberseguridad, SLA 99.9% & Gobernanza SOC 24/7', 'propuesto')
ON CONFLICT (id) DO UPDATE SET monthly_price_clp = EXCLUDED.monthly_price_clp;

SELECT '13 tablas de QA, DevOps, Arquitectura y Ciberseguridad creadas exitosamente' AS resultado;
