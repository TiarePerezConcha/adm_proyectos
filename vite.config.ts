import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin para sincronización directa de Google Search Console API en modo desarrollo
function gscSyncPlugin() {
  return {
    name: 'gsc-sync-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/sync-gsc', async (req: any, res: any) => {
        try {
          const { fetchGSCData } = await import('./scripts/sync-gsc.js');
          const data = await fetchGSCData();
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, data }));
        } catch (err: any) {
          console.error('Error en endpoint /api/sync-gsc:', err);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 500;
          res.end(JSON.stringify({ ok: false, error: err.message || 'Error de sincronización' }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), gscSyncPlugin()],
  base: './', // Permite despliegue directo en GitHub Pages sin problemas de rutas relativas
  server: {
    port: 3000,
    open: true,
  },
});
