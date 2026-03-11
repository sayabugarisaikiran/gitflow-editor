import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Minification
    minify: 'esbuild',
    // Chunk splitting for large dependencies
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-xyflow': ['@xyflow/react'],
          'vendor-xterm': ['@xterm/xterm', '@xterm/addon-fit'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable'],
          'vendor-zustand': ['zustand'],
        },
      },
    },
    // Warn when chunk size is > 800kb
    chunkSizeWarningLimit: 800,
  },
})
