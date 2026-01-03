import { useState } from "react";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (name: string) => void;
}

export default function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [newRoomName, setNewRoomName] = useState("");

  const handleCreate = () => {
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName);
      setNewRoomName("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 sm:p-6 w-full max-w-md border border-gray-700/50 shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          Create a Room
        </h3>
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Enter room name..."
          className="w-full px-4 py-3 bg-gray-900/80 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-gray-700/50 focus:border-indigo-500/50 mb-5 transition-all duration-200 shadow-inner"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-900/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            Create
          </button>
          <button
            onClick={() => {
              onClose();
              setNewRoomName("");
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
