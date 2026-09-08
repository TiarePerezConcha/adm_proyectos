# LSC Admin & Studio | Plataforma Privada de Gestión de Proyectos

Plataforma privada integral para la administración y automatización de proyectos digitales, métricas de posicionamiento SEO en Chile (Google Search Console), agendamientos con Google Calendar, evaluación técnica/estratégica (FODA/PESTEL), cotizaciones express con metodologías ágiles, CRM reactivo, sistema de branding en 6 etapas con logos vectoriales SVG interactivos, maquetas de alta fidelidad y módulo de ciberseguridad preventiva (Mini-SOC con cálculo ALE).

---

## 🚀 Despliegue 100% Gratuito en GitHub Pages

Esta plataforma está desarrollada como una Single Page Application (SPA) en **React 18 + Vite + Tailwind CSS**. Opera completamente del lado del cliente (en el navegador), por lo que **no requiere ningún servidor de pago ni backend mensual**.

### Pasos para publicar en GitHub Pages:

1. **Crear repositorio en GitHub**:
   - Crea un repositorio nuevo en [GitHub](https://github.com/new) (puede ser público o privado).

2. **Inicializar y subir el código**:
   ```bash
   git init
   git add .
   git commit -m "feat: plataforma LSC Admin & Studio completa"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git push -u origin main
   ```

3. **Habilitar GitHub Pages**:
   - En tu repositorio de GitHub, ve a **Settings** &rarr; **Pages**.
   - En **Build and deployment** &rarr; **Source**, selecciona **GitHub Actions**.
   - El archivo incluido `.github/workflows/deploy.yml` compilará y publicará la plataforma automáticamente en `https://TU_USUARIO.github.io/TU_REPOSITORIO/`.

---

## 💾 Configuración de Base de Datos Gratuita (Supabase / Firebase / Cloudflare D1)

La plataforma guarda todo el estado localmente en el navegador (`localStorage`) con respaldo total exportable e importable en JSON. Si deseas conectar una base de datos externa gratuita:

### Opción 1: Supabase Free Tier (PostgreSQL) + Mecanismo Anti-Pausa
Supabase ofrece una base de datos PostgreSQL generosa y 100% gratuita. Sin embargo, si un proyecto no tiene consultas por 7 días consecutivos, Supabase lo pausa.

**Cómo activar el Anti-Pausa para que nunca se deshabilite:**
1. Crea tu cuenta gratuita en [supabase.com](https://supabase.com) y obtén tu `Project URL` y `Anon Key`.
2. En la sección **Studio &rarr; Configuración & APIs** de esta plataforma, ingresa tu URL de Supabase.
3. El panel incluye un disparador Keep-Alive que ejecuta una consulta cada 3 días.
4. Para automatizar el ping desde la nube sin necesidad de tener tu navegador abierto, puedes usar un monitor gratuito de [Cron-Job.org](https://cron-job.org) o un GitHub Action programado:
   - Configura un trabajo GET o POST cada 3 días a: `https://TU_PROYECTO.supabase.co/rest/v1/` con la cabecera `apikey: TU_ANON_KEY`.

### Opción 2: Firebase Firestore (Capa Gratuita)
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Habilita Firestore Database en modo producción con reglas de lectura/escritura seguras.
3. No requiere pings de mantenimiento y es permanente.

### Opción 3: Cloudflare D1 (SQL Serverless Gratuito)
1. Habilita una base de datos D1 gratuita en el panel de Cloudflare Workers.
2. Cero costo de almacenamiento para proyectos medianos.

---

## 🤖 Configuración de Inteligencia Artificial (Ecosistema Multi-IA)

La plataforma soporta **Google Gemini**, **DeepSeek**, **Groq**, **Mistral AI** y **OpenRouter**:

1. Ingresa a la pestaña **Configuración & APIs** en Studio.
2. Puedes ingresar ambas API keys simultáneamente:
   - **Google Gemini**: Clave gratuita desde [Google AI Studio](https://aistudio.google.com/).
   - **DeepSeek**: Clave desde [platform.deepseek.com](https://platform.deepseek.com/).
   - **Groq**: Clave gratuita ultrarrápida (Llama 3.3 70B) desde [console.groq.com](https://console.groq.com/).
3. **Modo Zero-Config**: Si no ingresas ninguna clave, la plataforma sigue funcionando perfectamente gracias a su motor heurístico local pre-cargado.

---

## 🛡️ SDK de Monitoreo & Mini-SOC para Proyectos Levantados

Para auditar tus sitios web ya entregados (Shopify, WordPress, Next.js, HTML) y medir Uptime, latencia y eventos de seguridad:

1. Ve a **LSC Admin &rarr; Monitor de Proyectos**.
2. Copia el snippet universal de 1.5 KB e insértalo antes de `</body>` en el sitio del cliente:
   ```html
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
           sslValid: window.location.protocol === 'https:',
           timestamp: new Date().toISOString()
         };
         if (navigator.sendBeacon) navigator.sendBeacon(config.endpoint, JSON.stringify(payload));
       });
     })({ projectId: 'ID_DEL_PROYECTO', endpoint: 'https://lsc-telemetry.workers.dev/api/v1' });
   </script>
   ```

---

## 🛠️ Ejecución Local

Para probar o continuar desarrollando en tu máquina:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar el build de producción
npm run preview
```
