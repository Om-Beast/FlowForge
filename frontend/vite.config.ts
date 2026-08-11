import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@context': path.resolve(__dirname, './src/context'),
      '@store': path.resolve(__dirname, './src/store'),
      '@charts': path.resolve(__dirname, './src/charts'),
      '@workflow': path.resolve(__dirname, './src/workflow'),
      '@dashboard': path.resolve(__dirname, './src/dashboard'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
})
