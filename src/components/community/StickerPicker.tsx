import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StickerPickerProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Returns an emoji string (or a fake sticker object for backward compat) */
  onSelectSticker: (sticker: { id: string; image_url: string; name: string }) => void;
}

// ── Emoji categories ──────────────────────────────────────────────────────────

const EMOJI_CATEGORIES: { label: string; icon: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    icon: '😊',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
      '😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
      '🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫',
      '🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬',
      '🤥','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤧',
      '🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓',
      '🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺',
      '😦','😧','😨','😰','😥','😢','😭','😱','😖','😣',
      '😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈',
      '👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾',
    ],
  },
  {
    label: 'Gestures',
    icon: '👋',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞',
      '🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍',
      '👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝',
      '🙏','✍️','💅','🤳','💪','🦾','🦵','🦶','👂','🦻',
      '👃','🫀','🫁','🧠','🦷','🦴','👀','👁️','👅','👄',
    ],
  },
  {
    label: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
      '❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝',
      '💟','☮️','✝️','☯️','🕉️','☪️','🔯','🛐','⛎','♈',
    ],
  },
  {
    label: 'People',
    icon: '🧑',
    emojis: [
      '👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓',
      '👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇',
      '🤦','🤷','👮','🕵️','💂','🥷','👷','🤴','👸','👳',
      '👲','🧕','🤵','👰','🤰','🤱','👼','🎅','🤶','🦸',
      '🦹','🧙','🧚','🧛','🧜','🧝','🧞','🧟','🧌','💆',
    ],
  },
  {
    label: 'Animals',
    icon: '🐶',
    emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
      '🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧',
      '🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄',
      '🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷️','🦂',
      '🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀',
    ],
  },
  {
    label: 'Food',
    icon: '🍕',
    emojis: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐',
      '🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑',
      '🥦','🥬','🥒','🌶️','🫑','🧄','🧅','🥔','🍠','🫘',
      '🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞',
      '🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕',
      '🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕',
      '🍜','🍝','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚',
      '🍘','🍥','🥮','🍢','🧁','🍰','🎂','🍮','🍭','🍬',
    ],
  },
  {
    label: 'Activities',
    icon: '⚽',
    emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱',
      '🏓','🏸','🏒','🥍','🏑','🏏','🪃','🥅','⛳','🪁',
      '🎣','🤿','🎽','🎿','🛷','🥌','🎯','🪀','🪆','🎮',
      '🎲','🧩','🪄','🎭','🎨','🖼️','🎪','🤹','🎠','🎡',
      '🎢','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺',
    ],
  },
  {
    label: 'Travel',
    icon: '✈️',
    emojis: [
      '✈️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🚢','🚂',
      '🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚞','🚝',
      '🚋','🚌','🚍','🚎','🏎️','🚐','🚑','🚒','🛻','🚚',
      '🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏧','🏨','🏩',
      '🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪',
    ],
  },
  {
    label: 'Symbols',
    icon: '✨',
    emojis: [
      '✨','⭐','🌟','💫','⚡','🌈','🌊','🔥','💥','🌀',
      '🌙','☀️','⛅','🌤️','🌦️','🌧️','🌨️','❄️','⛄','🌬️',
      '💨','💧','🌊','🎆','🎇','🧨','✨','🎉','🎊','🎈',
      '🎀','🎁','🎗️','🎟️','🏆','🥇','🥈','🥉','🏅','🎖️',
      '💯','🔑','🗝️','🔐','🔒','🔓','🔔','🔕','🔇','🔈',
    ],
  },
];

export const StickerPicker: React.FC<StickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
}) => {
  const [activeCategory, setActiveCategory] = useState(0);

  const handleSelect = (emoji: string) => {
    onSelectSticker({ id: emoji, image_url: emoji, name: emoji });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-50 bg-white rounded-t-2xl shadow-2xl"
            style={{ maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 flex-shrink-0">
              <p className="text-[13px] font-semibold text-[#111b21]">Emoji</p>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex overflow-x-auto scrollbar-hide gap-1 px-3 py-2 border-b border-gray-100 flex-shrink-0">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(i)}
                  className={`flex-shrink-0 text-xl px-2 py-1.5 rounded-xl transition-all ${
                    activeCategory === i
                      ? 'bg-[#25D366]/15 ring-1 ring-[#25D366]/30 scale-110'
                      : 'hover:bg-gray-100'
                  }`}
                  title={cat.label}
                >
                  {cat.icon}
                </button>
              ))}
            </div>

            {/* Emoji grid */}
            <div className="overflow-y-auto flex-1 p-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {EMOJI_CATEGORIES[activeCategory].label}
              </p>
              <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelect(emoji)}
                    className="text-2xl p-1.5 rounded-xl hover:bg-gray-100 active:bg-[#25D366]/10 active:scale-90 transition-all leading-none"
                    style={{ lineHeight: 1 }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
