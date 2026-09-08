# Plan Maestro de Implementación: "LSC Admin & Studio"

Plataforma integral privada para la gestión, cotización, branding, monitoreo telemétrico, ciberseguridad preventiva (Mini-SOC) y maquetación de proyectos digitales, optimizada para **GitHub Pages (100% gratuita, SPA en el navegador con React + Vite + Tailwind)**.

---

## 1. Novedades y Mejoras Incorporadas

1. **Ecosistema Multi-IA para Maximizar Tokens Gratuitos**:
   - Integración simultánea de **Google Gemini** (1.5 / 2.0 Flash) y **DeepSeek** (V3 / R1).
   - Soporte adicional para proveedores con capas gratuitas de alta velocidad: **Groq** (Llama 3.3 70B sin costo), **Mistral AI** y **OpenRouter** (modelos free).
   - Enrutamiento inteligente con conmutación automática en caso de agotamiento de cuotas y motor heurístico local de respaldo (Zero-Config).

2. **Nuevo Módulo: Ciberseguridad Preventiva & Mini-SOC con IA**:
   - Diseñado para **supervisar y diagnosticar el estado de tus propios proyectos**, sin requerir experiencia avanzada previa.
   - **Inventario de Activos Críticos por Proyecto**: Registro de Dominio, DNS, Hosting/VPS, Base de Datos, Pasarela de Pago (Webpay/MercadoPago/Stripe), Panel Admin y Credenciales.
   - **Matriz de Riesgos & Priorización de Amenazas**: Clasificación de vulnerabilidades según impacto y probabilidad.
   - **Cálculo Cuantitativo de Riesgo (ALE = SLE × ARO)**:
     - **SLE (Single Loss Expectancy)**: Pérdida económica estimada por cada ocurrencia en CLP.
     - **ARO (Annualized Rate of Occurrence)**: Tasa anual estimada de probabilidad.
     - **ALE (Annualized Loss Expectancy)**: Pérdida anual esperada en CLP para fundamentar decisiones de protección.
   - **Playbooks de Respuesta a Incidentes Asistidos por IA**: Guías paso a paso generadas dinámicamente ante incidentes (ataques de fuerza bruta, caídas de servidor, fallas en pasarelas de pago, bloqueo de BBDD).
   - **Mecanismo Anti-Pausa para Supabase**: Cron/ping automático cada 3 días para evitar que las bases de datos gratuitas de Supabase se desactiven por inactividad.

3. **API y SDK de Monitoreo Telemétrico para Proyectos Levantaos**:
   - Script universal ligero (1.5 KB) para insertar en proyectos clientes existentes (Shopify, WordPress, Next.js, HTML) que reporta uptime, latencia, errores JavaScript y alertas de seguridad (fallos 401/403 masivos, problemas de SSL).

4. **Análisis Estratégico Pre-Desarrollo (FODA, PESTEL y Viabilidad Go/No-Go)**:
   - Módulo para evaluar si un proyecto es técnicamente viable y comercialmente conveniente antes de comprometer tiempo y emitir cotización.

5. **Infraestructura y Costos del Mercado Chileno**:
   - **NIC Chile**: Actualizado al valor estándar exacto de **$9.990 CLP/año**.
   - **Hosting**: Hosting local en Chile con **TecnoInver** ($30.000 CLP/año), además de Vultr, Hetzner, AWS y Cloudflare Pages (gratuito).
   - **E-Commerce & CMS**: Planes Shopify (Basic, Shopify, Advanced), GoDaddy, WordPress/WooCommerce.
   - **Bases de Datos Gratuitas / Serverless**: Supabase (con keep-alive), Firebase Firestore, Neon Serverless Postgres, Turso (libSQL) y Cloudflare D1.

6. **Cotizador Express con Pautas Ágiles y Condición 100% Anticipada**:
   - Regla comercial predeterminada: **100% anticipado para iniciar el desarrollo** (ajustable en casos excepcionales o proyectos de gran envergadura a 50/50 o hitos).
   - Estructuración ágil en Sprints con entregables y criterios de aceptación (*Definition of Done*).
   - Ciclo de vida: *Borrador $\rightarrow$ En Revisión $\rightarrow$ Negociación $\rightarrow$ Aprobada $\rightarrow$ En Desarrollo $\rightarrow$ Entregada*.

7. **CRM Comercial Unificado y Reactivo**:
   - Reemplazo de etapas basadas en costos por un flujo centrado en el **ciclo de vida del cliente**:
     1. *Reunión Agendada* (automático por Calendar/web)
     2. *En Evaluación & Viabilidad* (automático al iniciar diagnóstico FODA/PESTEL)
     3. *Propuesta Enviada* (automático al generar y emitir cotización)
     4. *En Negociación / Ajustes* (solicitudes de cambio del cliente)
     5. *Proyecto Aprobado / En Desarrollo* (aprobación y paso a Brief UX)
     6. *Entregado / En Monitoreo & SOC* (despliegue final con telemetría activa)

8. **Generador de Maquetas Dinámico y Modular por Rubro**:
   - Plantillas adaptativas para **E-Commerce Moda/Retail** (con tallas/colores), **Gestión Interna / Backoffice / ERP** (stock e inventario), **B2B Corporativo** y **SaaS**, con interruptores para activar/desactivar módulos según el alcance pactado.

---

## 2. Flujo Operativo y Módulos en Texto Estructurado

Para máxima legibilidad en cualquier dispositivo, la arquitectura se divide en dos grandes entornos sincronizados:

### Entorno A: LSC ADMIN (Operaciones, Posicionamiento y Seguridad - Modo Oscuro)

- **Módulo 1: Dashboard Ejecutivo & Métricas IA**
  - Contadores en tiempo real: Clientes activos, reuniones del mes, cotizaciones emitidas, proyectos en desarrollo y facturación total en CLP.
  - Funnel de conversión por tipo de tecnología (Shopify, WooCommerce, Web + IA, Custom).
  - Historial de consultas recientes procesadas con los motores de IA.

- **Módulo 2: Google Search Console & SEO Chile**
  - Métricas de rendimiento: Clics, impresiones, CTR promedio y posición media.
  - Tabla de palabras clave chilenas con posicionamiento en tiempo real (ej. *agencia shopify chile*, *diseño ux ui e-commerce*).
  - Filtro por períodos (7, 28, 90 días), buscador de queries y ordenamiento por clics/posiciones.

- **Módulo 3: Google Calendar & Agendamiento Web**
  - Calendario interactivo con citas provenientes del sitio web personal.
  - Enlaces directos a Google Meet y horarios disponibles.
  - **Sincronización**: Toda nueva cita agendada se inserta automáticamente en la etapa *Reunión Agendada* del CRM.

- **Módulo 4: Monitor de Proyectos & Telemetría (Proyectos en Producción)**
  - Listado de proyectos activos de clientes.
  - Métricas de rendimiento: Uptime en tiempo real, latencia (ms), estado de certificado SSL y errores JavaScript reportados.
  - **SDK Universal de Telemetría**: Código para incrustar en sitios de clientes que reporta automáticamente eventos y métricas a tu plataforma.

- **Módulo 5: Ciberseguridad Preventiva & Mini-SOC Asistido por IA**
  - **Inventario de Activos Críticos**: Registro estructurado por proyecto (Dominio, Servidor, BBDD, Pasarela de Pago Webpay, API Keys).
  - **Matriz de Riesgos**: Clasificación de amenazas (fuga de datos, inyección SQL, fuerza bruta, caída de pasarela, corte de SSL).
  - **Cálculo Financiero ALE = SLE × ARO**: Cálculo de pérdida anual estimada en CLP para evaluar costo-beneficio de medidas preventivas.
  - **Playbooks de Respuesta a Incidentes con IA**: Protocolos ejecutables paso a paso ante emergencias técnicas o ataques.
  - **Mecanismo Anti-Pausa Supabase**: Herramienta que genera un ping/cron programado cada 3 días para mantener bases de datos gratuitas activas.

- **Módulo 6: FAQs & Base de Conocimiento**
  - Repositorio de preguntas frecuentes para atención de prospectos y respuestas rápidas comerciales.

---

### Entorno B: STUDIO (Onboarding, Cotizaciones, Branding y Diseño - Modo Claro Editorial)

- **Módulo 1: Onboarding & Evaluación de Viabilidad**
  - Paso 1: Contacto del cliente (empresa, rubro, país, origen del lead).
  - Paso 2: Análisis Estratégico: Matrices **FODA**, **PESTEL** y evaluación Go/No-Go asistida por IA para determinar si el proyecto es conveniente y desarrollable.
  - Paso 3: Infraestructura y Tecnologías:
    - Dominio: NIC Chile ($9.990 CLP/año) o internacionales (.com en GoDaddy/Namecheap).
    - Hosting: TecnoInver ($30.000 CLP/año en Chile), Cloudflare Pages (gratis), VPS Vultr/Hetzner, o plataformas SaaS (Shopify Basic/Advanced).
    - Bases de Datos: Supabase (con script anti-pausa), Firebase Firestore, Neon Postgres, Turso o Cloudflare D1.
  - Paso 4: Scoring Multidimensional del Prospecto (Madurez de negocio, claridad de alcance, viabilidad técnica y presupuesto).

- **Módulo 2: Cotizador Express con Pautas Ágiles**
  - Autocompletado directo desde el CRM o la evaluación previa.
  - Definición del valor transformador ("Qué logrará el cliente") optimizado con IA.
  - Catálogo de servicios modulares con sugerencias inteligentes.
  - **Condiciones Comerciales**:
    - **100% anticipado para iniciar el desarrollo** (predeterminado).
    - Documento tributario: Boleta de Honorarios o Factura (con desglose de IVA del 19%).
    - Plazo de entrega y validez de la oferta.
  - **Plan de Trabajo en Sprints Ágiles**: Desglose con hitos claros (Sprint 1 a 4) y criterios de *Definition of Done (DoD)*.
  - Exportador formal a **PDF estilizado con membrete** y generador de correo ejecutivo listo para enviar.

- **Módulo 3: CRM Comercial Reactivo (Kanban Centralizado)**
  - 6 Etapas del Ciclo de Vida:
    1. *Reunión Agendada*
    2. *En Evaluación & Viabilidad*
    3. *Propuesta Enviada*
    4. *En Negociación / Ajustes*
    5. *Proyecto Aprobado / En Desarrollo*
    6. *Entregado / En Monitoreo & SOC*
  - Las tarjetas avanzan automáticamente según las acciones realizadas en los demás módulos, con opción de arrastre manual complementario.

- **Módulo 4: Sistema de Creación de Marca con IA (6 Etapas)**
  - Etapa 1: Discovery (Misión, visión, valores, historia, públicos, whitespace competitivo con IA y análisis semiótico en Chile).
  - Etapa 2: Estrategia (Arquetipo de marca, Positioning Statement, Propuesta de valor, **Prisma de Kapferer en 6 facetas**).
  - Etapa 3: Identidad Verbal (Taglines persuasivos, tono de voz y manifiesto de marca).
  - Etapa 4: Logos con IA (Generador interactivo vectorial SVG y tipográfico, 3 iteraciones con selección progresiva, explicación de esencia y selector de logo ganador o subida de logo propio).
  - Etapa 5: Sistema Visual (Paleta de colores HEX con validador de accesibilidad **WCAG 2.1 AA** en tiempo real, jerarquía tipográfica Playfair Display / Inter y escalas H1-H6).
  - Etapa 6: Aplicaciones & Entregables (Mockups en tiempo real de tarjetas de visita, hojas membretadas, firmas de email; descarga de Brand Book PDF y paquete ZIP con assets).

- **Módulo 5: Proyectos & Brief UX**
  - Registro de objetivos, KPIs de usabilidad, metas de experiencia y creación de **Buyer Personas con IA** (necesidades, dolores y hábitos de compra).

- **Módulo 6: Design System**
  - Importación en un clic desde el módulo de Branding (colores, tipografía y principios de diseño).
  - Exportador de tokens de diseño a variables CSS y Tailwind listas para producción.

- **Módulo 7: Maquetas Interactivas Modulares (Desktop / Mobile)**
  - Selector de Viewport conmutativo: Escritorio (1440px) y Móvil (375px).
  - **Adaptación por Rubro y Módulos Configurables**:
    - *E-Commerce*: Homepage con Bestsellers, Catálogo con filtros, Ficha de Producto con selector de tallas y colores, Carrito con cálculo de envíos a regiones de Chile, Checkout seguro.
    - *Gestión Interna / Backoffice*: Dashboard de control de Stock e Inventario, lista de órdenes, alertas de reposición y gestión de clientes.
    - *B2B / Servicios*: Landing Page corporativa, cotizador interactivo y formulario calificado.
    - *SaaS*: Aplicación con panel de usuario, métricas y tablas dinámicas.
  - Interruptores para agregar o quitar secciones según el requerimiento exacto del cliente.

- **Módulo 8: Configuración & APIs Multi-IA**
  - Conexión de API Keys: **Google Gemini**, **DeepSeek**, **Groq**, **Mistral** y **OpenRouter**.
  - Selector de modelo preferido por tarea y modo de balanceo automático.
  - Parámetros de tarifas locales (NIC Chile $9.990, TecnoInver $30.000, hosting cloud).
  - Generador de Keep-Alive para bases de datos gratuitas (Supabase).
  - Respaldo total: Exportar / Importar base de datos completa en JSON (almacenamiento en LocalStorage 100% privado y sin servidor).

---

## 3. Esquema Técnico del SDK de Monitoreo & Mini-SOC

Para los proyectos ya levantados o nuevos, la plataforma proporcionará el siguiente snippet universal ligero para insertar antes del cierre de `</body>`:

```html
<!-- LSC Telemetry & Security Agent v1.0 -->
<script>
  (function(config) {
    const start = performance.now();
    window.addEventListener('load', function() {
      const timing = performance.timing;
      const payload = {
        projectId: config.projectId,
        event: 'heartbeat',
        url: window.location.href,
        loadTimeMs: Math.round(performance.now() - start),
        dnsTimeMs: timing.domainLookupEnd - timing.domainLookupStart,
        tcpTimeMs: timing.connectEnd - timing.connectStart,
        sslValid: window.location.protocol === 'https:',
        timestamp: new Date().toISOString()
      };
      if (navigator.sendBeacon) {
        navigator.sendBeacon(config.endpoint, JSON.stringify(payload));
      } else {
        fetch(config.endpoint, { method: 'POST', body: JSON.stringify(payload), mode: 'no-cors' });
      }
    });

    // Captura de errores no controlados y anomalías
    window.addEventListener('error', function(e) {
      const errorPayload = {
        projectId: config.projectId,
        event: 'security_anomaly',
        type: 'javascript_error',
        message: e.message,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      if (navigator.sendBeacon) navigator.sendBeacon(config.endpoint, JSON.stringify(errorPayload));
    });
  })({
    projectId: 'MI_PROYECTO_ID',
    endpoint: 'https://mi-endpoint-o-webhook.com/api/telemetry'
  });
</script>
```

---

## 4. Plan de Construcción e Implementación

1. **Estructura Base del Proyecto**:
   - Inicializar React 18 + Vite + Tailwind CSS + Lucide Icons directamente en `d:\tiare\proyectos\administrador de proyectos`.
   - Configuración `vite.config.ts` con `base: './'` para despliegue automático en GitHub Pages.
   - Configuración de flujo de GitHub Actions (`.github/workflows/deploy.yml`).

2. **Capa de Almacenamiento Reactiva**:
   - Estado centralizado con sincronización en `localStorage`.
   - Datos semilla listos para demostración inmediata (proyectos como *MBJeans*, clientes, cotizaciones y métricas de SEO reales).

3. **Construcción del Entorno LSC ADMIN (Dark Mode)**:
   - Dashboard de Métricas, SEO Google Search Console (Chile), Google Calendar, Monitor de Proyectos y el **Mini-SOC con cálculo ALE (SLE × ARO)** e inventario de activos.

4. **Construcción del Entorno STUDIO (Light Mode Editorial)**:
   - Onboarding con matrices FODA y PESTEL, cotizador express con desglose ágil y exportación a PDF.
   - CRM unificado reactivo.
   - Sistema de Branding de 6 fases con generador SVG de logos, análisis WCAG y mockups en vivo.
   - Brief UX, Design System con tokens CSS y Maquetas Modulares adaptables por rubro (E-commerce con tallas, Backoffice/Stock, B2B, SaaS).

5. **Construcción del Módulo de Configuración Multi-IA**:
   - Soporte para Gemini, DeepSeek, Groq, Mistral y OpenRouter con llamadas HTTPS directas seguras y generador heurístico local.
   - Generador keep-alive para Supabase.

6. **Verificación & Pruebas Finales**:
   - Compilación completa de producción (`npm run build`), pruebas de exportación a PDF, responsividad y validación de flujos.
