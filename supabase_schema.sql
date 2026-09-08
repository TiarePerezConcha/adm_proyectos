-- ============================================================
-- ESQUEMA SQL PARA SUPABASE: PROYECTO cvfybrtblxzpawnxqsnd
-- Plataforma LSC Admin & Studio
-- ============================================================

-- 1. Tabla de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  country TEXT DEFAULT 'Chile',
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Deals del CRM
CREATE TABLE IF NOT EXISTS crm_deals (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  title TEXT NOT NULL,
  value_clp BIGINT DEFAULT 850000,
  stage TEXT DEFAULT 'reunion_agendada',
  meeting_date TEXT,
  meet_link TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Evaluaciones de Prospectos (FODA / PESTEL)
CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
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

-- 4. Tabla de Cotizaciones Express
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  quote_number TEXT NOT NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_company TEXT,
  project_title TEXT NOT NULL,
  subtitle TEXT,
  outcome TEXT,
  services JSONB,
  sprints JSONB,
  total_clp BIGINT NOT NULL,
  payment_condition TEXT DEFAULT '100_anticipado',
  payment_details TEXT,
  tax_document TEXT DEFAULT 'boleta',
  delivery_time_days INT DEFAULT 14,
  validity_days INT DEFAULT 15,
  status TEXT DEFAULT 'borrador',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Telemetría & Heartbeat (Para monitoreo de sitios y Supabase Keep-Alive)
CREATE TABLE IF NOT EXISTS telemetry_logs (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL,
  event TEXT NOT NULL,
  url TEXT,
  load_time_ms INT,
  ssl_valid BOOLEAN DEFAULT TRUE,
  message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Habilitar lectura/escritura pública con Anon Key para pruebas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo acceso con anon key" ON clients FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso con anon key" ON crm_deals FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso con anon key" ON evaluations FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso con anon key" ON quotes FOR ALL USING (true);
CREATE POLICY "Permitir todo acceso con anon key" ON telemetry_logs FOR ALL USING (true);
