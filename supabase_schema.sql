-- ============================================================
-- ESQUEMA SQL MAESTRO Y UNIFICADO PARA SUPABASE
-- Plataforma: Administrador de Proyectos & LSC Studio
-- Base de Datos: PostgreSQL (Supabase Cloud)
-- ============================================================

-- Habilitar extensión UUID para generación segura de identificadores
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLAS PRINCIPALES DEL SISTEMA (CRM & ESTUDIO)
-- ============================================================

-- 1.1 Tabla de Clientes
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

-- 1.2 Tabla de Deals del CRM (Pipeline de Ventas)
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

-- 1.3 Tabla de Evaluaciones Estratégicas (FODA / PESTEL / Viabilidad)
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

-- 1.4 Tabla de Cotizaciones Express (Sprints & Servicios)
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

-- ============================================================
-- 2. TABLAS DE TELEMETRÍA, MONITOR & KEEP-ALIVE
-- ============================================================

-- 2.1 Tabla de Telemetría & Heartbeats (Monitoreo de Sitios & Anti-Pausa Supabase)
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

-- ============================================================
-- 3. TABLAS DE ATENCIÓN, CALENDAR & ASISTENTE IA
-- ============================================================

-- 3.1 Tabla de Conversaciones & Consultas del Agente IA
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT,
  query TEXT NOT NULL,
  category TEXT DEFAULT 'GENERAL',
  response TEXT,
  is_helpful BOOLEAN DEFAULT true,
  rating INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.2 Tabla de FAQs Oficiales del Sistema
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.3 Tabla de Agendamientos Google Calendar (Bookings)
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
  status TEXT DEFAULT 'confirmada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 4. SEGURIDAD: ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ============================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_bookings ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para clave pública (anon key) de la SPA cliente
CREATE POLICY "Permitir todo acceso anon clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo acceso anon crm_deals" ON crm_deals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo acceso anon evaluations" ON evaluations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo acceso anon quotes" ON quotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo acceso anon telemetry_logs" ON telemetry_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo acceso anon ai_conversations" ON ai_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo acceso anon faqs" ON faqs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo acceso anon calendar_bookings" ON calendar_bookings FOR ALL USING (true) WITH CHECK (true);
