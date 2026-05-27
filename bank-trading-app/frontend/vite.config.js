import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      'supersympathetic-dana-disharmoniously.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io'
    ]
  },
  preview: {
    host: true,
    allowedHosts: [
      'supersympathetic-dana-disharmoniously.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io'
    ]
  }
})
