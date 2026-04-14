import { defineConfig } from 'vite';

export default defineConfig({
  assetsInclude: ['**/*.hdr', '**/*.glb'],
  server: {
    open: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
