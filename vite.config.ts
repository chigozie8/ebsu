import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import crypto from 'crypto'
import fs from 'fs'
import type { Plugin } from 'vite'

// ─── In-process API middleware (replaces the separate server.ts on port 3001) ─
function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'dsqjg9mfg';
        const apiKey    = process.env.VITE_CLOUDINARY_API_KEY    || '731583139833111';
        const apiSecret = process.env.VITE_CLOUDINARY_API_SECRET || '5Kbu5rq0DcwEbqlWXTD58Mk4dOw';

        const GALLERY_CACHE_FILE = '/tmp/ebsumsa-gallery-cache.json';
        type CacheShape = { items: unknown[]; at: number };

        const readCache = (): CacheShape | null => {
          try { return JSON.parse(fs.readFileSync(GALLERY_CACHE_FILE, 'utf8')) as CacheShape; }
          catch { return null; }
        };
        const writeCache = (data: CacheShape) => {
          try { fs.writeFileSync(GALLERY_CACHE_FILE, JSON.stringify(data)); } catch { /* ignore */ }
        };

        const sendJson = (status: number, body: unknown) => {
          const json = JSON.stringify(body);
          res.writeHead(status, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(json),
            'Access-Control-Allow-Origin': '*',
          });
          res.end(json);
        };

        const readBody = (): Promise<any> => new Promise((resolve) => {
          let data = '';
          req.on('data', (chunk) => { data += chunk; });
          req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
        });

        const url = req.url.split('?')[0];

        // ── OPTIONS (CORS preflight) ─────────────────────────────────────────
        if (req.method === 'OPTIONS') {
          res.writeHead(200, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' });
          return res.end();
        }

        // ── GET /api/gallery-list ────────────────────────────────────────────
        if (url === '/api/gallery-list' && req.method === 'GET') {
          const staleCache = readCache();
          try {
            const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
            const searchPayload = (resourceType: string) =>
              fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
                method: 'POST',
                headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression: `folder:ebsu_gallery AND resource_type:${resourceType}`, sort_by: [{ created_at: 'desc' }], max_results: 500, with_field: ['context', 'tags'] }),
              });

            const [imgRes, vidRes] = await Promise.all([searchPayload('image'), searchPayload('video')]);
            const mapRes = (data: any, type: 'image' | 'video') =>
              (data.resources || []).map((item: any) => ({
                url: item.secure_url, publicId: item.public_id,
                category: item.context?.custom?.category || 'general',
                caption: item.context?.custom?.caption || '',
                type, uploadedAt: item.created_at, size: item.bytes,
              }));

            const imgData = imgRes.ok ? await imgRes.json() : { resources: [], error: { message: `HTTP ${imgRes.status}` } };
            const vidData = vidRes.ok ? await vidRes.json() : { resources: [], error: { message: `HTTP ${vidRes.status}` } };

            if (imgData.error || vidData.error) {
              const errMsg = imgData.error?.message || vidData.error?.message;
              if (staleCache) return sendJson(200, { items: staleCache.items, stale: true });
              return sendJson(200, { items: [], error: errMsg });
            }

            const items = [...mapRes(imgData, 'image'), ...mapRes(vidData, 'video')]
              .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            writeCache({ items, at: Date.now() });
            return sendJson(200, { items });
          } catch (err) {
            if (staleCache) return sendJson(200, { items: staleCache.items, stale: true });
            return sendJson(500, { error: err instanceof Error ? err.message : String(err) });
          }
        }

        // ── POST /api/gallery-cache ──────────────────────────────────────────
        if (url === '/api/gallery-cache' && req.method === 'POST') {
          const body = await readBody();
          const { item } = body as { item?: any };
          if (!item?.publicId) return sendJson(400, { error: 'item with publicId required' });
          const existing = readCache();
          if (!existing) return sendJson(200, { added: false, reason: 'no_cache' });
          const deduped = (existing.items as any[]).filter((i: any) => i.publicId !== item.publicId);
          writeCache({ items: [item, ...deduped], at: existing.at });
          return sendJson(200, { added: true });
        }

        // ── DELETE /api/gallery-cache ────────────────────────────────────────
        if (url === '/api/gallery-cache' && req.method === 'DELETE') {
          const body = await readBody();
          const { publicId } = body as { publicId?: string };
          if (publicId) {
            const existing = readCache();
            if (existing) {
              writeCache({ items: (existing.items as any[]).filter((i: any) => i.publicId !== publicId), at: existing.at });
            }
          } else {
            if (fs.existsSync(GALLERY_CACHE_FILE)) fs.unlinkSync(GALLERY_CACHE_FILE);
          }
          return sendJson(200, { cleared: true });
        }

        // ── DELETE /api/gallery-upload ───────────────────────────────────────
        if (url === '/api/gallery-upload' && req.method === 'DELETE') {
          const body = await readBody();
          const { publicId, resourceType = 'image' } = body as { publicId: string; resourceType?: string };
          if (!publicId) return sendJson(400, { error: 'publicId required' });
          const timestamp = Math.floor(Date.now() / 1000);
          const signature = crypto.createHash('sha1').update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest('hex');
          const form = new URLSearchParams();
          form.append('public_id', publicId);
          form.append('timestamp', String(timestamp));
          form.append('api_key', apiKey);
          form.append('signature', signature);
          const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: 'POST', body: form });
          const d = await r.json() as any;
          if (d.error) return sendJson(500, { error: d.error.message });
          if (d.result !== 'ok' && d.result !== 'not found') return sendJson(500, { error: `Cloudinary returned: ${d.result}` });
          return sendJson(200, { success: true });
        }

        // ── GET /api/imagekit-auth ───────────────────────────────────────────
        if (url === '/api/imagekit-auth' && req.method === 'GET') {
          const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
          if (!privateKey) return sendJson(500, { error: 'ImageKit private key not configured' });
          const token = crypto.randomUUID();
          const expire = Math.floor(Date.now() / 1000) + 2400;
          const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');
          return sendJson(200, { token, expire, signature });
        }

        // ── GET /api/paystack-banks ──────────────────────────────────────────
        if (url === '/api/paystack-banks' && req.method === 'GET') {
          const SECRET = process.env.PAYSTACK_SECRET_KEY;
          if (!SECRET) return sendJson(500, { error: 'Paystack secret key not configured' });
          try {
            let allBanks: any[] = [];
            let page = 1, hasMore = true;
            while (hasMore) {
              const response = await fetch(`https://api.paystack.co/bank?currency=NGN&perPage=100&page=${page}`, { headers: { Authorization: `Bearer ${SECRET}` } });
              const data = await response.json() as any;
              if (!data.status) return sendJson(500, { error: data.message || 'Failed to fetch banks' });
              allBanks = [...allBanks, ...data.data];
              hasMore = data.meta?.next !== null && data.data.length === 100;
              page++;
            }
            allBanks.sort((a: any, b: any) => a.name.localeCompare(b.name));
            return sendJson(200, { banks: allBanks });
          } catch (err) { return sendJson(500, { error: 'Internal server error' }); }
        }

        // ── GET /api/paystack-resolve-account ────────────────────────────────
        if (url === '/api/paystack-resolve-account' && req.method === 'GET') {
          const SECRET = process.env.PAYSTACK_SECRET_KEY;
          if (!SECRET) return sendJson(500, { error: 'Paystack secret key not configured' });
          const qs = new URLSearchParams(req.url.split('?')[1] || '');
          const account_number = qs.get('account_number');
          const bank_code = qs.get('bank_code');
          if (!account_number || !bank_code) return sendJson(400, { error: 'account_number and bank_code are required' });
          try {
            const response = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, { headers: { Authorization: `Bearer ${SECRET}` } });
            const data = await response.json() as any;
            if (!data.status) return sendJson(400, { error: data.message || 'Could not resolve account' });
            return sendJson(200, { account_name: data.data.account_name, account_number: data.data.account_number });
          } catch (err) { return sendJson(500, { error: 'Internal server error' }); }
        }

        // ── POST /api/paystack-transfer ──────────────────────────────────────
        if (url === '/api/paystack-transfer' && req.method === 'POST') {
          const SECRET = process.env.PAYSTACK_SECRET_KEY;
          if (!SECRET) return sendJson(500, { error: 'Paystack secret key not configured' });
          const body = await readBody();
          const { account_number, bank_code, account_name, amount, narration } = body;
          if (!account_number || !bank_code || !account_name || !amount) return sendJson(400, { error: 'Missing required fields' });
          const amountInKobo = Math.round(Number(amount) * 100);
          if (amountInKobo < 100) return sendJson(400, { error: 'Minimum transfer amount is ₦1' });
          try {
            const recipientRes = await fetch('https://api.paystack.co/transferrecipient', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'nuban', name: account_name, account_number, bank_code, currency: 'NGN' }) });
            const recipientData = await recipientRes.json() as any;
            if (!recipientData.status) return sendJson(400, { error: recipientData.message || 'Failed to create recipient' });
            const transferRes = await fetch('https://api.paystack.co/transfer', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'balance', amount: amountInKobo, recipient: recipientData.data.recipient_code, reason: narration || 'EBSUMSA Admin Transfer' }) });
            const transferData = await transferRes.json() as any;
            if (!transferData.status) return sendJson(400, { error: transferData.message || 'Transfer failed' });
            return sendJson(200, { success: true, transfer_code: transferData.data.transfer_code, reference: transferData.data.reference, status: transferData.data.status, amount: amountInKobo / 100, recipient: account_name });
          } catch (err) { return sendJson(500, { error: 'Internal server error' }); }
        }

        // ── POST /api/paystack-finalize-transfer ─────────────────────────────
        if (url === '/api/paystack-finalize-transfer' && req.method === 'POST') {
          const SECRET = process.env.PAYSTACK_SECRET_KEY;
          if (!SECRET) return sendJson(500, { error: 'Paystack secret key not configured' });
          const body = await readBody();
          const { transfer_code, otp } = body;
          if (!transfer_code || !otp) return sendJson(400, { error: 'transfer_code and otp are required' });
          try {
            const response = await fetch('https://api.paystack.co/transfer/finalize_transfer', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ transfer_code, otp }) });
            const data = await response.json() as any;
            if (!data.status) return sendJson(400, { error: data.message || 'Failed to finalize transfer' });
            return sendJson(200, { success: true, transfer_code: data.data.transfer_code, reference: data.data.reference, status: data.data.status });
          } catch (err) { return sendJson(500, { error: 'Internal server error' }); }
        }

        // ── Unknown /api/* route ─────────────────────────────────────────────
        return sendJson(404, { error: `Unknown API route: ${url}` });
      });
    },
  };
}

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

  const resolveKey = (...keys: string[]) =>
    keys.map(k => penv[k] || env[k] || '').find(Boolean) || '';

  const viteImportMetaEnv: Record<string, string> = {};
  const viteKeys = cherryPickedKeys.filter(k => k.startsWith('VITE_'));
  const CLOUDINARY_FALLBACKS: Record<string, string> = {
    VITE_CLOUDINARY_CLOUD_NAME:    'dsqjg9mfg',
    VITE_CLOUDINARY_API_KEY:       '731583139833111',
    VITE_CLOUDINARY_UPLOAD_PRESET: 'ebsumsa',
  };

  viteKeys.forEach(key => {
    const value = penv[key] || env[key] || CLOUDINARY_FALLBACKS[key] || '';
    viteImportMetaEnv[`import.meta.env.${key}`] = JSON.stringify(value);
  });

  return {
    define: {
      'process.env': processEnv,
      ...viteImportMetaEnv,
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(resolveKey('VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(resolveKey('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')),
    },
    plugins: [react(), apiMiddlewarePlugin()],
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
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
