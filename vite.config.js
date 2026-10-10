import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = 'https://sih26106.onrender.com';
// Vite rejects unknown Host headers, so the public ngrok hostname must be allowed explicitly.
const allowedHosts = ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.io', '.ngrok.dev'];
// Calls to /api are forwarded to the backend by Vite itself, so the browser only talks to this site (no CORS),
// including when the site is opened through an ngrok URL.
const proxy = { '/api': { target: BACKEND, changeOrigin: true, secure: true } };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, allowedHosts, proxy },
  preview: { port: 4173, allowedHosts, proxy },
});
