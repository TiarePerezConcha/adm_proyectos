/**
 * LSC Telemetry & Security SDK para Aplicaciones Móviles
 * Compatible con: React Native, Expo, Flutter (vía WebView/Http), Capacitor, Cordova y Android WebView.
 * Uso: TelemetryMobileAgent.init({ projectId: 'MI_APP_MOVIL', endpoint: '...', apiKey: '...' });
 */

export interface MobileTelemetryConfig {
  projectId: string;
  endpoint: string;
  apiKey: string;
  appVersion?: string;
  platform?: 'android' | 'ios' | 'web';
  sampleRate?: number;
}

export class TelemetryMobileAgent {
  private static config: MobileTelemetryConfig;
  private static startTime: number = Date.now();

  public static init(config: MobileTelemetryConfig) {
    this.config = config;
    this.startTime = Date.now();

    // 1. Heartbeat de inicio de app móvil
    this.sendEvent('app_start', {
      launch_time_ms: Date.now() - this.startTime,
      platform: config.platform || 'mobile',
      app_version: config.appVersion || '1.0.0',
    });

    // 2. Manejador global de errores no capturados
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (e) => {
        this.sendAnomaly('mobile_js_error', {
          message: e.message,
          source: e.filename,
          line: e.lineno,
        });
      });

      window.addEventListener('unhandledrejection', (e) => {
        this.sendAnomaly('mobile_unhandled_promise', {
          message: e.reason?.message || String(e.reason),
        });
      });
    }
  }

  public static sendEvent(eventType: string, details: Record<string, any>) {
    if (!this.config) return;

    const payload = {
      project_id: this.config.projectId,
      event_type: eventType,
      url: `app://${this.config.projectId}/${this.config.platform || 'native'}`,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Mobile Native Client',
      metadata: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    };

    fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.config.apiKey,
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Silencioso para no degradar experiencia de usuario móvil
    });
  }

  public static sendAnomaly(type: string, details: Record<string, any>) {
    this.sendEvent('security_anomaly', {
      anomaly_type: type,
      ...details,
    });
  }
}
