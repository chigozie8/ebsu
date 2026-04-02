/**
 * vite-plugin-api.ts
 *
 * Handles all /api/* requests inside the Vite dev server so no separate
 * Express process is needed.  In production, the real /api/*.ts Vercel
 * serverless functions handle every route automatically.
 */

import type { Plugin, ViteDevServer } from 'vite';
import crypto from 'crypto';
import * as fs from 'fs';

// ── Persistent gallery cache (same logic as server.ts) ───────────────────────
const GALLERY_CACHE_FILE = '/tmp/ebsumsa-gallery-cache.json';
type CacheShape = { items: unknown[]; at: number };

function readCache(): CacheShape | null {
  try { return JSON.parse(fs.readFileSync(GALLERY_CACHE_FILE, 'utf8')) as CacheShape; }
  catch { return null; }
}
function writeCache(data: CacheShape) {
  try { fs.writeFileSync(GALLERY_CACHE_FILE, JSON.stringify(data)); } catch { /* ignore */ }
}

// ── Helper: parse JSON body ───────────────────────────────────────────────────
async function parseBody(req: import('http').IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

// ── Helper: read raw body as string ──────────────────────────────────────────
async function rawBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', () => resolve(''));
  });
}

// ── Helper: send JSON ─────────────────────────────────────────────────────────
function json(res: import('http').ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

export function apiPlugin(): Plugin {
  return {
    name: 'vite-api-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        const method = req.method?.toUpperCase() ?? 'GET';

        // Only intercept /api/* routes
        if (!url.startsWith('/api/')) return next();

        // CORS pre-flight
        if (method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          return res.end();
        }

        const env = (process as NodeJS.Process & { env: Record<string, string | undefined> }).env;
        const cloudName  = env.VITE_CLOUDINARY_CLOUD_NAME || 'dsqjg9mfg';
        const apiKey     = env.VITE_CLOUDINARY_API_KEY    || '731583139833111';
        const apiSecret  = env.VITE_CLOUDINARY_API_SECRET || '5Kbu5rq0DcwEbqlWXTD58Mk4dOw';

        // ── GET /api/gallery-list ──────────────────────────────────────────
        if (url === '/api/gallery-list' && method === 'GET') {
          const staleCache = readCache();
          try {
            const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
            const search = (type: string) =>
              fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
                method: 'POST',
                headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  expression: `folder:ebsu_gallery AND resource_type:${type}`,
                  sort_by: [{ created_at: 'desc' }],
                  max_results: 500,
                  with_field: ['context', 'tags'],
                }),
              });

            const [imgRes, vidRes] = await Promise.all([search('image'), search('video')]);
            type Res = { resources?: CloudRes[]; error?: { message: string } };
            type CloudRes = { secure_url: string; public_id: string; created_at: string; bytes: number; context?: { custom?: { category?: string; caption?: string } } };
            const imgData: Res = imgRes.ok ? await imgRes.json() : { resources: [], error: { message: `HTTP ${imgRes.status}` } };
            const vidData: Res = vidRes.ok ? await vidRes.json() : { resources: [], error: { message: `HTTP ${vidRes.status}` } };

            if (imgData.error || vidData.error) {
              const errMsg = imgData.error?.message || vidData.error?.message;
              console.warn('[api-plugin] Cloudinary error:', errMsg);
              if (staleCache) return json(res, 200, { items: staleCache.items, stale: true });
              return json(res, 200, { items: [], error: errMsg });
            }

            const map = (resources: CloudRes[], t: 'image' | 'video') =>
              resources.map((r) => ({
                url: r.secure_url, publicId: r.public_id,
                category: r.context?.custom?.category || 'general',
                caption: r.context?.custom?.caption || '',
                type: t, uploadedAt: r.created_at, size: r.bytes,
              }));

            const items = [
              ...map(imgData.resources || [], 'image'),
              ...map(vidData.resources || [], 'video'),
            ].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

            writeCache({ items, at: Date.now() });
            return json(res, 200, { items });
          } catch (err) {
            if (staleCache) return json(res, 200, { items: staleCache.items, stale: true });
            return json(res, 500, { error: err instanceof Error ? err.message : String(err) });
          }
        }

        // ── POST /api/gallery-cache ────────────────────────────────────────
        if (url === '/api/gallery-cache' && method === 'POST') {
          const body = await parseBody(req);
          const item = body.item as Record<string, unknown> | undefined;
          if (!item?.publicId) return json(res, 400, { error: 'item with publicId required' });
          const existing = readCache();
          if (!existing) return json(res, 200, { added: false, reason: 'no_cache' });
          const deduped = (existing.items as Array<Record<string, unknown>>).filter((i) => i.publicId !== item.publicId);
          writeCache({ items: [item, ...deduped], at: existing.at });
          return json(res, 200, { added: true });
        }

        // ── DELETE /api/gallery-cache ──────────────────────────────────────
        if (url === '/api/gallery-cache' && method === 'DELETE') {
          const body = await parseBody(req);
          const { publicId } = body as { publicId?: string };
          if (publicId) {
            const existing = readCache();
            if (existing) {
              const updated = { items: (existing.items as Array<Record<string, unknown>>).filter((i) => i.publicId !== publicId), at: existing.at };
              writeCache(updated);
              return json(res, 200, { cleared: false, removed: publicId, remaining: updated.items.length });
            }
          } else {
            if (fs.existsSync(GALLERY_CACHE_FILE)) fs.unlinkSync(GALLERY_CACHE_FILE);
          }
          return json(res, 200, { cleared: true });
        }

        // ── DELETE /api/gallery-upload ─────────────────────────────────────
        if (url === '/api/gallery-upload' && method === 'DELETE') {
          const rawText = await rawBody(req);
          let body: { publicId?: string; resourceType?: string } = {};
          try { body = JSON.parse(rawText || '{}'); } catch { /* ignore */ }
          const { publicId, resourceType = 'image' } = body;
          if (!publicId) return json(res, 400, { error: 'publicId required' });

          const timestamp = Math.floor(Date.now() / 1000);
          const signature = crypto.createHash('sha1')
            .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
            .digest('hex');

          const form = new URLSearchParams();
          form.append('public_id', publicId);
          form.append('timestamp', String(timestamp));
          form.append('api_key', apiKey);
          form.append('signature', signature);

          const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: 'POST', body: form });
          const d = await r.json() as { result?: string; error?: { message: string } };
          if (d.error) return json(res, 500, { error: d.error.message });
          if (d.result !== 'ok' && d.result !== 'not found') return json(res, 500, { error: `Cloudinary returned: ${d.result ?? 'unknown'}` });
          return json(res, 200, { success: true });
        }

        // ── GET /api/imagekit-auth ─────────────────────────────────────────
        if (url === '/api/imagekit-auth' && method === 'GET') {
          const privateKey = env.IMAGEKIT_PRIVATE_KEY;
          if (!privateKey) return json(res, 500, { error: 'ImageKit private key not configured' });
          const token = crypto.randomUUID();
          const expire = Math.floor(Date.now() / 1000) + 2400;
          const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');
          return json(res, 200, { token, expire, signature });
        }

        // ── GET /api/paystack-banks ────────────────────────────────────────
        if (url === '/api/paystack-banks' && method === 'GET') {
          const SECRET = env.PAYSTACK_SECRET_KEY;
          if (!SECRET) return json(res, 500, { error: 'Paystack secret key not configured' });
          let allBanks: unknown[] = [];
          let page = 1, hasMore = true;
          while (hasMore) {
            const r = await fetch(`https://api.paystack.co/bank?currency=NGN&perPage=100&page=${page}`, { headers: { Authorization: `Bearer ${SECRET}` } });
            const d = await r.json() as { status: boolean; data: unknown[]; meta?: { next?: null }; message?: string };
            if (!d.status) return json(res, 500, { error: d.message || 'Failed to fetch banks' });
            allBanks = [...allBanks, ...d.data];
            hasMore = d.meta?.next !== null && d.data.length === 100;
            page++;
          }
          (allBanks as Array<{ name: string }>).sort((a, b) => a.name.localeCompare(b.name));
          return json(res, 200, { banks: allBanks });
        }

        // ── GET /api/paystack-resolve-account ─────────────────────────────
        if (url.startsWith('/api/paystack-resolve-account') && method === 'GET') {
          const SECRET = env.PAYSTACK_SECRET_KEY;
          if (!SECRET) return json(res, 500, { error: 'Paystack secret key not configured' });
          const qs = new URL(url, 'http://localhost').searchParams;
          const account_number = qs.get('account_number');
          const bank_code = qs.get('bank_code');
          if (!account_number || !bank_code) return json(res, 400, { error: 'account_number and bank_code are required' });
          const r = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`, { headers: { Authorization: `Bearer ${SECRET}` } });
          const d = await r.json() as { status: boolean; data: { account_name: string; account_number: string }; message?: string };
          if (!d.status) return json(res, 400, { error: d.message || 'Could not resolve account' });
          return json(res, 200, { account_name: d.data.account_name, account_number: d.data.account_number });
        }

        // ── POST /api/paystack-transfer ────────────────────────────────────
        if (url === '/api/paystack-transfer' && method === 'POST') {
          const SECRET = env.PAYSTACK_SECRET_KEY;
          if (!SECRET) return json(res, 500, { error: 'Paystack secret key not configured' });
          const body = await parseBody(req) as { account_number?: string; bank_code?: string; account_name?: string; amount?: number; narration?: string };
          const { account_number, bank_code, account_name, amount, narration } = body;
          if (!account_number || !bank_code || !account_name || !amount) return json(res, 400, { error: 'account_number, bank_code, account_name and amount are required' });
          const amountInKobo = Math.round(Number(amount) * 100);
          if (amountInKobo < 100) return json(res, 400, { error: 'Minimum transfer amount is ₦1' });
          const recipientRes = await fetch('https://api.paystack.co/transferrecipient', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'nuban', name: account_name, account_number, bank_code, currency: 'NGN' }) });
          const recipientData = await recipientRes.json() as { status: boolean; data: { recipient_code: string }; message?: string };
          if (!recipientData.status) return json(res, 400, { error: recipientData.message || 'Failed to create recipient' });
          const transferRes = await fetch('https://api.paystack.co/transfer', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'balance', amount: amountInKobo, recipient: recipientData.data.recipient_code, reason: narration || 'EBSUMSA Admin Transfer' }) });
          const transferData = await transferRes.json() as { status: boolean; data: { transfer_code: string; reference: string; status: string }; message?: string };
          if (!transferData.status) return json(res, 400, { error: transferData.message || 'Transfer failed' });
          return json(res, 200, { success: true, transfer_code: transferData.data.transfer_code, reference: transferData.data.reference, status: transferData.data.status, amount: amountInKobo / 100, recipient: account_name });
        }

        // ── POST /api/paystack-finalize-transfer ──────────────────────────
        if (url === '/api/paystack-finalize-transfer' && method === 'POST') {
          const SECRET = env.PAYSTACK_SECRET_KEY;
          if (!SECRET) return json(res, 500, { error: 'Paystack secret key not configured' });
          const body = await parseBody(req) as { transfer_code?: string; otp?: string };
          const { transfer_code, otp } = body;
          if (!transfer_code || !otp) return json(res, 400, { error: 'transfer_code and otp are required' });
          const r = await fetch('https://api.paystack.co/transfer/finalize_transfer', { method: 'POST', headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ transfer_code, otp }) });
          const d = await r.json() as { status: boolean; data: { transfer_code: string; reference: string; status: string }; message?: string };
          if (!d.status) return json(res, 400, { error: d.message || 'Failed to finalize transfer' });
          return json(res, 200, { success: true, transfer_code: d.data.transfer_code, reference: d.data.reference, status: d.data.status });
        }

        // ── POST /api/send-id-registration ────────────────────────────────
        if (url === '/api/send-id-registration' && method === 'POST') {
          const RESEND_API_KEY = env.RESEND_API_KEY || 're_CeSJZxNW_GbDsznNnR7LF8g2vheQMPBSe';
          const ADMIN_EMAILS = ['patronkwo@gmail.com', 'oohveeyuu070@gmail.com'];
          const body = await parseBody(req) as Record<string, string | number>;
          const { firstName, surname, email, phoneNumber, dateOfBirth, level, classSet, registrationNumber, photoUrl, paymentReference, paymentAmount } = body;
          const formattedAmount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(Number(paymentAmount) || 100);

          const [adminRes, userRes] = await Promise.all([
            fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` }, body: JSON.stringify({ from: 'EBSU MSA <onboarding@resend.dev>', to: ADMIN_EMAILS, subject: `New ID Card Registration - ${firstName} ${surname}`, html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#16a34a;">New ID Card Registration</h2><img src="${photoUrl}" alt="Student Photo" style="width:150px;height:180px;object-fit:cover;border-radius:8px;" /><table style="width:100%;border-collapse:collapse;margin-top:16px;"><tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;">Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${firstName} ${surname}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${email}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;">Phone</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${phoneNumber}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;">DOB</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${dateOfBirth}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;">Level</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${level}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;">Class Set</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${classSet}</td></tr><tr><td style="padding:8px;font-weight:bold;">Reg No.</td><td style="padding:8px;">${registrationNumber}</td></tr></table><div style="background:#dcfce7;border:1px solid #16a34a;border-radius:8px;padding:15px;margin:20px 0;"><strong>Payment:</strong> ${formattedAmount} — Ref: ${paymentReference || 'N/A'}</div></div>` }) }),
            fetch('https://api.resend.com/emails', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` }, body: JSON.stringify({ from: 'EBSU MSA <onboarding@resend.dev>', to: [email], subject: 'ID Card Registration Confirmed - EBSUMSA', html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h2 style="color:#16a34a;">Registration Confirmed!</h2><p>Dear ${firstName}, your ID card registration has been received. We will process it within 2 weeks.</p><div style="background:#dcfce7;border:1px solid #16a34a;border-radius:8px;padding:15px;"><strong>Payment:</strong> ${formattedAmount} confirmed<br/><strong>Reference:</strong> ${paymentReference || 'N/A'}</div></div>` }) }),
          ]);
          return json(res, 200, { success: true, adminEmailSent: adminRes.ok, userEmailSent: userRes.ok });
        }

        // Unknown /api/* route
        return json(res, 404, { error: `No API handler for ${method} ${url}` });
      });
    },
  };
}
