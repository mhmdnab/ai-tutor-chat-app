import { useState } from 'react';

interface EditMessageModalProps {
  originalMessage: string;
  onSave: (newMessage: string) => void;
  onCancel: () => void;
}

export default function EditMessageModal({
  originalMessage,
  onSave,
  onCancel,
}: EditMessageModalProps) {
  const [message, setMessage] = useState(originalMessage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && message !== originalMessage) {
      onSave(message.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700/50 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
        <h3 className="text-white text-xl font-bold mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/40">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          Edit Message
        </h3>

        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900/80 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-gray-700/50 focus:border-indigo-500/50 resize-none transition-all duration-200 shadow-inner"
            rows={4}
            autoFocus
          />

          <div className="flex gap-3 mt-5">
            <button
              type="submit"
              disabled={!message.trim() || message === originalMessage}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-900/50 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="text-gray-400 text-xs mt-4 text-center">
          Press ESC to cancel
        </p>
      </div>
    </div>
  );
}
