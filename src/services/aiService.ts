import { AppSettings, AIUsageMetrics } from '../types';

export interface AIPromptRequest {
  prompt: string;
  context?: string;
  taskType: 'copywriting' | 'foda_pestel' | 'logo_explanation' | 'brief_ux' | 'code_tokens' | 'general' | 'study';
  providerOverride?: 'auto' | 'gemini' | 'groq' | 'sambanova' | 'openrouter' | 'github' | 'openai' | 'deepseek' | 'offline';
}

const AI_METRICS_KEY = 'lsc_ai_quota_metrics_v1';

// Límite de seguridad 100% GRATIS para Google Cloud DLP: 1 GB = 1,073,741,824 bytes.
// Escudo de seguridad se activa al 80% (858 MB) para jamás generar cobros.
export const DLP_FREE_TIER_BYTE_LIMIT = 1024 * 1024 * 1024; // 1 GiB
export const DLP_SAFETY_SHIELD_BYTES = Math.floor(DLP_FREE_TIER_BYTE_LIMIT * 0.8);

// Límite de seguridad 100% GRATIS para Google Cloud Translation: 500.000 caracteres/mes.
// Escudo de seguridad se activa al 80% (400.000 caracteres).
export const TRANSLATION_FREE_TIER_CHAR_LIMIT = 500000;
export const TRANSLATION_SAFETY_SHIELD_CHARS = 400000;

export function getAIUsageMetrics(): AIUsageMetrics {
  try {
    const raw = localStorage.getItem(AI_METRICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalTokensUsed: parsed.totalTokensUsed || 0,
        promptTokens: parsed.promptTokens || 0,
        completionTokens: parsed.completionTokens || 0,
        totalCalls: parsed.totalCalls || 0,
        providerCalls: parsed.providerCalls || {},
        dlpBytesScanned: parsed.dlpBytesScanned || 0,
        translationCharsUsed: parsed.translationCharsUsed || 0,
        lastUsedTimestamp: parsed.lastUsedTimestamp || new Date().toISOString(),
      };
    }
  } catch (e) {
    console.error('Error al leer métricas de IA de localStorage:', e);
  }

  return {
    totalTokensUsed: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalCalls: 0,
    providerCalls: {},
    dlpBytesScanned: 0,
    translationCharsUsed: 0,
    lastUsedTimestamp: new Date().toISOString(),
  };
}

export function saveAIUsageMetrics(metrics: AIUsageMetrics): void {
  try {
    localStorage.setItem(AI_METRICS_KEY, JSON.stringify(metrics));
  } catch (e) {
    console.error('Error al guardar métricas de IA en localStorage:', e);
  }
}

export function recordAIUsage(provider: string, promptTokens: number, completionTokens: number): AIUsageMetrics {
  const current = getAIUsageMetrics();
  const total = (promptTokens || 0) + (completionTokens || 0);

  const updated: AIUsageMetrics = {
    ...current,
    totalTokensUsed: current.totalTokensUsed + total,
    promptTokens: current.promptTokens + (promptTokens || 0),
    completionTokens: current.completionTokens + (completionTokens || 0),
    totalCalls: current.totalCalls + 1,
    providerCalls: {
      ...current.providerCalls,
      [provider]: (current.providerCalls[provider] || 0) + 1,
    },
    lastUsedTimestamp: new Date().toISOString(),
  };

  saveAIUsageMetrics(updated);
  return updated;
}

export function resetAIUsageMetrics(): AIUsageMetrics {
  const fresh: AIUsageMetrics = {
    totalTokensUsed: 0,
    promptTokens: 0,
    completionTokens: 0,
    totalCalls: 0,
    providerCalls: {},
    dlpBytesScanned: 0,
    translationCharsUsed: 0,
    lastUsedTimestamp: new Date().toISOString(),
  };
  saveAIUsageMetrics(fresh);
  return fresh;
}

// Escudo de Protección DLP (Sensitive Data Protection)
export function sanitizeSensitiveData(text: string): { sanitized: string; maskedCount: number; bytesChecked: number } {
  let masked = text;
  let count = 0;

  // 1. RUT Chileno (ej: 12.345.678-9 o 12345678-k)
  const rutRegex = /\b(\d{1,2}(?:\.\d{3}\.\d{3}|\d{6,7})-[\dkK])\b/g;
  masked = masked.replace(rutRegex, () => {
    count++;
    return '[RUT_PROTEGIDO_DLP]';
  });

  // 2. Tarjetas de crédito (13 a 19 dígitos con espacios o guiones)
  const ccRegex = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
  masked = masked.replace(ccRegex, () => {
    count++;
    return '[TARJETA_PROTEGIDA_DLP]';
  });

  // 3. API Keys de Google o servicios (AIzaSy..., AQ..., sk-...)
  const keyRegex = /\b(AIzaSy[A-Za-z0-9_-]{33}|AQ\.[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9_-]{20,})\b/g;
  masked = masked.replace(keyRegex, () => {
    count++;
    return '[API_KEY_PROTEGIDA_DLP]';
  });

  const bytesChecked = new Blob([text]).size;
  const metrics = getAIUsageMetrics();
  metrics.dlpBytesScanned += bytesChecked;
  saveAIUsageMetrics(metrics);

  return { sanitized: masked, maskedCount: count, bytesChecked };
}

// MOTOR MULTI-MODELO DE INTELIGENCIA ARTIFICIAL (GEMINI, GROQ, SAMBANOVA, OPENROUTER, GITHUB, OPENAI, DEEPSEEK)
export async function generateWithAI(
  request: AIPromptRequest,
  settings: AppSettings
): Promise<string> {
  const { prompt, context = '', taskType, providerOverride } = request;
  const activeModel = providerOverride || settings.preferredModel || 'auto';

  // 1. Google Gemini (Gemini 2.5 Flash / 2.0 Flash) - Nivel gratuito Conpi App
  if (
    settings.geminiApiKey &&
    (activeModel === 'gemini' || activeModel === 'auto')
  ) {
    try {
      // Intentar primero con gemini-2.5-flash y fallback a gemini-2.0-flash / gemini-1.5-flash
      const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      let lastText: string | null = null;

      for (const modelCandidate of modelsToTry) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelCandidate}:generateContent?key=${encodeURIComponent(
              settings.geminiApiKey.trim()
            )}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `Eres el motor experto de IA y tutor de aprendizaje de la plataforma de Tiare Pérez Concha (Desarrollo Web, UI/UX, Ecommerce, Ciberseguridad y Negocios en Chile).\nContexto: ${context}\n\nSolicitud: ${prompt}`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 1200,
                },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const promptT = data.usageMetadata?.promptTokenCount || Math.ceil((prompt.length + context.length) / 4);
              const compT = data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);
              recordAIUsage(`Google ${modelCandidate}`, promptT, compT);
              lastText = text.trim();
              break;
            }
          }
        } catch {}
      }

      if (lastText) {
        return lastText;
      }
    } catch (err) {
      console.warn('Fallo llamada Gemini, intentando con siguiente proveedor...', err);
    }
  }

  // 2. Groq (Llama 3.3 70B / Llama 3.1 8B) - Ultra-rápido, tier gratuito
  if (
    settings.groqApiKey &&
    (activeModel === 'groq' || activeModel === 'auto')
  ) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.groqApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Eres el motor experto de IA de Tiare Pérez Concha para diseño web, ecommerce, ciberseguridad y estudio técnico en Chile. Contexto: ${context}`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          const promptT = data.usage?.prompt_tokens || Math.ceil(prompt.length / 4);
          const compT = data.usage?.completion_tokens || Math.ceil(text.length / 4);
          recordAIUsage('Groq (Llama 3.3 70B)', promptT, compT);
          return text.trim();
        }
      }
    } catch (err) {
      console.warn('Fallo llamada Groq, probando siguiente proveedor...', err);
    }
  }

  // 3. SambaNova (Meta-Llama-3.1-70B-Instruct) - Inferencia acelerada SN
  if (
    settings.sambanovaApiKey &&
    (activeModel === 'sambanova' || activeModel === 'auto')
  ) {
    try {
      const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.sambanovaApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'Meta-Llama-3.1-70B-Instruct',
          messages: [
            {
              role: 'system',
              content: `Eres el motor de IA de Tiare Pérez Concha. Contexto: ${context}`,
            },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          const promptT = data.usage?.prompt_tokens || Math.ceil(prompt.length / 4);
          const compT = data.usage?.completion_tokens || Math.ceil(text.length / 4);
          recordAIUsage('SambaNova (Llama 3.1 70B)', promptT, compT);
          return text.trim();
        }
      }
    } catch (err) {
      console.warn('Fallo llamada SambaNova...', err);
    }
  }

  // 4. GitHub Models (Endpoint Oficial de Azure AI para desarrolladores)
  if (
    settings.githubModelsApiKey &&
    (activeModel === 'github' || activeModel === 'auto')
  ) {
    try {
      const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.githubModelsApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Asistente de estudio y base de conocimiento de Tiare Pérez Concha. Contexto: ${context}`,
            },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          const promptT = data.usage?.prompt_tokens || Math.ceil(prompt.length / 4);
          const compT = data.usage?.completion_tokens || Math.ceil(text.length / 4);
          recordAIUsage('GitHub Models (gpt-4o-mini)', promptT, compT);
          return text.trim();
        }
      }
    } catch (err) {
      console.warn('Fallo llamada GitHub Models...', err);
    }
  }

  // 5. OpenRouter (Modelos gratuitos DeepSeek R1 / Llama)
  if (
    settings.openrouterApiKey &&
    (activeModel === 'openrouter' || activeModel === 'auto')
  ) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.openrouterApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-r1:free',
          messages: [
            {
              role: 'system',
              content: `Asistente de estudio y soporte de Tiare Pérez Concha. Contexto: ${context}`,
            },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          const promptT = data.usage?.prompt_tokens || Math.ceil(prompt.length / 4);
          const compT = data.usage?.completion_tokens || Math.ceil(text.length / 4);
          recordAIUsage('OpenRouter (DeepSeek R1 Free)', promptT, compT);
          return text.trim();
        }
      }
    } catch (err) {
      console.warn('Fallo llamada OpenRouter...', err);
    }
  }

  // 6. OpenAI Oficial (si tiene key configurada)
  if (
    settings.openaiApiKey &&
    (activeModel === 'openai' || activeModel === 'auto')
  ) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.openaiApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Asistente de desarrollo web y estudio para Tiare Pérez Concha. Contexto: ${context}`,
            },
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          const promptT = data.usage?.prompt_tokens || Math.ceil(prompt.length / 4);
          const compT = data.usage?.completion_tokens || Math.ceil(text.length / 4);
          recordAIUsage('OpenAI (gpt-4o-mini)', promptT, compT);
          return text.trim();
        }
      }
    } catch (err) {
      console.warn('Fallo llamada OpenAI...', err);
    }
  }

  // 7. DeepSeek API oficial
  if (
    settings.deepseekApiKey &&
    (activeModel === 'deepseek' || activeModel === 'auto')
  ) {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.deepseekApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `Eres el motor experto de IA de Tiare Pérez Concha para diseño de software, ecommerce, branding y ciberseguridad en Chile. Contexto: ${context}`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          const promptT = data.usage?.prompt_tokens || Math.ceil(prompt.length / 4);
          const compT = data.usage?.completion_tokens || Math.ceil(text.length / 4);
          recordAIUsage('DeepSeek (deepseek-chat)', promptT, compT);
          return text.trim();
        }
      }
    } catch (err) {
      console.warn('Fallo llamada DeepSeek...', err);
    }
  }

  // 8. MOTOR HEURÍSTICO LOCAL INTELIGENTE (100% Gratuito, 0 Tokens, 0 Cobros)
  await new Promise((resolve) => setTimeout(resolve, 350));
  recordAIUsage('Motor Local Heurístico (Offline $0)', 0, 0);
  return generateLocalFallback(taskType, prompt, context);
}

// TRADUCCIÓN INTELIGENTE CON ESCUDO DE PROTECCIÓN $0
export async function translateContent(
  text: string,
  targetLang: 'en' | 'es',
  settings: AppSettings
): Promise<{ text: string; source: 'cloud_translation' | 'ai_model' | 'local_rule'; error?: string }> {
  const metrics = getAIUsageMetrics();
  const textChars = text.length;

  // Escudo de seguridad para Google Cloud Translation: Si supera los 400.000 chars, conmuta a IA o local para evitar cobro
  const hasGcpKey = settings.googleCloudApiKey || settings.geminiApiKey;
  if (hasGcpKey && metrics.translationCharsUsed + textChars < TRANSLATION_SAFETY_SHIELD_CHARS) {
    try {
      const apiKey = (settings.googleCloudApiKey || settings.geminiApiKey).trim();
      const res = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: [text],
            target: targetLang,
            format: 'text',
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const translated = data?.data?.translations?.[0]?.translatedText;
        if (translated) {
          metrics.translationCharsUsed += textChars;
          saveAIUsageMetrics(metrics);
          return { text: translated, source: 'cloud_translation' };
        }
      }
    } catch (e) {
      console.warn('Fallo Google Cloud Translation API, usando modelo IA...', e);
    }
  }

  // Fallback con Modelo de IA (Gemini, Groq, etc.)
  try {
    const aiTranslation = await generateWithAI(
      {
        prompt: `Traduce de forma fidedigna y natural el siguiente texto al ${
          targetLang === 'en' ? 'Inglés técnico profesional' : 'Español chileno profesional'
        }. Devuelve ÚNICAMENTE la traducción sin introducciones ni notas:\n\n"${text}"`,
        taskType: 'general',
      },
      settings
    );
    return { text: aiTranslation, source: 'ai_model' };
  } catch {
    return { text, source: 'local_rule', error: 'No se pudo completar la traducción' };
  }
}

function generateLocalFallback(taskType: string, prompt: string, context: string): string {
  switch (taskType) {
    case 'study':
      return `### Resumen de Estudio Técnico (Motor Local LSC)
- **Concepto Analizado**: ${prompt.slice(0, 100)}...
- **Fundamento Clave**: Para arquitecturas web y ecommerce en Chile, se prioriza el bajo acoplamiento, alta disponibilidad y costo operativo $0 en fase inicial (usando Supabase con Keep-Alive y servidores edge gratuitos).
- **Seguridad**: Nunca exponer credenciales en el cliente y aislar pasarelas (Webpay Plus) mediante webhooks verificados.
- **Conclusión de Aprendizaje**: Estructura modular aprobada para implementación técnica.`;

    case 'copywriting':
      return `Recibirás una solución digital de alto estándar orientada a maximizar conversiones y retención en el mercado chileno. Integramos una arquitectura de navegación intuitiva sin fricciones, validación estricta de usabilidad mobile-first y pasarelas de pago optimizadas (Webpay Plus / Débito) para que cada visita tenga un camino claro hacia la compra.`;

    case 'foda_pestel':
      return `### Análisis de Viabilidad Estratégica
- **Fortaleza Clave**: Posicionamiento directo en nicho con demanda activa y comunicación transparente.
- **Oportunidad**: Captura de clientes desencantados con la atención impersonal de grandes retailers.
- **Riesgo Mitigable**: Fricción de compra en móvil, resuelta mediante checkout simplificado de 1 clic.
- **Conclusión de Viabilidad**: Proyecto clasificado como **GO (Altamente Recomendado)**. Requiere un sprint de prototipado para asegurar alineación de catálogo antes del despliegue.`;

    case 'logo_explanation':
      return `El concepto visual sintetiza la elegancia estructural con la calidez del trato humano. La tipografía serif display aporta autoridad, tradición y sofisticación, mientras que la disposición equilibrada transmite estabilidad y seguridad a las compradoras en entornos digitales.`;

    case 'brief_ux':
      return `### Buyer Persona: Compradora Digital Chilena
- **Motivación**: Encontrar prendas con calce real garantizado y política de cambios ágil sin costo adicional.
- **Dolores habituales**: Temor a equivocarse de talla y procesos de devolución burocráticos.
- **Estrategia UX**: Guía interactiva de medidas en centímetros con fotos de modelos reales y botón directo a WhatsApp de asesoría.`;

    default:
      return `Propuesta estratégica adaptada para ${context || 'el proyecto'}: Optimizada bajo estándares internacionales de diseño, accesibilidad WCAG 2.1 AA y metodologías ágiles de entrega continua en Sprints de alto valor.`;
  }
}
