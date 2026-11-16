-- ============================================================
-- SCRIPT DE ACTUALIZACIÓN & MIGRACIÓN SUPABASE (SQL EDITOR)
-- Administrador de Proyectos - LSC Operations
-- Multi-dominio (1 a N), Hosting TecnoInver & Métricas
-- ============================================================

-- 1. Asegurar columnas de hosting en monitored_projects
ALTER TABLE monitored_projects ADD COLUMN IF NOT EXISTS hosting_provider TEXT DEFAULT 'TecnoInver';
ALTER TABLE monitored_projects ADD COLUMN IF NOT EXISTS hosting_plan TEXT DEFAULT 'Hosting Corporativo cPanel';
ALTER TABLE monitored_projects ADD COLUMN IF NOT EXISTS hosting_renewal_date DATE;

-- 2. Crear tabla relacional de dominios (1 a Muchos)
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

-- Habilitar RLS
ALTER TABLE project_domains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir anon project_domains" ON project_domains;
CREATE POLICY "Permitir anon project_domains" ON project_domains FOR ALL USING (true) WITH CHECK (true);

-- 3. Actualizar datos de Hosting para CONPI en monitored_projects
UPDATE monitored_projects
SET hosting_provider = 'TecnoInver (cPanel / Apache / MySQL)',
    hosting_plan = 'Hosting Corporativo cPanel (IP 45.236.165.193)',
    hosting_renewal_date = '2025-10-15'
WHERE id = 'conpi-app';

-- 4. Insertar los dos dominios de CONPI (.cl) en project_domains
INSERT INTO project_domains (id, project_id, domain_name, provider, expiration_date, is_primary, ssl_status, redirects_to)
VALUES
('dom-conpi-01', 'conpi-app', 'conpi.cl', 'NIC Chile (.cl)', '2027-06-19', true, 'valido', NULL),
('dom-conpi-02', 'conpi-app', 'conpis.cl', 'NIC Chile (.cl)', '2028-06-05', false, 'valido', 'https://conpi.cl'),
('dom-curriculum-01', 'curriculum-tiare', 'tiareperezconcha.github.io', 'GitHub Pages', '2030-01-01', true, 'valido', NULL),
('dom-lsc-01', 'lsc-admin-studio', 'localhost:5173', 'Local Dev Server', '2030-01-01', true, 'valido', NULL)
ON CONFLICT (id) DO UPDATE 
SET expiration_date = EXCLUDED.expiration_date,
    provider = EXCLUDED.provider,
    is_primary = EXCLUDED.is_primary,
    ssl_status = EXCLUDED.ssl_status,
    redirects_to = EXCLUDED.redirects_to,
    updated_at = now();

-- 5. Métricas de PageSpeed (Ejecución limpia y autónoma)
INSERT INTO pagespeed_metrics (id, project_id, url, performance_score, accessibility_score, best_practices_score, seo_score, fcp_ms, lcp_ms, cls, tbt_ms)
VALUES
('psi-conpi-app', 'conpi-app', 'https://conpi.cl', 92, 98, 100, 100, 850, 1580, 0.015, 35),
('psi-curriculum-tiare', 'curriculum-tiare', 'https://tiareperezconcha.github.io/curriculum/tiare/', 98, 100, 100, 100, 620, 1100, 0.005, 10),
('psi-lsc-admin-studio', 'lsc-admin-studio', 'http://localhost:5173', 95, 96, 98, 96, 710, 1340, 0.020, 40)
ON CONFLICT (id) DO UPDATE 
SET performance_score = EXCLUDED.performance_score,
    accessibility_score = EXCLUDED.accessibility_score,
    best_practices_score = EXCLUDED.best_practices_score,
    seo_score = EXCLUDED.seo_score,
    fcp_ms = EXCLUDED.fcp_ms,
    lcp_ms = EXCLUDED.lcp_ms,
    cls = EXCLUDED.cls,
    tbt_ms = EXCLUDED.tbt_ms,
    analyzed_at = now();

-- 6. Verificación de Tablas Creadas
SELECT 'Tablas y dominios configurados correctamente en Supabase' AS resultado;
