# 🚀 GUÍA DE PUESTA EN MARCHA Y CONFIGURACIÓN EXTERNA

## 1. Despliegue en GitHub Pages

Tu código ya se encuentra sincronizado en la rama main de tu repositorio:
🔗 Repositorio: https://github.com/TiarePerezConcha/adm_proyectos.git

### Pasos para habilitar la URL pública en GitHub Pages:
1. Entra en tu repositorio: https://github.com/TiarePerezConcha/adm_proyectos/settings/pages
2. En la barra lateral izquierda, ve a Settings -> Pages.
3. En la sección Build and deployment:
   - En Source, selecciona: GitHub Actions.
4. ¡Listo! El workflow automático .github/workflows/deploy.yml ya se ejecutará y compilará la aplicación.
5. Tu enlace público oficial de acceso será:
   👉 URL GitHub Pages: https://tiareperezconcha.github.io/adm_proyectos/

---

## 2. Base de Datos Supabase (cvfybrtblxzpawnxqsnd)

Tu proyecto de Supabase ya está creado en: https://supabase.com/dashboard/project/cvfybrtblxzpawnxqsnd

### Paso a paso para crear las tablas y estructura:
1. Abre tu panel de Supabase: https://supabase.com/dashboard/project/cvfybrtblxzpawnxqsnd/sql/new
2. Abre el archivo local supabase_schema.sql que hemos preparado en tu proyecto.
3. Copia todo su contenido y pégalo en el editor SQL de Supabase.
4. Presiona el botón verde Run.
5. Las tablas creadas serán:
   - telemetry_logs: Registra visitas, conversiones, tiempos de carga y errores JS de tus sitios cliente.
   - proyectos_status: Registra el estado de salud, uptime y último heartbeat.
   - crm_deals: Sincronización en la nube de tus prospectos y cotizaciones.
   - keep_alive_pings: Pings automáticos para mantener Supabase activo permanentemente.

---

## 3. Configuración en cron-job.org (Keep-Alive Anti-Pausa)

Para evitar que Supabase congele o pause tu base de datos gratuita tras 7 días de inactividad, se utiliza el servicio gratuito de cron-job.org:

### Configuración exacta en https://console.cron-job.org/jobs/create :
1. Title: Supabase Keep-Alive Anti-Pausa cvfybrtblxzpawnxqsnd
2. URL:
   https://cvfybrtblxzpawnxqsnd.supabase.co/rest/v1/keep_alive_pings?select=id&limit=1
3. Execution schedule:
   - Selecciona: Every 3 days (o cron expression: 0 0 */3 * *)
4. Request Method: GET
5. Headers (Request Headers):
   Agrega estos 2 encabezados (obtén tu anon key pública en Project Settings -> API en Supabase):
   - Header 1:
     - Name: apikey
     - Value: [TU_ANON_PUBLIC_KEY]
   - Header 2:
     - Name: Authorization
     - Value: Bearer [TU_ANON_PUBLIC_KEY]
6. Haz clic en Create Job.
7. Resultado: Tu proyecto recibirá una petición HTTP cada 3 días en segundo plano, manteniéndose activo 24/7 de forma 100% gratuita.

---

## 4. Conexión de Modelos de Inteligencia Artificial (Multi-IA)

La plataforma cuenta con un orquestador híbrido con fallback inteligente. Si no tienes claves o se acaban los tokens, funciona sin interrupciones con heurística local en español chileno. Para activar los modelos en la nube:

### A) Google Gemini (Recomendado - Gratuito)
1. Ve a Google AI Studio: https://aistudio.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google y haz clic en Create API Key.
3. Copia tu clave (empieza con AIzaSy...).
4. En tu plataforma, ve a Studio -> Configuración (icono de engranaje).
5. Pégala en el campo Gemini API Key y haz clic en Guardar Configuración.

### B) DeepSeek
1. Entra en DeepSeek Platform: https://platform.deepseek.com/
2. En la sección API Keys, genera una clave sk-...
3. Pégala en Studio -> Configuración -> DeepSeek API Key.

### C) Groq (Ultra rápido y gratuito)
1. Entra en Groq Console: https://console.groq.com/keys
2. Haz clic en Create API Key y copia gsk_...
3. Pégala en Studio -> Configuración -> Groq API Key.

---

## 5. Integración del Monitor y Mini-SOC en Proyectos Externos Futuros

Cuando tengas clientes o sitios propios construidos en cualquier tecnología (Shopify, WordPress, Next.js, HTML), solo debes insertar este script ligero (1.5 KB) antes de cerrar la etiqueta </body>:

```html
<!-- Telemetría & Mini-SOC LSC -->
<script>
  (function() {
    var ENDPOINT = 'https://cvfybrtblxzpawnxqsnd.supabase.co/rest/v1/telemetry_logs';
    var API_KEY = 'TU_ANON_PUBLIC_KEY'; // Reemplazar por tu clave anon de Supabase
    var PROJECT_ID = 'PROYECTO_SLUG'; // Ejemplo: 'mi-tienda-shopify'

    function sendEvent(type, metadata) {
      if (!API_KEY || API_KEY.indexOf('TU_') === 0) return;
      var payload = {
        project_id: PROJECT_ID,
        event_type: type,
        url: window.location.href,
        user_agent: navigator.userAgent,
        metadata: metadata || {}
      };
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(payload)], {type: 'application/json'}));
      } else {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': API_KEY, 'Authorization': 'Bearer ' + API_KEY },
          body: JSON.stringify(payload)
        }).catch(function(){});
      }
    }

    // Ping al cargar página
    window.addEventListener('load', function() {
      var perf = window.performance ? Math.round(performance.now()) : 0;
      sendEvent('page_view', { load_time_ms: perf });
    });

    // Monitoreo SOC: Detección de errores JS
    window.addEventListener('error', function(e) {
      sendEvent('js_error', { message: e.message, filename: e.filename, lineno: e.lineno });
    });
  })();
</script>
```
