import { useState } from "react";

interface StartDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDM: (userId: string) => void;
}

export default function StartDMModal({ isOpen, onClose, onCreateDM }: StartDMModalProps) {
  const [dmUserId, setDmUserId] = useState("");

  const handleStartDM = () => {
    if (dmUserId.trim()) {
      onCreateDM(dmUserId.trim());
      setDmUserId("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 sm:p-6 w-full max-w-md border border-gray-700/50 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
        <h3 className="text-white text-xl font-bold mb-2 flex items-center gap-3">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          Start a Direct Message
        </h3>
        <p className="text-gray-400 text-sm mb-5 ml-13">
          Enter the Matrix User ID to message
        </p>
        <input
          type="text"
          value={dmUserId}
          onChange={(e) => setDmUserId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStartDM()}
          placeholder="@username:matrix.org"
          className="w-full px-4 py-3 bg-gray-900/80 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-gray-700/50 focus:border-indigo-500/50 mb-5 font-mono text-sm transition-all duration-200 shadow-inner"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={handleStartDM}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-900/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start DM
          </button>
          <button
            onClick={() => {
              onClose();
              setDmUserId("");
            }}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
