import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // This plugin inlines all JS/CSS into the HTML, making it perfect for Streamlit embedding
    viteSingleFile(),
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
  },
});