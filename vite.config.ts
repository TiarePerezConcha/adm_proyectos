import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Permite despliegue directo en GitHub Pages sin problemas de rutas relativas
  server: {
    port: 3000,
    open: true,
  },
});
