import { useState, useEffect, useRef } from 'react';
import { db } from '../../../config/firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { notifyUser } from '../../../helpers/notifyUser';
import { Spinner } from '../../../components/loaders/Spinner';
import { motion } from 'framer-motion';
import { fadeInVariants5 } from '../../../animation/variants';
import gsap from 'gsap';

export interface BannerConfig {
  id?: string;
  text: string;
  duration: number;
  bg_color: string;
  text_color: string;
  font_size: number;
  font_weight: 'normal' | 'bold' | 'bolder';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const EMPTY_FORM: BannerConfig = {
  text: 'Merry Christmas 🎄',
  duration: 15,
  bg_color: '#00875a',
  text_color: '#ffffff',
  font_size: 28,
  font_weight: 'bold',
  is_active: false,
};

const PRESET_COLORS = [
  { bg: '#00875a', text: '#ffffff', label: 'EBSUMSA Green' },
  { bg: '#dc2626', text: '#ffffff', label: 'Christmas Red' },
  { bg: '#1e40af', text: '#ffffff', label: 'Royal Blue' },
  { bg: '#7c3aed', text: '#ffffff', label: 'Violet' },
  { bg: '#0f172a', text: '#ffffff', label: 'Slate Dark' },
  { bg: '#f59e0b', text: '#1a1a1a', label: 'Amber' },
  { bg: '#ec4899', text: '#ffffff', label: 'Pink' },
  { bg: '#10b981', text: '#ffffff', label: 'Emerald' },
];

const FONT_SIZES = [18, 24, 28, 32, 36, 42];
const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

const BULB_COLORS = [
  '#ff1a1a', '#00dd44', '#ffd700', '#2255ff',
  '#ff6600', '#cc00bb', '#ff1a1a', '#00dd44',
];

function adjustBrightness(color: string, percent: number): string {
  const col = color[0] === '#' ? color.slice(1) : color;
  const num = parseInt(col, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
  const B = Math.min(255, Math.max(0, (num & 0xff) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

// ── Inline mini-preview that does NOT use position:fixed ──────────────────
function BannerPreviewInline({ config }: { config: BannerConfig }) {
  const bannerRef = useRef<HTMLDivElement>(null);
  const leftRopeRef = useRef<HTMLDivElement>(null);
  const rightRopeRef = useRef<HTMLDivElement>(null);
  const lightsRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    if (playing) return;
    setPlaying(true);

    const banner = bannerRef.current;
    const leftRope = leftRopeRef.current;
    const rightRope = rightRopeRef.current;
    const lights = lightsRef.current;
    if (!banner || !leftRope || !rightRope || !lights) return;

    gsap.set([leftRope, rightRope], { scaleY: 0, transformOrigin: 'top center' });
    gsap.set(banner, { y: -120, opacity: 0, rotationX: 35 });
    gsap.set(lights, { opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          gsap.to([banner, lights, leftRope, rightRope], {
            opacity: 0, duration: 0.6,
            onComplete: () => {
              gsap.set([leftRope, rightRope], { scaleY: 0 });
              gsap.set(banner, { y: -120, opacity: 0, rotationX: 35 });
              gsap.set(lights, { opacity: 0 });
              setPlaying(false);
            },
          });
        }, 1800);
      },
    });

    tl.to(lights, { opacity: 1, duration: 0.35 }, 0);
    tl.to([leftRope, rightRope], { scaleY: 1, duration: 0.45, ease: 'back.out(1.2)' }, 0.25);
    tl.to(banner, { y: 0, opacity: 1, rotationX: 0, duration: 0.55, ease: 'back.out(1.5)' }, 0.5);
    tl.to(banner, { x: 10, rotationZ: 1.5, duration: 0.8, ease: 'sine.inOut', repeat: 3, yoyo: true }, 1.1);
  };

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ height: '220px' }}>
      <style>{`
        @keyframes twinkle-p {
          0%,100%{opacity:1} 50%{opacity:0.3}
        }
      `}</style>

      {/* Lights row */}
      <div ref={lightsRef} style={{ opacity: 0 }} className="absolute top-0 left-0 right-0 h-10 z-10">
        <div className="absolute top-0.5 left-0 right-0 h-0.5 bg-gray-600" />
        {Array.from({ length: 18 }).map((_, i) => {
          const color = BULB_COLORS[i % BULB_COLORS.length];
          return (
            <div key={i} style={{ position: 'absolute', left: `${((i + 0.5) / 18) * 100}%`, top: '2px', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '1px', height: '5px', background: '#555' }} />
              <div style={{ width: '6px', height: '3px', background: '#999', borderRadius: '2px 2px 0 0' }} />
              <div style={{ width: '9px', height: '12px', backgroundColor: color, borderRadius: '50% 50% 55% 55% / 35% 35% 65% 65%', boxShadow: `0 0 4px 2px ${color}99`, animation: `twinkle-p ${1.1 + (i % 4) * 0.3}s ${(i * 0.13) % 1.5}s infinite ease-in-out` }} />
            </div>
          );
        })}
      </div>

      {/* Ropes + Banner */}
      <div className="absolute inset-0 flex justify-center items-start pt-9" style={{ perspective: '800px' }}>
        <div ref={leftRopeRef} style={{ position: 'absolute', left: '22%', top: '36px', width: '2px', height: '80px', background: 'repeating-linear-gradient(180deg,#6b3a1f 0,#a0652a 5px,#6b3a1f 10px)', borderRadius: '2px', transformOrigin: 'top center' }} />
        <div ref={rightRopeRef} style={{ position: 'absolute', right: '22%', top: '36px', width: '2px', height: '80px', background: 'repeating-linear-gradient(180deg,#6b3a1f 0,#a0652a 5px,#6b3a1f 10px)', borderRadius: '2px', transformOrigin: 'top center' }} />
        <div
          ref={bannerRef}
          style={{
            position: 'absolute',
            top: '115px',
            backgroundColor: config.bg_color,
            color: config.text_color,
            padding: '10px 28px',
            borderRadius: '8px',
            fontSize: `${Math.min(config.font_size, 22)}px`,
            fontWeight: config.font_weight,
            whiteSpace: 'nowrap',
            maxWidth: '80%',
            textAlign: 'center',
            background: `linear-gradient(145deg,${config.bg_color} 0%,${adjustBrightness(config.bg_color, -14)} 100%)`,
            border: `2px solid ${adjustBrightness(config.bg_color, -28)}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            opacity: 0,
          }}
        >
          {config.text}
        </div>
      </div>

      {/* Play button overlay */}
      {!playing && (
        <button
          onClick={play}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 hover:bg-black/30 transition-colors z-20"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/50">
            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-white text-xs font-medium">Play Preview</span>
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function AdminBannerManager() {
  const [banners, setBanners] = useState<BannerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BannerConfig>(EMPTY_FORM);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'hanging_banners'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BannerConfig[];
      setBanners(data);
    } catch {
      notifyUser('error', 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.text.trim()) { notifyUser('error', 'Banner text is required'); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (editingId) {
        const { id: _id, ...rest } = form;
        await updateDoc(doc(db, 'hanging_banners', editingId), { ...rest, updated_at: now });
        notifyUser('success', 'Banner updated');
      } else {
        await addDoc(collection(db, 'hanging_banners'), { ...form, created_at: now, updated_at: now });
        notifyUser('success', 'Banner created');
      }
      await fetchBanners();
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch {
      notifyUser('error', 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (banner: BannerConfig) => {
    setEditingId(banner.id || null);
    setForm(banner);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await deleteDoc(doc(db, 'hanging_banners', id));
      notifyUser('success', 'Banner deleted');
      await fetchBanners();
    } catch {
      notifyUser('error', 'Failed to delete banner');
    }
  };

  const handleToggleActive = async (banner: BannerConfig) => {
    if (!banner.id) return;
    setTogglingId(banner.id);
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();

      if (!banner.is_active) {
        // Deactivate all others first
        banners.forEach((b) => {
          if (b.id && b.id !== banner.id && b.is_active) {
            batch.update(doc(db, 'hanging_banners', b.id), { is_active: false, updated_at: now });
          }
        });
      }
      batch.update(doc(db, 'hanging_banners', banner.id), { is_active: !banner.is_active, updated_at: now });
      await batch.commit();
      await fetchBanners();
      notifyUser('success', banner.is_active ? 'Banner deactivated' : 'Banner activated — visible on site now!');
    } catch {
      notifyUser('error', 'Failed to toggle banner');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <motion.div variants={fadeInVariants5} initial="hidden" animate="visible" className="space-y-6">

      {/* Live Preview */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">Live Preview</h3>
            <p className="text-xs text-gray-500 mt-0.5">Click the play button to see the Christmas banner animation</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-medium text-amber-700">Preview Mode</span>
          </div>
        </div>
        <BannerPreviewInline config={form} />
      </div>

      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-6">
          {editingId ? 'Edit Banner' : 'Create New Banner'}
        </h3>
        <div className="space-y-6">

          {/* Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Text</label>
            <input
              type="text"
              value={form.text}
              onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
              placeholder="e.g., Merry Christmas!"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green1 focus:border-transparent outline-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Display Duration: {form.duration}s</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button key={d} onClick={() => setForm((p) => ({ ...p, duration: d }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${form.duration === d ? 'bg-green1 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Font Size: {form.font_size}px</label>
            <div className="flex flex-wrap gap-2">
              {FONT_SIZES.map((size) => (
                <button key={size} onClick={() => setForm((p) => ({ ...p, font_size: size }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${form.font_size === size ? 'bg-green1 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Font Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Font Weight</label>
            <div className="flex gap-2">
              {(['normal', 'bold', 'bolder'] as const).map((w) => (
                <button key={w} onClick={() => setForm((p) => ({ ...p, font_weight: w }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${form.font_weight === w ? 'bg-green1 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  style={{ fontWeight: w }}>
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Color Presets</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button key={color.bg}
                  onClick={() => setForm((p) => ({ ...p, bg_color: color.bg, text_color: color.text }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${form.bg_color === color.bg ? 'border-gray-800 scale-105' : 'border-transparent'}`}
                  style={{ backgroundColor: color.bg, color: color.text }}>
                  {color.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom BG Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.bg_color}
                  onChange={(e) => setForm((p) => ({ ...p, bg_color: e.target.value }))}
                  className="w-full h-10 rounded-lg cursor-pointer border border-gray-300" />
                <span className="flex items-center px-2 bg-gray-100 rounded-lg text-xs text-gray-600 font-mono">{form.bg_color}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Text Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.text_color}
                  onChange={(e) => setForm((p) => ({ ...p, text_color: e.target.value }))}
                  className="w-full h-10 rounded-lg cursor-pointer border border-gray-300" />
                <span className="flex items-center px-2 bg-gray-100 rounded-lg text-xs text-gray-600 font-mono">{form.text_color}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 px-4 py-3 rounded-lg bg-green1 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2">
              {saving && <Spinner className="w-4 h-4" />}
              {editingId ? 'Update Banner' : 'Create Banner'}
            </button>
            {editingId && (
              <button onClick={() => { setForm(EMPTY_FORM); setEditingId(null); }}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banners List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-gray-500 font-medium">No banners yet</p>
          <p className="text-gray-400 text-sm mt-1">Create your first banner above</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Text</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="px-3 py-1.5 rounded-lg text-sm font-medium w-fit"
                        style={{ backgroundColor: banner.bg_color, color: banner.text_color }}>
                        {banner.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{banner.duration}s</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{banner.font_size}px</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleActive(banner)} disabled={togglingId === banner.id}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${banner.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {togglingId === banner.id ? '...' : banner.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(banner)}
                          className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors">Edit</button>
                        <button onClick={() => handleDelete(banner.id!)}
                          className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
