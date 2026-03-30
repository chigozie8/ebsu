import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const cherryPickedKeys = [
  "REACT_APP_FIREBASE_API_KEY",
  "REACT_APP_FIREBASE_AUTH_DOMAIN",
  "REACT_APP_FIREBASE_PROJECT_ID",
  "REACT_APP_FIREBASE_STORAGE_BUCKET",
  "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  "REACT_APP_FIREBASE_APP_ID",
  "REACT_APP_MEASUREMENT_ID",
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_MEASUREMENT_ID",
  "VITE_IMAGEKIT_PUBLIC_KEY",
  "VITE_IMAGEKIT_URL_ENDPOINT",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_CLOUDINARY_CLOUD_NAME",
  "VITE_CLOUDINARY_UPLOAD_PRESET",
  "VITE_CLOUDINARY_API_KEY",
  "VITE_CLOUDINARY_API_SECRET",
  "VITE_EMAILJS_SERVICE_ID",
  "VITE_EMAILJS_NEWSLETTER_TEMPLATE_ID",
  "VITE_EMAILJS_WELCOME_TEMPLATE_ID",
  "VITE_EMAILJS_PUBLIC_KEY",
  "VITE_PAYSTACK_PUBLIC_KEY",
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const processEnv: Record<string, string> = {};
  cherryPickedKeys.forEach(key => {
    processEnv[key] = env[key] || (process as any).env[key] || '';
  });

  const penv = (process as any).env as Record<string, string | undefined>;
  const supabaseUrl = penv['SUPABASE_URL'] || penv['NEXT_PUBLIC_SUPABASE_URL'] || env['SUPABASE_URL'] || env['NEXT_PUBLIC_SUPABASE_URL'] || env['VITE_SUPABASE_URL'] || '';
  const supabaseAnonKey = penv['SUPABASE_ANON_KEY'] || penv['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || env['SUPABASE_ANON_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || env['VITE_SUPABASE_ANON_KEY'] || '';

  return {
    define: {
      'process.env': processEnv,
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ui':       ['framer-motion', 'lottie-react', 'react-helmet-async'],
          },
        },
      },
    },
  }
})
