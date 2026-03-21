import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { useStickers, CommunitySticker } from '../../hooks/useCommunity';

interface StickerPickerProps {
  onSelect: (sticker: CommunitySticker) => void;
  onClose: () => void;
}

const StickerPicker: React.FC<StickerPickerProps> = ({ onSelect, onClose }) => {
  const { stickers, packs, loading } = useStickers();
  const [activePack, setActivePack] = useState<string>('Reactions');
  const [search, setSearch] = useState('');

  const filtered = stickers.filter((s) => {
    const matchesPack = search ? true : s.pack_name === activePack;
    const matchesSearch = search
      ? s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.emoji_tags || []).some((t) => t.includes(search.toLowerCase()))
      : true;
    return matchesPack && matchesSearch;
  });

  return (
    <div className="absolute bottom-full mb-2 left-0 z-50 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500">
        <span className="text-white font-semibold text-sm">Stickers</span>
        <button onClick={onClose} className="p-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stickers..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50"
          />
        </div>
      </div>

      {/* Pack tabs */}
      {!search && (
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
          {packs.map((pack) => (
            <button
              key={pack}
              onClick={() => setActivePack(pack)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activePack === pack
                  ? 'bg-teal-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pack}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-4 gap-1 px-3 pb-3 max-h-52 overflow-y-auto">
        {loading ? (
          <div className="col-span-4 flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="col-span-4 text-center text-xs text-slate-400 py-4">No stickers found</p>
        ) : (
          filtered.map((sticker) => (
            <button
              key={sticker.id}
              onClick={() => { onSelect(sticker); onClose(); }}
              title={sticker.name}
              className="aspect-square p-1.5 rounded-xl hover:bg-teal-50 hover:scale-110 transition-all flex items-center justify-center group"
            >
              <img
                src={sticker.url}
                alt={sticker.name}
                className="w-10 h-10 object-contain"
                loading="lazy"
              />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default StickerPicker;
