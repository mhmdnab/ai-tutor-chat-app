import { Member } from '@/lib/matrix-client';

interface MentionPickerProps {
  members: Member[];
  query: string;
  onSelect: (member: Member) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export default function MentionPicker({
  members,
  query,
  onSelect,
  onClose,
  position
}: MentionPickerProps) {
  const filtered = members
    .filter(m =>
      m.displayName.toLowerCase().includes(query.toLowerCase()) ||
      m.userId.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <>
      {/* Backdrop to close picker */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Mention picker */}
      <div
        className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-50 w-64"
        style={{ left: position.x, top: position.y }}
      >
        <div className="py-2">
          {filtered.map((member) => (
            <button
              key={member.userId}
              onClick={() => onSelect(member)}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {member.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {member.displayName}
                </p>
                <p className="text-gray-400 text-xs truncate">{member.userId}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
