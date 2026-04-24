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
  bgColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'bolder';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const EMPTY_FORM: BannerConfig = {
  text: 'Merry Christmas 🎄',
  duration: 15,
  bgColor: '#00875a',
  textColor: '#ffffff',
  fontSize: 28,
  fontWeight: 'bold',
  isActive: false,
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

export default function AdminBannerManager() {
  const [banners, setBanners] = useState<BannerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewActive, setPreviewActive] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch banners
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hanging_banners')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (err) {
      console.error('Error fetching banners:', err);
      notifyUser('error', 'Failed to load banners');
    } finally {
      setLoading(false);
    }
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
            updatedAt: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        notifyUser('success', 'Banner updated successfully');
      } else {
        // Create new banner
        const { error } = await supabase.from('hanging_banners').insert({
          ...form,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (error) throw error;
        notifyUser('success', 'Banner created successfully');
      }

      await fetchBanners();
      setForm(EMPTY_FORM);
      setEditingId(null);
      setPreviewActive(false);
    } catch (err) {
      console.error('Error saving banner:', err);
      notifyUser('error', 'Failed to save banner');
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
      if (!banner.isActive) {
        await supabase.from('hanging_banners').update({ isActive: false }).neq('id', banner.id);
      }

      const { error } = await supabase
        .from('hanging_banners')
        .update({ isActive: !banner.isActive })
        .eq('id', banner.id);

      if (error) throw error;
      await fetchBanners();
      notifyUser('success', banner.isActive ? 'Banner deactivated' : 'Banner activated');
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
                isActive: true,
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
              Font Size: {form.fontSize}px
            </label>
            <div className="flex flex-wrap gap-2">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setForm((prev) => ({ ...prev, fontSize: size }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.fontSize === size
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
                  onClick={() => setForm((prev) => ({ ...prev, fontWeight: weight }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    form.fontWeight === weight
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
                  onClick={() => setForm((prev) => ({ ...prev, bgColor: color.bg, textColor: color.text }))}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border-2 ${
                    form.bgColor === color.bg && form.textColor === color.text
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
                  value={form.bgColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, bgColor: e.target.value }))}
                  className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                />
                <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                  {form.bgColor}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.textColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, textColor: e.target.value }))}
                  className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                />
                <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                  {form.textColor}
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
                          backgroundColor: banner.bgColor,
                          color: banner.textColor,
                        }}
                      >
                        {banner.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{banner.duration}s</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{banner.fontSize}px</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(banner)}
                        disabled={togglingId === banner.id}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          banner.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {banner.isActive ? 'Active' : 'Inactive'}
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
