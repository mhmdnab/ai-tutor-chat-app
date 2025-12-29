interface MessageActionsProps {
  onReact: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isOwnMessage: boolean;
}

export default function MessageActions({
  onReact,
  onEdit,
  onDelete,
  isOwnMessage,
}: MessageActionsProps) {
  return (
    <div className="absolute top-0 right-0 -mt-3 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl shadow-2xl shadow-black/50 flex gap-1 p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm">
      <button
        onClick={onReact}
        className="p-2 hover:bg-indigo-600/20 hover:text-indigo-400 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
        title="Add reaction"
      >
        <svg
          className="w-4 h-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {isOwnMessage && (
        <>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-indigo-600/20 hover:text-indigo-400 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            title="Edit message"
          >
            <svg
              className="w-4 h-4 text-gray-300"
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
          </button>

          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-900/30 hover:text-red-400 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            title="Delete message"
          >
            <svg
              className="w-4 h-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
