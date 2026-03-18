import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import crypto from 'crypto'

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
  "VITE_CLOUDINARY_CLOUD_NAME",
  "VITE_CLOUDINARY_UPLOAD_PRESET",
  "VITE_CLOUDINARY_API_KEY",
  "VITE_CLOUDINARY_API_SECRET",
  "VITE_EMAILJS_SERVICE_ID",
  "VITE_EMAILJS_NEWSLETTER_TEMPLATE_ID",
  "VITE_EMAILJS_WELCOME_TEMPLATE_ID",
  "VITE_EMAILJS_PUBLIC_KEY",
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const processEnv: Record<string, string> = {};
  // Load from both .env files AND runtime process.env (for Vercel integrations)
  cherryPickedKeys.forEach(key => {
    processEnv[key] = env[key] || (process as any).env[key] || '';
  });

  // Vite dev plugin: serves /api/gallery-list and /api/gallery-upload locally
  // so the gallery works in the preview without needing `vercel dev`.
  const apiDevPlugin = {
    name: 'api-dev-middleware',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        // Use bracket notation to bypass Vite's compile-time `define` replacement
        // of process.env — Vercel injects vars into process.env at runtime.
        const penv      = process["env"] as Record<string, string | undefined>;
        const cloudName = penv["VITE_CLOUDINARY_CLOUD_NAME"];
        const apiKey    = penv["VITE_CLOUDINARY_API_KEY"];
        const apiSecret = penv["VITE_CLOUDINARY_API_SECRET"];

        // ── GET /api/gallery-list ─────────────────────────────────────────
        if (req.url === '/api/gallery-list') {
          res.setHeader('Content-Type', 'application/json');
          if (!cloudName || !apiKey || !apiSecret) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Cloudinary env vars not configured. Set VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_API_KEY, VITE_CLOUDINARY_API_SECRET in your Vars.' }));
            return;
          }
          try {
            const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
            const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
              method: 'POST',
              headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ expression: 'folder:ebsu_gallery', sort_by: [{ created_at: 'desc' }], max_results: 500, with_field: ['context', 'tags'] }),
            });
            if (!r.ok) { const t = await r.text(); res.statusCode = 502; res.end(JSON.stringify({ error: t.slice(0, 200) })); return; }
            const data = await r.json() as { resources: Array<{ public_id: string; secure_url: string; resource_type: string; created_at: string; bytes: number; context?: { custom?: { category?: string; caption?: string } } }> };
            const items = (data.resources || []).map(r => ({ url: r.secure_url, publicId: r.public_id, category: r.context?.custom?.category || 'general', caption: r.context?.custom?.caption || '', type: r.resource_type === 'video' ? 'video' : 'image', uploadedAt: r.created_at, size: r.bytes }));
            res.end(JSON.stringify({ items }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
          }
          return;
        }

        // ── DELETE /api/gallery-upload ────────────────────────────────────
        if (req.url === '/api/gallery-upload') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return; }
          if (req.method !== 'DELETE') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method not allowed' })); return; }
          if (!cloudName || !apiKey || !apiSecret) { res.statusCode = 500; res.end(JSON.stringify({ error: 'Cloudinary env vars not configured' })); return; }
          try {
            const body: Buffer[] = [];
            await new Promise<void>((resolve, reject) => { req.on('data', (c: Buffer) => body.push(c)); req.on('end', resolve); req.on('error', reject); });
            const { publicId, resourceType = 'image' } = JSON.parse(Buffer.concat(body).toString()) as { publicId: string; resourceType?: string };
            if (!publicId) { res.statusCode = 400; res.end(JSON.stringify({ error: 'publicId required' })); return; }
            const timestamp = Math.floor(Date.now() / 1000);
            const signature = crypto.createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest('hex');
            const form = new URLSearchParams();
            form.append('public_id', publicId); form.append('timestamp', String(timestamp)); form.append('api_key', apiKey); form.append('signature', signature);
            const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: 'POST', body: form });
            const d = await r.json() as { result: string };
            if (d.result !== 'ok' && d.result !== 'not found') { res.statusCode = 500; res.end(JSON.stringify({ error: `Delete failed: ${d.result}` })); return; }
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
          }
          return;
        }

        next();
      });
    },
  };

  return {
    define: {
      'process.env': processEnv
    },
    plugins: [react(), apiDevPlugin],
    build: {
      // Increase the warning limit slightly for large deps like Firebase
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Each chunk gets its own long-lived browser cache entry
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

