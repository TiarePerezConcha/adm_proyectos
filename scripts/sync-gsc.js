import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function fetchGSCData() {
  console.log('🔍 Iniciando sincronización completa con Google Search Console API...');

  // 1. Buscar archivo de credenciales de la cuenta de servicio
  const rootDir = process.cwd();
  const files = fs.readdirSync(rootDir);
  const keyFile = files.find((f) => f.startsWith('conpi-app-') && f.endsWith('.json'));

  if (!keyFile) {
    throw new Error('No se encontró el archivo de credenciales conpi-app-*.json en la raíz del proyecto.');
  }

  const keyPath = path.join(rootDir, keyFile);
  const sa = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  // 2. Generar JWT firmado con RSA-SHA256
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsignedToken = b64(header) + '.' + b64(claim);
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const jwt = unsignedToken + '.' + sign.sign(sa.private_key, 'base64url');

  // 3. Obtener token de acceso OAuth2
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error('Error al obtener token de Google: ' + JSON.stringify(tokenData));
  }

  const siteUrl = encodeURIComponent('sc-domain:conpi.cl');
  const queryUrl = `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`;

  // Helper para consultar dimensiones en un rango de fechas
  async function queryDimension(startDate, endDate, dimensions, rowLimit = 50) {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions,
        rowLimit,
      }),
    });
    const data = await res.json();
    if (data.error) {
      console.warn(`Aviso consultando dimensiones [${dimensions.join(',')}]:`, data.error.message);
      return [];
    }
    return data.rows || [];
  }

  // Definir los 4 rangos exactos que usa Google Search Console
  // GSC tiene un desfase estándar de 2-3 días para datos completos consolidados
  const periodsConfig = [
    { key: '24h', label: '24 horas', days: 2 },
    { key: '7d', label: '7 días', days: 7 },
    { key: '28d', label: '28 días', days: 28 },
    { key: '3m', label: '3 meses', days: 90 },
  ];

  const nowD = new Date();
  const endDate = nowD.toISOString().slice(0, 10);

  const resultPeriods = {};

  for (const p of periodsConfig) {
    const d = new Date();
    d.setDate(d.getDate() - p.days);
    const startDate = d.toISOString().slice(0, 10);

    console.log(`⏳ Consultando período ${p.label} (${startDate} a ${endDate})...`);

    // Consultas en paralelo para el período
    const [dateRows, queryRows, pageRows, countryRows, deviceRows] = await Promise.all([
      queryDimension(startDate, endDate, ['date'], 100),
      queryDimension(startDate, endDate, ['query'], 50),
      queryDimension(startDate, endDate, ['page'], 50),
      queryDimension(startDate, endDate, ['country'], 50),
      queryDimension(startDate, endDate, ['device'], 10),
    ]);

    // Resumen agregado: sumar sobre fechas para capturar datos totales reales
    let totalClicks = 0;
    let totalImpressions = 0;
    let weightedPositionSum = 0;

    if (dateRows.length > 0) {
      for (const r of dateRows) {
        totalClicks += r.clicks || 0;
        totalImpressions += r.impressions || 0;
        weightedPositionSum += (r.position || 0) * (r.impressions || 1);
      }
    } else {
      // Fallback a queries si no hay dateRows
      for (const r of queryRows) {
        totalClicks += r.clicks || 0;
        totalImpressions += r.impressions || 0;
        weightedPositionSum += (r.position || 0) * (r.impressions || 1);
      }
    }

    const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(1)) : 0;
    const avgPosition = totalImpressions > 0 ? Number((weightedPositionSum / totalImpressions).toFixed(1)) : 0;

    // Mapear consultas
    const queries = queryRows.map((r) => ({
      query: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: Number(((r.ctr || 0) * 100).toFixed(1)),
      position: Number((r.position || 0).toFixed(1)),
      trend: (r.position || 10) <= 3 ? 'up' : (r.position || 10) <= 10 ? 'stable' : 'down',
    }));

    // Mapear páginas
    const pages = pageRows.map((r) => ({
      page: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: Number(((r.ctr || 0) * 100).toFixed(1)),
      position: Number((r.position || 0).toFixed(1)),
    }));

    // Mapear países
    const countryNames = {
      chl: 'Chile 🇨🇱',
      cl: 'Chile 🇨🇱',
      esp: 'España 🇪🇸',
      es: 'España 🇪🇸',
      col: 'Colombia 🇨🇴',
      co: 'Colombia 🇨🇴',
      per: 'Perú 🇵🇪',
      pe: 'Perú 🇵🇪',
      slv: 'El Salvador 🇸🇻',
      sv: 'El Salvador 🇸🇻',
      arg: 'Argentina 🇦🇷',
      ar: 'Argentina 🇦🇷',
      ven: 'Venezuela 🇻🇪',
      ve: 'Venezuela 🇻🇪',
      usa: 'Estados Unidos 🇺🇸',
      us: 'Estados Unidos 🇺🇸',
      mex: 'México 🇲🇽',
      mx: 'México 🇲🇽',
      bra: 'Brasil 🇧🇷',
      ecu: 'Ecuador 🇪🇨',
    };
    const countries = countryRows.map((r) => {
      const code = (r.keys[0] || '').toLowerCase();
      return {
        countryCode: code,
        countryName: countryNames[code] || code.toUpperCase(),
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: Number(((r.ctr || 0) * 100).toFixed(1)),
        position: Number((r.position || 0).toFixed(1)),
      };
    });

    // Mapear dispositivos
    const deviceNames = {
      mobile: 'Móviles (Smartphones) 📱',
      desktop: 'Ordenador / PC 💻',
      tablet: 'Tablet 📲',
    };
    const devices = deviceRows.map((r) => {
      const code = (r.keys[0] || '').toLowerCase();
      return {
        deviceCode: code,
        deviceName: deviceNames[code] || code,
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: Number(((r.ctr || 0) * 100).toFixed(1)),
        position: Number((r.position || 0).toFixed(1)),
      };
    });

    // Mapear historial por día
    const dates = dateRows.map((r) => ({
      date: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
    }));

    resultPeriods[p.key] = {
      label: p.label,
      startDate,
      endDate,
      summary: {
        queriesCount: queries.length,
        totalClicks,
        totalImpressions,
        avgCtr,
        avgPosition,
      },
      queries,
      pages,
      countries,
      devices,
      dates,
    };
  }

  const payload = {
    domain: 'sc-domain:conpi.cl',
    lastSync: new Date().toISOString(),
    periods: resultPeriods,
  };

  const outputPath = path.join(rootDir, 'src', 'data', 'gsc_live_cache.json');
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`💾 Caché guardado exitosamente en: ${outputPath}`);

  return payload;
}

// Ejecutar si se llama directamente via node
if (process.argv[1]?.endsWith('sync-gsc.js')) {
  fetchGSCData()
    .then((data) => {
      console.log('✅ Sincronización exitosa con Google Search Console.');
      console.log('Resumen 28d:', data.periods['28d'].summary);
    })
    .catch((err) => {
      console.error('❌ Error en sincronización:', err);
      process.exit(1);
    });
}
