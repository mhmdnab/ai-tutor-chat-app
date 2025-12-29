import { Member } from '@/lib/matrix-client';

interface MemberListProps {
  members: Member[];
}

export default function MemberList({ members }: MemberListProps) {
  return (
    <div className="w-full sm:w-72 xl:w-60 bg-gray-800 border-l border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="h-14 sm:h-16 px-3 sm:px-4 flex items-center border-b border-gray-700 flex-shrink-0">
        <h3 className="text-white font-semibold text-sm sm:text-base">
          Members — {members.length}
        </h3>
      </div>

      {/* Members List */}
      <div className="overflow-y-auto flex-1">
        {members.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No members</p>
          </div>
        ) : (
          <div className="py-2">
            {members.map((member) => (
              <div
                key={member.userId}
                className="px-3 sm:px-4 py-2 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Avatar with online status */}
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs sm:text-sm font-semibold">
                        {member.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {/* Online status indicator */}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs sm:text-sm font-medium truncate">
                      {member.displayName}
                    </p>
                    <p className="text-gray-400 text-[10px] sm:text-xs truncate">
                      {member.membership === 'join' ? 'Online' : member.membership}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
