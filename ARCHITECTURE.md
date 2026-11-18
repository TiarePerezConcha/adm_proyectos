# ARCHITECTURE.md — Especificación Técnica y Reglas de Seguridad (`adm_proyectos`)

## 1. Contexto y Objetivo del Sistema
`adm_proyectos` es una plataforma de gestión de proyectos, monitoreo de telemetría (RUM), Mini-SOC/SIEM y automatización de productividad (Google Calendar, Google Meet, Gmail y Multi-LLM).
El sistema sigue un diseño **Zero-Trust Frontend** y **BYOB (Bring Your Own Backend)**:
- El frontend es estático (desplegado en GitHub Pages) y 100% agnóstico a la base de datos.
- Cualquier tercero que clone este repositorio debe poder desplegar su propia instancia aislada configurando únicamente sus variables de entorno, sin tener conexión alguna con la infraestructura del autor original.

---

## 2. Estructura del Repositorio

```text
adm_proyectos/
├── ARCHITECTURE.md            # Este documento (fuente de verdad para desarrollo e IA)
├── frontend/                  # Compilado estático para GitHub Pages
│   ├── .env.example           # VITE_API_BASE_URL=http://localhost:8787/api/v1
│   └── src/
│       ├── api/               # Cliente HTTP tipado (fetch wrapper + manejo de JWT)
│       ├── types/             # Interfaces DTO (nunca tipos crudos de base de datos)
│       └── modules/           # Proyectos, Mini-SOC, Telemetría, Agenda/Meet
│
└── backend/                   # Capa intermedia BFF (Hono + TypeScript + Zod)
    ├── .env.example           # DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_SECRET, JWT_SECRET
    └── src/
        ├── middlewares/       # auth.ts (JWT + owner_id), rateLimit.ts, cors.ts
        ├── schemas/           # Validadores Zod de entrada/salida
        ├── services/          # Lógica de negocio, Google OAuth2 (Calendar/Meet), Multi-LLM
        └── routes/            # /auth, /projects, /telemetry, /soc, /integrations
```

---

## 3. Stack Tecnológico Oficial
- **Frontend (Vista / UI):** React + TypeScript + Vite + Tailwind CSS. Alojado en GitHub Pages o servidor web estático.
- **Capa Intermedia (BFF / API Gateway):** **Hono** con TypeScript (compatible con Cloudflare Workers / Node.js).
- **Base de Datos y Auth:** PostgreSQL en Supabase (acceso REST público desactivado; acceso exclusivo vía capa intermedia mediante `SUPABASE_SERVICE_ROLE_KEY`).
- **Integraciones Externas:** Google Workspace APIs (Calendar, Meet, Gmail) y proveedores LLM (Gemini, Groq, GitHub Models, OpenRouter, SambaNova).

---

## 4. Reglas Estrictas de Seguridad (Inquebrantables para Asistentes y Desarrolladores)

### Al trabajar en `frontend/`:
1. **Prohibición de acceso directo a BBDD en Frontend:**
   - El frontend **NO** debe instalar ni importar `@supabase/supabase-js` para consultar tablas (`.from().select()`).
   - El frontend **NO** debe contener URLs de base de datos, nombres de tablas ni llaves (`anon` o `service_role`) hardcodeadas.
   - Toda comunicación del frontend se realiza exclusivamente vía HTTP/REST hacia `import.meta.env.VITE_API_BASE_URL` usando DTOs (Data Transfer Objects) limpios.
2. **Aislamiento de Secretos:**
   - En el frontend no se guardan tokens de Google, service accounts ni llaves privadas de IA.
   - `VITE_API_BASE_URL` se inyecta en tiempo de compilación mediante variables de entorno o GitHub Actions Secrets.

### Al trabajar en `backend/`:
1. **Validación Estricta con Zod:**
   - Cada endpoint debe validar el payload de entrada y la respuesta con esquemas Zod antes de procesar cualquier dato.
2. **Multi-Tenancy y Aislamiento por `owner_id`:**
   - Todas las tablas de negocio en PostgreSQL deben incluir `owner_id UUID NOT NULL` vinculado al usuario autenticado.
   - El middleware de autenticación (`auth.ts`) valida el JWT en cada petición e inyecta `owner_id` en todas las consultas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`).
   - Ningún usuario puede consultar, modificar o eliminar registros que no le pertenezcan.
3. **Mapeo a DTOs Seguros:**
   - Nunca retornar registros crudos de la base de datos sin mapearlos a un DTO seguro que omita campos internos o sensibles.
4. **Borrado Real y Consistencia:**
   - Las operaciones `DELETE` deben ejecutar eliminación física o filtrado estricto (`deleted_at IS NULL`), retornando `200 OK` para invalidar de inmediato el estado en el cliente.
5. **Ingesta de Telemetría Pública (Agente RUM / SDK JS):**
   - El endpoint `POST /api/v1/telemetry/ingest` es el único endpoint público sin JWT de administrador.
   - Debe implementar **Rate Limiting**, validación estricta con Zod y sanitización de payload antes de insertar en PostgreSQL.

---

## 5. Diagrama de Flujo de Datos

```text
[Sitios Monitoreados (RUM JS)] ──(POST /telemetry/ingest)──┐
                                                           ▼
[Frontend GitHub Pages] ──(HTTPS + Bearer JWT)──► [BFF / API Gateway (Hono + TS)]
  • React + Vite + TS                              • Auth Middleware (Valida JWT + owner_id)
  • Solo conoce VITE_API_BASE_URL                  • Zod Validation & Rate Limiter
  • Cero secretos / Cero SDK BBDD                  • DTO Mapper (Oculta esquema real)
                                                           │
                       ┌───────────────────────────────────┴───────────────────────────────────┐
                       ▼                                                                       ▼
        [PostgreSQL / Supabase]                                                [APIs Externas (Server-to-Server)]
        • Acceso público REST bloqueado                                        • Google Calendar & Meet (OAuth2)
        • Tablas normalizadas 3FN + RLS                                        • Gmail & Proveedores LLM
```

---

## 6. Instrucciones de Ejecución para Asistentes de Código
Al generar o modificar código en este repositorio:
1. Verifica si el archivo pertenece a `frontend/` o `backend/`.
2. Si trabajas en `frontend/`, nunca expongas lógica de negocio sensible ni consultas SQL/Supabase; consume únicamente los endpoints definidos en `backend/src/routes/`.
3. Si trabajas en `backend/`, valida siempre el payload con Zod, verifica el `owner_id` del usuario autenticado y nunca devuelvas registros crudos de la base de datos sin mapearlos a un DTO seguro.
