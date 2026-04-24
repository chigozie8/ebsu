import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { notifyUser } from '../../../helpers/notifyUser';
import { Spinner } from '../../../components/loaders/Spinner';
import { motion } from 'framer-motion';
import { fadeInVariants5 } from '../../../animation/variants';
import HangingBanner3D from '../../../components/home/HangingBanner3D';

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
  { bg: '#f59e0b', text: '#ffffff', label: 'Amber' },
  { bg: '#ec4899', text: '#ffffff', label: 'Pink' },
  { bg: '#10b981', text: '#ffffff', label: 'Emerald' },
];

const FONT_SIZES = [18, 24, 28, 32, 36, 42];
const DURATIONS = [5, 10, 15, 20, 30, 45, 60];

const SETUP_SQL = `CREATE TABLE IF NOT EXISTS public.hanging_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 15 CHECK (duration BETWEEN 5 AND 60),
  bg_color VARCHAR(7) NOT NULL DEFAULT '#00875a',
  text_color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
  font_size INTEGER NOT NULL DEFAULT 28 CHECK (font_size BETWEEN 18 AND 48),
  font_weight VARCHAR(20) NOT NULL DEFAULT 'bold' CHECK (font_weight IN ('normal','bold','bolder')),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.hanging_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view banners" ON public.hanging_banners FOR SELECT USING (true);
CREATE POLICY "Allow all operations" ON public.hanging_banners FOR ALL USING (true) WITH CHECK (true);`;

export default function AdminBannerManager() {
  const [banners, setBanners] = useState<BannerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewActive, setPreviewActive] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [tableNotFound, setTableNotFound] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Fetch banners
  useEffect(() => {
    fetchBanners();
  }, []);

  const isTableMissingError = (error: { code?: string; message?: string } | null) => {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    const code = error.code || '';
    return (
      code === '42P01' ||
      code === 'PGRST116' ||
      msg.includes('does not exist') ||
      msg.includes('relation') ||
      msg.includes('undefined') ||
      msg.includes('not found')
    );
  };

  const fetchBanners = async () => {
    setLoading(true);
    setTableNotFound(false);
    try {
      const { data, error } = await supabase
        .from('hanging_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Show the SQL setup panel for any error that looks like a missing table
        setTableNotFound(true);
        return;
      }
      setBanners(data || []);
    } catch {
      // Network / auth error — show setup panel so user knows what to do
      setTableNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SETUP_SQL).then(() => {
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    });
  };

  const handleSave = async () => {
    if (!form.text.trim()) {
      notifyUser('error', 'Banner text is required');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Update existing banner
        const { error } = await supabase
          .from('hanging_banners')
          .update({
            ...form,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) {
          if (isTableMissingError(error)) { setTableNotFound(true); return; }
          throw error;
        }
        notifyUser('success', 'Banner updated successfully');
      } else {
        // Create new banner
        const { error } = await supabase.from('hanging_banners').insert({
          ...form,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) {
          if (isTableMissingError(error)) { setTableNotFound(true); return; }
          throw error;
        }
        notifyUser('success', 'Banner created successfully');
      }

      await fetchBanners();
      setForm(EMPTY_FORM);
      setEditingId(null);
      setPreviewActive(false);
    } catch (err: any) {
      if (isTableMissingError(err)) {
        setTableNotFound(true);
      } else {
        notifyUser('error', 'Failed to save banner');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (banner: BannerConfig) => {
    setEditingId(banner.id || null);
    setForm(banner);
    setPreviewActive(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase.from('hanging_banners').delete().eq('id', id);

      if (error) throw error;
      notifyUser('success', 'Banner deleted successfully');
      await fetchBanners();
    } catch (err) {
      console.error('Error deleting banner:', err);
      notifyUser('error', 'Failed to delete banner');
    }
  };

  const handleToggleActive = async (banner: BannerConfig) => {
    if (!banner.id) return;

    setTogglingId(banner.id);
    try {
      // If activating this banner, deactivate all others
      if (!banner.is_active) {
        await supabase.from('hanging_banners').update({ is_active: false }).neq('id', banner.id);
      }

      const { error } = await supabase
        .from('hanging_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;
      await fetchBanners();
      notifyUser('success', banner.is_active ? 'Banner deactivated' : 'Banner activated');
    } catch (err) {
      console.error('Error toggling banner:', err);
      notifyUser('error', 'Failed to toggle banner');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCancel = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPreviewActive(false);
  };

  // Table doesn't exist yet — show the setup SQL
  if (tableNotFound) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <svg className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-rose-800">Database table not found</p>
            <p className="text-xs text-rose-700 mt-1">
              The <code className="bg-rose-100 px-1 rounded font-mono">hanging_banners</code> table does not exist in your Supabase project yet.
              Copy the SQL below, go to your <strong>Supabase Dashboard → SQL Editor</strong>, paste it and click <strong>Run</strong>.
              Then come back and refresh.
            </p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-xs font-mono text-gray-400">SQL — Run in Supabase SQL Editor</span>
            <button
              onClick={handleCopySQL}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#00875a] text-white text-xs font-semibold hover:bg-[#00875a]/90 transition-colors"
            >
              {sqlCopied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy SQL
                </>
              )}
            </button>
          </div>
          <pre className="text-xs text-green-400 font-mono p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap">{SETUP_SQL}</pre>
        </div>

        <button
          onClick={fetchBanners}
          className="flex items-center gap-2 px-4 py-2 bg-[#00875a] text-white rounded-xl text-sm font-semibold hover:bg-[#00875a]/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry after running SQL
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={fadeInVariants5} initial="hidden" animate="visible" className="space-y-6">
      {/* Preview Section */}
      {previewActive && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="bg-white rounded-lg p-4 min-h-[200px] flex items-center justify-center">
            <HangingBanner3D
              config={{
                ...form,
                is_active: true,
              }}
              onComplete={() => console.log('Banner animation complete')}
            />
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-6">
          {editingId ? 'Edit Banner' : 'Create New Banner'}
        </h3>

        <div className="space-y-6">
          {/* Banner Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner Text</label>
            <input
              type="text"
              value={form.text}
              onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="e.g., Merry Christmas 🎄"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green1 focus:border-transparent outline-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Display Duration: {form.duration}s
            </label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setForm((prev) => ({ ...prev, duration: d }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.duration === d
                      ? 'bg-green1 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Font Size: {form.font_size}px
            </label>
            <div className="flex flex-wrap gap-2">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setForm((prev) => ({ ...prev, font_size: size }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.font_size === size
                      ? 'bg-green1 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Font Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Font Weight</label>
            <div className="flex gap-2">
              {(['normal', 'bold', 'bolder'] as const).map((weight) => (
                <button
                  key={weight}
                  onClick={() => setForm((prev) => ({ ...prev, font_weight: weight }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    form.font_weight === weight
                      ? 'bg-green1 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{ fontWeight: weight }}
                >
                  {weight}
                </button>
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Background Color</label>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.bg}
                  onClick={() => setForm((prev) => ({ ...prev, bg_color: color.bg, text_color: color.text }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border-2 ${
                    form.bg_color === color.bg && form.text_color === color.text
                      ? 'border-gray-800 scale-105'
                      : 'border-transparent'
                  }`}
                  style={{
                    backgroundColor: color.bg,
                    color: color.text,
                  }}
                  title={color.label}
                >
                  {color.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom BG Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.bg_color}
                  onChange={(e) => setForm((prev) => ({ ...prev, bg_color: e.target.value }))}
                  className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                />
                <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                  {form.bg_color}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.text_color}
                  onChange={(e) => setForm((prev) => ({ ...prev, text_color: e.target.value }))}
                  className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                />
                <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                  {form.text_color}
                </span>
              </div>
            </div>
          </div>

          {/* Preview Button */}
          <button
            onClick={() => setPreviewActive(!previewActive)}
            className="w-full px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors"
          >
            {previewActive ? 'Hide Preview' : 'Show Preview'}
          </button>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-lg bg-green1 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {saving && <Spinner className="w-4 h-4" />}
              {editingId ? 'Update Banner' : 'Create Banner'}
            </button>
            {editingId && (
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banners List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">No banners created yet</p>
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
                      <div
                        className="px-3 py-1.5 rounded-lg text-sm font-medium w-fit text-white"
                        style={{
                          backgroundColor: banner.bg_color,
                          color: banner.text_color,
                        }}
                      >
                        {banner.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{banner.duration}s</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{banner.font_size}px</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(banner)}
                        disabled={togglingId === banner.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          banner.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
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
