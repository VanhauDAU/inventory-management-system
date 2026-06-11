import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
<<<<<<< HEAD
  envDir: '../',
=======
>>>>>>> feature/frontend-crud
  server: {
    port: 3000,
  },
})
