-- ============================================================================
-- ESQUEMA NORMALIZADO · ADMINISTRADOR DE PROYECTOS & SOC TELEMETRÍA (LSC)
-- Motor: PostgreSQL 15+ (Supabase Cloud)
-- Estándar de Diseño: 3FN (Tercera Forma Normal), Integridad Referencial ACID,
-- Políticas de Ciberseguridad RLS y Principio de Menor Privilegio (Estándar DUOC UC).
-- ============================================================================

BEGIN;

-- ============================================================================
-- MÓDULO 1: NÚCLEO ORGANIZACIONAL & PROYECTOS WEB (INFRAESTRUCTURA REAL)
-- ============================================================================

-- 1.1 Organizaciones (Clientes comerciales y Organización propia)
CREATE TABLE IF NOT EXISTS organizaciones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              TEXT NOT NULL,
  tipo                TEXT NOT NULL CHECK (tipo IN ('propia', 'cliente')),
  rut_dni             TEXT,
  email_contacto      TEXT,
  telefono_contacto   TEXT,
  representante_legal TEXT,
  direccion           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE organizaciones IS 'Entidad de gobernanza: Representa a los clientes y a la organización propia (LSC) con sus datos legales y de contacto.';
COMMENT ON COLUMN organizaciones.tipo IS 'Clasificación estricta: propia (LSC / Tiare) o cliente (empresas o personas mandantes).';

-- 1.2 Catálogo de Ciclo de Vida del Software (SDLC)
CREATE TABLE IF NOT EXISTS cat_ciclo_vida (
  id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo  TEXT NOT NULL UNIQUE
);

COMMENT ON TABLE cat_ciclo_vida IS 'Catálogo cerrado para etapas de desarrollo: produccion, desarrollo, demo, local.';

-- 1.3 Catálogo de Proveedores de Infraestructura
CREATE TABLE IF NOT EXISTS proveedores (
  id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre  TEXT NOT NULL UNIQUE,
  tipo    TEXT NOT NULL CHECK (tipo IN ('hosting', 'dominio', 'base_de_datos', 'api', 'cdn', 'otro'))
);

COMMENT ON TABLE proveedores IS 'Proveedores oficiales: NIC Chile, TecnoInver, GitHub Pages, Supabase Cloud, Cloudflare, etc.';

-- 1.4 Proyectos Web Monitoreados (Sitios y Aplicaciones en Producción)
-- REGLA ARQUITECTÓNICA: Solo sitios web reales con protocolo HTTP/HTTPS válido.
-- NUNCA deals comerciales, rutas locales file:/// o endpoints internos de base de datos.
CREATE TABLE IF NOT EXISTS proyectos (
  id                 TEXT PRIMARY KEY, -- Slug canónico legible: 'conpi-app', 'adm-proyectos', etc.
  organizacion_id    UUID REFERENCES organizaciones(id) ON DELETE SET NULL,
  ciclo_vida_id      INT REFERENCES cat_ciclo_vida(id),
  nombre             TEXT NOT NULL,
  url_produccion     TEXT NOT NULL CHECK (url_produccion ~* '^https?://[a-zA-Z0-9.-]+'),
  es_proyecto_propio BOOLEAN NOT NULL DEFAULT false,
  uptime_pct         NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK (uptime_pct BETWEEN 0 AND 100),
  latencia_prom_ms   INT NOT NULL DEFAULT 220 CHECK (latencia_prom_ms >= 0),
  ssl_valido         BOOLEAN NOT NULL DEFAULT true,
  stack_tecnologico  JSONB NOT NULL DEFAULT '[]'::jsonb,
  gsc_property       TEXT,
  gsc_conectado      BOOLEAN NOT NULL DEFAULT false,
  hosting_proveedor  TEXT NOT NULL DEFAULT 'Hosting Compartido',
  hosting_plan       TEXT,
  hosting_vence_at   DATE,
  ultimo_keepalive   TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE proyectos IS 'Entidad central de infraestructura: Únicamente almacena proyectos web desplegados con URL HTTP/S verificable.';
COMMENT ON COLUMN proyectos.url_produccion IS 'URL obligatoria validada por expresión regular: rechaza file:// y rutas locales.';

-- 1.5 Dominios de Proyectos (Relación 1 a Muchos: Un proyecto puede tener múltiples dominios .cl)
CREATE TABLE IF NOT EXISTS dominios (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id        TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  proveedor_id       INT REFERENCES proveedores(id),
  dominio_nombre     TEXT NOT NULL UNIQUE,
  vencimiento        DATE,
  es_principal       BOOLEAN NOT NULL DEFAULT true,
  redirecciona_a     TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE dominios IS 'Soporte multi-dominio 1:N. Ejemplo: conpi-app posee conpi.cl (principal) y conpis.cl (redirección).';

-- 1.6 Certificados SSL por Dominio
CREATE TABLE IF NOT EXISTS certificados_ssl (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dominio_id  UUID NOT NULL REFERENCES dominios(id) ON DELETE CASCADE,
  emisor      TEXT NOT NULL DEFAULT 'AutoSSL / Let''s Encrypt',
  vence_at    TIMESTAMPTZ NOT NULL,
  es_valido   BOOLEAN NOT NULL DEFAULT true
);

-- 1.7 Catálogo y Detalle de Bases de Datos de Proyectos
CREATE TABLE IF NOT EXISTS cat_motor_bd (
  id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS bases_datos_proyectos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id  TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  motor_id     INT NOT NULL REFERENCES cat_motor_bd(id),
  peso_mb      NUMERIC(10,2) NOT NULL DEFAULT 0.0 CHECK (peso_mb >= 0),
  limite_mb    NUMERIC(10,2) NOT NULL DEFAULT 500.0 CHECK (limite_mb >= 0),
  estado       TEXT NOT NULL DEFAULT 'online' CHECK (estado IN ('online', 'pausado', 'sin_bbdd')),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- MÓDULO 2: TELEMETRÍA, RENDIMIENTO & SDK JS v2.1 (MONITOREO EN VIVO)
-- ============================================================================

-- 2.1 Catálogo de Eventos de Telemetría
CREATE TABLE IF NOT EXISTS cat_tipo_evento_telemetria (
  id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo  TEXT NOT NULL UNIQUE
);

COMMENT ON TABLE cat_tipo_evento_telemetria IS 'Tipos reconocidos: heartbeat (ping de carga), error_js (excepciones frontend), security_anomaly (violaciones CSP/CORS), incident_note (bitácora).';

-- 2.2 Registro de Eventos de Telemetría (Ingesta directa de sendBeacon)
CREATE TABLE IF NOT EXISTS telemetria_eventos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id      TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  tipo_evento_id   INT NOT NULL REFERENCES cat_tipo_evento_telemetria(id),
  url_pagina       TEXT NOT NULL,
  latencia_ms      INT CHECK (latencia_ms >= 0),
  http_status      INT DEFAULT 200,
  ssl_valido       BOOLEAN DEFAULT true,
  mensaje          TEXT,
  detalles_payload JSONB DEFAULT '{}'::jsonb,
  ip_origen        INET,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE telemetria_eventos IS 'Ingesta en tiempo real del SDK JS v2.1 inyectado en las aplicaciones web.';

-- 2.3 Bitácora Técnica de Incidentes & Historial de Arquitectura
CREATE TABLE IF NOT EXISTS bitacora_incidentes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id         TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  autor               TEXT NOT NULL DEFAULT 'Administrador de Proyectos',
  tipo_causa          TEXT NOT NULL CHECK (tipo_causa IN ('ataque_fuerza_bruta', 'falla_servidor', 'error_humano', 'mantenimiento')),
  via_resolucion      TEXT NOT NULL CHECK (via_resolucion IN ('solucionable_usuario', 'requiere_soporte_servidor')),
  antecedente_texto   TEXT NOT NULL,
  verificacion_ia     TEXT NOT NULL,
  estado              TEXT NOT NULL DEFAULT 'resuelto' CHECK (estado IN ('abierto', 'en_revision', 'resuelto')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- MÓDULO 3: GESTIÓN COMERCIAL & STUDIO (CRM PIPELINE & COTIZACIONES CLP)
-- ============================================================================

-- 3.1 Catálogo de Etapas del Pipeline Comercial CRM
CREATE TABLE IF NOT EXISTS cat_etapa_crm (
  id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo  TEXT NOT NULL UNIQUE,
  nombre  TEXT NOT NULL
);

-- 3.2 Oportunidades y Tratos Comerciales (CRM Deals)
CREATE TABLE IF NOT EXISTS crm_deals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id  UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  proyecto_id      TEXT REFERENCES proyectos(id) ON DELETE SET NULL,
  etapa_id         INT NOT NULL REFERENCES cat_etapa_crm(id),
  titulo           TEXT NOT NULL,
  valor_clp        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (valor_clp >= 0),
  fecha_reunion    DATE,
  meet_link        TEXT,
  notas            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE crm_deals IS 'Embudo comercial de Studio: NUNCA se mezcla con los servidores web de producción.';

-- 3.3 Cotizaciones Formales en Moneda Nacional CLP
CREATE TABLE IF NOT EXISTS cotizaciones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number        TEXT NOT NULL UNIQUE,
  organizacion_id     UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  proyecto_id         TEXT REFERENCES proyectos(id) ON DELETE SET NULL,
  titulo_proyecto     TEXT NOT NULL,
  subtitulo           TEXT,
  resultado_esperado  TEXT,
  servicios_items     JSONB NOT NULL DEFAULT '[]'::jsonb,
  sprints_items       JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_clp           NUMERIC(14,2) NOT NULL CHECK (total_clp >= 0),
  condicion_pago      TEXT NOT NULL DEFAULT '50_50',
  condicion_detalles  TEXT,
  documento_tributario TEXT NOT NULL DEFAULT 'factura' CHECK (documento_tributario IN ('factura', 'boleta_honorarios')),
  plazo_entrega_dias  INT NOT NULL DEFAULT 14,
  dias_validez        INT NOT NULL DEFAULT 15,
  estado              TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4 Evaluaciones Estratégicas (FODA, PESTEL & Viabilidad)
CREATE TABLE IF NOT EXISTS evaluaciones_estrategicas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacion_id     UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
  proyecto_id         TEXT REFERENCES proyectos(id) ON DELETE SET NULL,
  modelo_negocio      TEXT NOT NULL DEFAULT 'b2b_servicios',
  plataforma_actual   TEXT,
  ventas_mensuales_clp NUMERIC(14,2) NOT NULL DEFAULT 0,
  decision_viabilidad TEXT NOT NULL DEFAULT 'go_viable' CHECK (decision_viabilidad IN ('go_viable', 'no_viable', 'requiere_ajuste')),
  razon_viabilidad    TEXT,
  presupuesto_clp     NUMERIC(14,2) NOT NULL DEFAULT 0,
  foda                JSONB NOT NULL DEFAULT '{"fortalezas":[],"oportunidades":[],"debilidades":[],"amenazas":[]}'::jsonb,
  pestel              JSONB NOT NULL DEFAULT '{"politico":"","economico":"","social":"","tecnologico":"","ecologico":"","legal":""}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- MÓDULO 4: CIBERSEGURIDAD, SIEM & MATRIZ CUANTITATIVA ALE
-- ============================================================================

-- 4.1 Catálogos de Ciberseguridad y Severidad
CREATE TABLE IF NOT EXISTS cat_severidad (
  id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo  TEXT NOT NULL UNIQUE,
  nivel   INT NOT NULL UNIQUE CHECK (nivel BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS amenazas (
  id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS cat_estado_riesgo (
  id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo  TEXT NOT NULL UNIQUE
);

-- 4.2 Matriz Cuantitativa ALE (Annualized Loss Expectancy)
-- FÓRMULA OFICIAL DUOC: ALE = SLE (Single Loss Expectancy) * ARO (Annual Rate of Occurrence)
-- Implementada como columna calculada STORED: integridad matemática absoluta y costo computacional cero en lecturas.
CREATE TABLE IF NOT EXISTS riesgos_ale (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id  TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  amenaza_id   INT NOT NULL REFERENCES amenazas(id),
  estado_id    INT NOT NULL REFERENCES cat_estado_riesgo(id),
  sle_clp      NUMERIC(14,2) NOT NULL CHECK (sle_clp >= 0),
  aro_anual    NUMERIC(8,3) NOT NULL CHECK (aro_anual >= 0),
  ale_clp      NUMERIC(18,2) GENERATED ALWAYS AS (sle_clp * aro_anual) STORED,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE riesgos_ale IS 'Matriz Cuantitativa de Riesgos ALE: Calcula automáticamente el impacto financiero proyectado en pesos chilenos.';

-- 4.3 Diagnósticos del CISO (SOC con IA)
CREATE TABLE IF NOT EXISTS ciso_diagnosticos (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id          TEXT NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  puntuacion_seguridad INT NOT NULL CHECK (puntuacion_seguridad BETWEEN 0 AND 100),
  vectores_riesgo      JSONB NOT NULL DEFAULT '[]'::jsonb,
  plan_accion          JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4.4 Feed de Inteligencia de Amenazas Web (Chile)
CREATE TABLE IF NOT EXISTS inteligencia_amenazas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id      TEXT REFERENCES proyectos(id) ON DELETE SET NULL,
  titulo           TEXT NOT NULL,
  tipo_amenaza     TEXT NOT NULL,
  severidad_id     INT NOT NULL REFERENCES cat_severidad(id),
  fuente_origen    TEXT NOT NULL,
  pais_objetivo    TEXT NOT NULL DEFAULT 'Chile',
  descripcion      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- MÓDULO 5: ÍNDICES DE RENDIMIENTO (OPTIMIZACIÓN DE CONSULTAS Y REPORTES)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_proyectos_org           ON proyectos (organizacion_id);
CREATE INDEX IF NOT EXISTS idx_dominios_proyecto       ON dominios (proyecto_id);
CREATE INDEX IF NOT EXISTS idx_telemetria_proj_fecha   ON telemetria_eventos (proyecto_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telemetria_tipo         ON telemetria_eventos (tipo_evento_id);
CREATE INDEX IF NOT EXISTS idx_deals_org               ON crm_deals (organizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_org        ON cotizaciones (organizacion_id);
CREATE INDEX IF NOT EXISTS idx_riesgos_proj            ON riesgos_ale (proyecto_id);

-- ============================================================================
-- MÓDULO 6: POBLACIÓN DE DATOS MAESTROS Y PROYECTOS OFICIALES
-- ============================================================================

-- Catálogos base
INSERT INTO cat_ciclo_vida (codigo) VALUES ('produccion'), ('desarrollo'), ('demo'), ('local') ON CONFLICT DO NOTHING;
INSERT INTO cat_motor_bd (nombre) VALUES ('mysql'), ('postgresql'), ('sqlite'), ('sin_bbdd') ON CONFLICT DO NOTHING;
INSERT INTO cat_tipo_evento_telemetria (codigo) VALUES ('heartbeat'), ('error_js'), ('security_anomaly'), ('incident_note') ON CONFLICT DO NOTHING;
INSERT INTO cat_etapa_crm (codigo, nombre) VALUES 
  ('reunion_agendada', 'Reunión Agendada'),
  ('en_evaluacion', 'En Evaluación'),
  ('propuesta_enviada', 'Propuesta Enviada'),
  ('en_negociacion', 'En Negociación'),
  ('cerrado_ganado', 'Cerrado Ganado'),
  ('en_monitoreo', 'En Monitoreo Activo')
ON CONFLICT DO NOTHING;
INSERT INTO cat_severidad (codigo, nivel) VALUES 
  ('informativa', 1), ('baja', 2), ('media', 3), ('alta', 4), ('critica', 5)
ON CONFLICT DO NOTHING;
INSERT INTO cat_estado_riesgo (codigo) VALUES ('activo'), ('mitigado') ON CONFLICT DO NOTHING;
INSERT INTO amenazas (nombre) VALUES 
  ('Ataque de Fuerza Bruta y Bloqueo cPHulk'),
  ('Inyección SQL / XSS en formularios de cotización'),
  ('Expiración no detectada de Dominio .cl'),
  ('Caída de Conectividad o Handshake SSL TLS 1.3'),
  ('Pérdida de datos por falta de respaldos en cPanel')
ON CONFLICT DO NOTHING;

INSERT INTO proveedores (nombre, tipo) VALUES 
  ('NIC Chile (.cl)', 'dominio'),
  ('TecnoInver Hosting', 'hosting'),
  ('GitHub Inc. (Pages & CDN)', 'hosting'),
  ('Supabase Cloud (PostgreSQL)', 'base_de_datos'),
  ('Google Cloud Platform', 'api')
ON CONFLICT DO NOTHING;

-- 6.1 Organizaciones oficiales
INSERT INTO organizaciones (id, nombre, tipo, rut_dni, email_contacto, telefono_contacto, representante_legal)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'LSC Operations Studio (Tiare Pérez Concha)', 'propia', '20.123.456-7', 'tiare.perezconcha@gmail.com', '+56 9 1234 5678', 'Tiare Pérez Concha'),
  ('a0000000-0000-0000-0000-000000000002', 'CONPI Chile SpA', 'cliente', '76.543.210-K', 'contacto@conpi.cl', '+56 9 8765 4321', 'Representante Autorizado CONPI')
ON CONFLICT (id) DO NOTHING;

-- 6.2 Proyectos Legítimos
INSERT INTO proyectos (
  id, organizacion_id, ciclo_vida_id, nombre, url_produccion, es_proyecto_propio, 
  uptime_pct, latencia_prom_ms, ssl_valido, stack_tecnologico, gsc_property, gsc_conectado, 
  hosting_proveedor, hosting_plan, hosting_vence_at
)
VALUES 
(
  'conpi-app',
  'a0000000-0000-0000-0000-000000000002',
  1,
  'CONPI - Insumos & Repuestos de Carnicería (conpi.cl)',
  'https://conpi.cl',
  false,
  99.85,
  220,
  true,
  '["React 18", "Vite", "Tailwind CSS", "REST API / MySQL"]'::jsonb,
  'sc-domain:conpi.cl',
  true,
  'TecnoInver (cPanel / Apache / MySQL)',
  'Cero New ($15,000 Anual / conpis.cl)',
  '2027-06-19'
),
(
  'adm-proyectos',
  'a0000000-0000-0000-0000-000000000001',
  1,
  'Plataforma Administrador de Proyectos',
  'https://tiareperezconcha.github.io/adm_proyectos/',
  true,
  100.00,
  260,
  true,
  '["React 18", "TypeScript", "Tailwind CSS", "Supabase Cloud"]'::jsonb,
  NULL,
  false,
  'GitHub CDN Global + Supabase Cloud',
  'GitHub Pages Free Tier',
  '2030-01-01'
),
(
  'curriculum-tiare',
  'a0000000-0000-0000-0000-000000000001',
  1,
  'Portfolio & CV Tiare Pérez',
  'https://tiareperezconcha.github.io/curriculum/tiare/',
  true,
  100.00,
  185,
  true,
  '["HTML5", "CSS3", "JavaScript", "GitHub Pages"]'::jsonb,
  'https://tiareperezconcha.github.io/curriculum/tiare/',
  false,
  'GitHub CDN Global',
  'GitHub Pages Free Tier',
  '2030-01-01'
),
(
  'curriculumpage-fernando',
  NULL,
  1,
  'Curriculum Fernando Figueroa',
  'https://tiareperezconcha.github.io/FERNANDO_ALEJANDRO_FIGUEROA_CERDA/',
  false,
  100.00,
  180,
  true,
  '["HTML5", "CSS3", "JavaScript", "GitHub Pages"]'::jsonb,
  NULL,
  false,
  'GitHub CDN Global',
  'GitHub Pages Free Tier',
  '2030-01-01'
)
ON CONFLICT (id) DO UPDATE 
SET hosting_provider = EXCLUDED.hosting_provider,
    hosting_plan = EXCLUDED.hosting_plan,
    hosting_vence_at = EXCLUDED.hosting_vence_at,
    updated_at = now();

-- 6.3 Dominios de conpi-app (1 a Muchos con vencimientos oficiales en NIC Chile)
INSERT INTO dominios (proyecto_id, dominio_nombre, vencimiento, es_principal, redirecciona_a)
VALUES 
  ('conpi-app', 'conpi.cl', '2027-06-19', true, NULL),
  ('conpi-app', 'conpis.cl', '2028-06-05', false, 'https://conpi.cl')
ON CONFLICT (dominio_nombre) DO NOTHING;

-- 6.4 Matriz ALE para conpi-app
INSERT INTO riesgos_ale (proyecto_id, amenaza_id, estado_id, sle_clp, aro_anual)
VALUES 
  ('conpi-app', 1, 1, 450000.00, 3.0),   -- Fuerza bruta / bloqueo cPanel (3 veces al año: ALE = 1.35M)
  ('conpi-app', 2, 1, 1500000.00, 0.5),  -- Inyección SQL (1 vez cada 2 años: ALE = 750k)
  ('conpi-app', 4, 1, 300000.00, 1.0)    -- Caída de Handshake SSL (1 vez al año: ALE = 300k)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MÓDULO 7: POLÍTICAS DE CIBERSEGURIDAD RLS (BLINDAJE EN GITHUB PAGES)
-- ============================================================================

-- Habilitar Row Level Security en todas las tablas
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE dominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados_ssl ENABLE ROW LEVEL SECURITY;
ALTER TABLE bases_datos_proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetria_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitacora_incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones_estrategicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE riesgos_ale ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciso_diagnosticos ENABLE ROW LEVEL SECURITY;

-- 7.1 Telemetría: El cliente web anónimo (SDK sendBeacon) PUEDE insertar eventos de pings
CREATE POLICY p_telemetria_insert_anon ON telemetria_eventos
  FOR INSERT TO anon WITH CHECK (latencia_ms >= 0);

-- 7.2 Telemetría: Lectura pública de métricas de rendimiento
CREATE POLICY p_telemetria_select_all ON telemetria_eventos
  FOR SELECT TO anon, authenticated USING (true);

-- 7.3 Proyectos y Dominios: Lectura permitida a la aplicación
CREATE POLICY p_proyectos_select ON proyectos
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY p_dominios_select ON dominios
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY p_bitacora_select ON bitacora_incidentes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY p_bitacora_insert ON bitacora_incidentes
  FOR INSERT TO anon, authenticated WITH CHECK (length(antecedente_texto) > 0);

CREATE POLICY p_crm_deals_select ON crm_deals
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY p_cotizaciones_select ON cotizaciones
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY p_riesgos_select ON riesgos_ale
  FOR SELECT TO anon, authenticated USING (true);

COMMIT;

-- Consulta de verificación
SELECT p.id, p.nombre, p.url_produccion, p.hosting_proveedor, p.hosting_plan, p.hosting_vence_at,
       count(d.id) AS dominios_asociados
FROM proyectos p
LEFT JOIN dominios d ON d.proyecto_id = p.id
GROUP BY p.id, p.nombre, p.url_produccion, p.hosting_proveedor, p.hosting_plan, p.hosting_vence_at;
