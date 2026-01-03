import { Invitation } from "@/lib/custom-client";

interface InvitationsListProps {
  invitations: Invitation[];
  onAccept: (roomId: string) => void;
  onReject: (roomId: string) => void;
}

export default function InvitationsList({
  invitations,
  onAccept,
  onReject,
}: InvitationsListProps) {
  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-900/20 border-b border-yellow-700/30">
      <div className="px-3 sm:px-4 md:px-6 py-3">
        <h3 className="text-yellow-400 font-semibold text-sm mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Room Invitations ({invitations.length})
        </h3>

        <div className="space-y-2">
          {invitations.map((invitation) => (
            <div
              key={invitation.roomId}
              className="bg-gray-800/50 rounded-lg p-3 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {invitation.roomName}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Invited by{" "}
                  <span className="text-indigo-400">
                    {invitation.inviterName}
                  </span>
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {new Date(invitation.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onAccept(invitation.roomId)}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
                  title="Accept invitation"
                >
                  Accept
                </button>
                <button
                  onClick={() => onReject(invitation.roomId)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                  title="Reject invitation"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
