import { useState } from 'react';

interface ReactionPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👀'];

export default function ReactionPicker({
  onSelectEmoji,
  onClose,
}: ReactionPickerProps) {
  const [customEmoji, setCustomEmoji] = useState('');

  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmoji.trim()) {
      onSelectEmoji(customEmoji.trim());
      onClose();
    }
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl shadow-2xl shadow-black/50 p-4 z-50 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-sm">
      <div className="flex gap-1.5 mb-3">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className="text-2xl hover:scale-125 transition-all duration-200 p-2 hover:bg-indigo-600/20 rounded-lg active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>

      <form onSubmit={handleCustomSubmit} className="flex gap-2 pt-3 border-t border-gray-700/50">
        <input
          type="text"
          value={customEmoji}
          onChange={(e) => setCustomEmoji(e.target.value)}
          placeholder="Or type emoji..."
          className="flex-1 px-3 py-2 bg-gray-900/80 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-gray-700/50 focus:border-indigo-500/50 transition-all duration-200"
          maxLength={2}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-900/40 hover:shadow-xl hover:scale-105 active:scale-95"
        >
          Add
        </button>
      </form>
    </div>
  );
}
