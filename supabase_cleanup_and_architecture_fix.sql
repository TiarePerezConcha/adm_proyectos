-- ============================================================================
-- SCRIPT DE LIMPIEZA Y ESTANDARIZACIÓN ARQUITECTÓNICA DE BASE DE DATOS
-- PROYECTO: ADMINISTRADOR DE PROYECTOS (LSC)
-- OBJETIVO: Separar estrictamente CRM Deals de Sitios Web Monitoreados y purgar datos espurios
-- ============================================================================

-- 1. PURGAR REGISTROS ESPURIOS EN monitored_projects
-- Elimina tratos comerciales (studio-deal-...), rutas de archivos locales (file:///)
-- y la URL técnica interna de Supabase que fueron capturadas por error.
DELETE FROM monitored_projects 
WHERE id LIKE 'studio-%' 
   OR id LIKE 'deal-%' 
   OR url LIKE 'file:%' 
   OR url LIKE '%supabase.co%' 
   OR url = '' 
   OR url = 'EMPTY';

-- 2. ASEGURAR LOS 4 PROYECTOS REALES Y LEGÍTIMOS
INSERT INTO monitored_projects (
  id, 
  client_id, 
  name, 
  url, 
  project_ownership_type, 
  is_personal_project, 
  client_name, 
  uptime_pct, 
  latency_ms, 
  ssl_status, 
  stack, 
  gsc_property, 
  gsc_connected, 
  hosting_provider, 
  hosting_plan, 
  hosting_renewal_date
)
VALUES
(
  'conpi-app', 
  'cli-1794802562643', 
  'CONPI Chile (conpi.cl)', 
  'https://conpi.cl', 
  'cliente', 
  false, 
  'CONPI Chile SpA', 
  99.85, 
  220, 
  'valido', 
  '["React 18", "Vite", "Tailwind CSS", "REST API / MySQL"]'::jsonb, 
  'sc-domain:conpi.cl', 
  true, 
  'TecnoInver (cPanel / Apache / MySQL)', 
  'Cero New ($15,000 Anual / conpis.cl)', 
  '2027-06-19'
),
(
  'adm-proyectos', 
  NULL, 
  'Plataforma Administrador de Proyectos', 
  'https://tiareperezconcha.github.io/adm_proyectos/', 
  'propio', 
  true, 
  'Tiare Pérez Concha (Propio)', 
  100.00, 
  260, 
  'valido', 
  '["React 18", "TypeScript", "Tailwind CSS", "Supabase Cloud"]'::jsonb, 
  NULL, 
  false, 
  'GitHub CDN Global + Supabase Cloud', 
  'GitHub Pages Free', 
  '2030-01-01'
),
(
  'curriculum-tiare', 
  NULL, 
  'Portfolio & CV Tiare Pérez', 
  'https://tiareperezconcha.github.io/curriculum/tiare/', 
  'propio', 
  true, 
  'Tiare Pérez Concha (Marca Personal)', 
  100.00, 185, 
  'valido', 
  '["HTML5", "CSS3", "JavaScript", "GitHub Pages"]'::jsonb, 
  'https://tiareperezconcha.github.io/curriculum/tiare/', 
  false, 
  'GitHub CDN Global', 
  'GitHub Pages Free', 
  '2030-01-01'
),
(
  'curriculumpage-fernando', 
  NULL, 
  'Curriculum Fernando Figueroa', 
  'https://tiareperezconcha.github.io/FERNANDO_ALEJANDRO_FIGUEROA_CERDA/', 
  'cliente', 
  false, 
  'Fernando Figueroa', 
  100.00, 
  180, 
  'valido', 
  '["HTML5", "CSS3", "JavaScript", "GitHub Pages"]'::jsonb, 
  NULL, 
  false, 
  'GitHub CDN Global', 
  'GitHub Pages Free', 
  '2030-01-01'
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    url = EXCLUDED.url,
    hosting_provider = EXCLUDED.hosting_provider,
    hosting_plan = EXCLUDED.hosting_plan,
    hosting_renewal_date = EXCLUDED.hosting_renewal_date,
    updated_at = now();

-- 3. VERIFICACIÓN FINAL: Mostrar los proyectos resultantes limpios
SELECT id, name, url, project_ownership_type, hosting_provider, hosting_renewal_date 
FROM monitored_projects 
ORDER BY is_personal_project ASC, name ASC;
