import { useState } from "react";
import { Room, Invitation } from "@/lib/custom-client";

interface SidebarProps {
  rooms: Room[];
  selectedRoom: string | null;
  onSelectRoom: (roomId: string) => void;
  onOpenCreateRoom: () => void;
  onOpenJoinRoom: () => void;
  onOpenStartDM: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  userId: string;
  displayName?: string;
  invitations: Invitation[];
  onAcceptInvitation: (roomId: string) => void;
  onRejectInvitation: (roomId: string) => void;
  onLeaveRoom: (roomId: string) => void;
}

type NavSection = "rooms" | "dms" | "invitations" | "discover";

export default function Sidebar({
  rooms,
  selectedRoom,
  onSelectRoom,
  onOpenCreateRoom,
  onOpenJoinRoom,
  onOpenStartDM,
  onLogout,
  onOpenSettings,
  userId,
  displayName,
  invitations,
  onAcceptInvitation,
  onRejectInvitation,
  onLeaveRoom,
}: SidebarProps) {
  const [activeSection, setActiveSection] = useState<NavSection>("rooms");
  const [searchQuery, setSearchQuery] = useState("");

  const [status, setStatus] = useState<
    "online" | "away" | "busy" | "invisible"
  >(() => {
    const saved = localStorage.getItem("status") as
      | "online"
      | "away"
      | "busy"
      | "invisible";
    return saved || "online";
  });

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get status display info
  const getStatusInfo = () => {
    switch (status) {
      case "online":
        return {
          emoji: "🟢",
          text: "Online",
          color: "text-green-500",
          bgColor: "bg-green-500",
        };
      case "away":
        return {
          emoji: "🟡",
          text: "Away",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500",
        };
      case "busy":
        return {
          emoji: "🔴",
          text: "Busy",
          color: "text-red-500",
          bgColor: "bg-red-500",
        };
      case "invisible":
        return {
          emoji: "⚫",
          text: "Invisible",
          color: "text-gray-500",
          bgColor: "bg-gray-500",
        };
      default:
        return {
          emoji: "🟢",
          text: "Online",
          color: "text-green-500",
          bgColor: "bg-green-500",
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="w-full sm:w-72 lg:w-64 bg-gray-800 flex flex-col shadow-2xl h-full">
      {/* Header with Search */}
      <div className="px-3 py-3 sm:py-4 border-b border-gray-700/50 bg-gradient-to-b from-gray-800 to-gray-800/95">
        <div className="relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rooms..."
            className="w-full px-3 py-2.5 pl-9 bg-gray-900/80 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-gray-900 placeholder-gray-500 transition-all duration-200 shadow-inner"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-3 text-gray-500 group-focus-within:text-indigo-400 transition-colors duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-2 py-3 border-b border-gray-700/50 flex gap-1.5 bg-gray-800/50">
        <button
          onClick={() => setActiveSection("rooms")}
          className={`flex-1 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
            activeSection === "rooms"
              ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/30 scale-[1.02]"
              : "text-gray-400 hover:text-white hover:bg-gray-700/60 hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          Rooms
        </button>
        <button
          onClick={() => setActiveSection("dms")}
          className={`flex-1 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
            activeSection === "dms"
              ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/30 scale-[1.02]"
              : "text-gray-400 hover:text-white hover:bg-gray-700/60 hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          DMs
        </button>
        <button
          onClick={() => setActiveSection("invitations")}
          className={`relative flex-1 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
            activeSection === "invitations"
              ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/30 scale-[1.02]"
              : "text-gray-400 hover:text-white hover:bg-gray-700/60 hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          Invites
          {invitations.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {invitations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection("discover")}
          className={`flex-1 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
            activeSection === "discover"
              ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-900/30 scale-[1.02]"
              : "text-gray-400 hover:text-white hover:bg-gray-700/60 hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          Discover
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Rooms Section */}
        {activeSection === "rooms" && (
          <>
            {/* Action Buttons */}
            <div className="px-2 py-4 space-y-2.5">
              <button
                onClick={onOpenCreateRoom}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-900/50 hover:scale-[1.02] active:scale-[0.98]"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Room
              </button>
              <button
                onClick={onOpenJoinRoom}
                className="w-full px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Join Room
              </button>
            </div>

            {/* Rooms List */}
            <div className="px-2">
              <div className="text-gray-400 text-xs font-semibold px-2 py-2 uppercase tracking-wide">
                My Rooms{" "}
                {filteredRooms.length > 0 && `(${filteredRooms.length})`}
              </div>
              {filteredRooms.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">
                    {searchQuery ? "No rooms found" : "No rooms yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredRooms.map((room) => (
                    <div key={room.roomId} className="relative group">
                      <button
                        onClick={() => onSelectRoom(room.roomId)}
                        className={`w-full px-3 py-2.5 flex items-center gap-3 rounded-lg transition-all duration-200 ${
                          selectedRoom === room.roomId
                            ? "bg-gradient-to-r from-indigo-600/20 to-indigo-700/20 text-white border border-indigo-500/30 shadow-md shadow-indigo-900/20"
                            : "hover:bg-gray-700/60 text-gray-300 hover:translate-x-0.5"
                        }`}
                      >
                        {/* Room Avatar */}
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg ${
                            selectedRoom === room.roomId
                              ? "shadow-indigo-900/40"
                              : "shadow-black/30"
                          }`}
                        >
                          <span className="text-white font-bold text-sm">
                            {room.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Room Info */}
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-semibold truncate ${
                                selectedRoom === room.roomId ? "text-white" : ""
                              }`}
                            >
                              # {room.name}
                            </p>
                            {room.unreadCount > 0 && (
                              <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md shadow-red-900/40 animate-pulse">
                                {room.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs truncate">
                            {room.memberCount}{" "}
                            {room.memberCount === 1 ? "member" : "members"}
                          </p>
                        </div>
                      </button>

                      {/* Delete button - appears on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Are you sure you want to leave "${room.name}"? This action cannot be undone.`
                            )
                          ) {
                            onLeaveRoom(room.roomId);
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all shadow-md hover:shadow-lg"
                        title="Leave room"
                      >
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* DMs Section */}
        {activeSection === "dms" && (
          <>
            {/* New DM Button */}
            <div className="px-3 py-2 border-b border-gray-700/50">
              <button
                onClick={onOpenStartDM}
                className="w-full px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 hover:shadow-xl hover:shadow-indigo-900/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg
                  className="w-5 h-5"
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
                <span className="font-semibold text-sm">New DM</span>
              </button>
            </div>

            {/* DM Rooms List */}
            <div className="flex-1 overflow-y-auto">
              {rooms
                .filter((r) => r.isDirect)
                .filter((room) =>
                  room.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 text-gray-600"
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
                  <p className="text-sm font-medium">No Direct Messages</p>
                  <p className="text-xs mt-1 text-gray-600">
                    Click &ldquo;New DM&rdquo; to start a conversation
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {rooms
                    .filter((r) => r.isDirect)
                    .filter((room) =>
                      room.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((room) => (
                      <div key={room.roomId} className="relative group">
                        <button
                          onClick={() => onSelectRoom(room.roomId)}
                          className={`w-full px-3 py-2.5 sm:py-3 text-left hover:bg-gray-700/60 transition-all duration-200 flex items-center gap-3 ${
                            selectedRoom === room.roomId
                              ? "bg-gradient-to-r from-indigo-600/20 to-indigo-700/10 border-l-2 border-indigo-500"
                              : ""
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/30">
                            <span className="text-white font-bold text-sm">
                              {room.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-semibold text-sm truncate ${
                                selectedRoom === room.roomId
                                  ? "text-white"
                                  : "text-gray-300 group-hover:text-white"
                              }`}
                            >
                              {room.name}
                            </p>
                            {room.unreadCount > 0 && (
                              <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg shadow-red-900/50">
                                  {room.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>

                        {/* Delete button - appears on hover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `Are you sure you want to delete the conversation with "${room.name}"? This action cannot be undone.`
                              )
                            ) {
                              onLeaveRoom(room.roomId);
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all shadow-md hover:shadow-lg z-10"
                          title="Delete conversation"
                        >
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Invitations Section */}
        {activeSection === "invitations" && (
          <div className="p-3">
            {invitations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-600"
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
                <p className="text-sm font-medium">No Invitations</p>
                <p className="text-xs mt-1 text-gray-600">
                  You don&apos;t have any pending room invitations
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3 px-2">
                  <svg
                    className="w-4 h-4 text-yellow-400"
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
                  <h3 className="text-yellow-400 font-semibold text-xs uppercase tracking-wide">
                    Pending Invitations ({invitations.length})
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.roomId}
                      className="bg-gray-900/50 rounded-lg p-3 border border-yellow-700/30"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <span className="text-white font-bold text-sm">
                            {invitation.roomName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">
                            {invitation.roomName}
                          </p>
                          <p className="text-gray-400 text-xs truncate mt-0.5">
                            from{" "}
                            <span className="text-yellow-400 font-medium">
                              {invitation.inviterName}
                            </span>
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {new Date(
                              invitation.timestamp
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onAcceptInvitation(invitation.roomId)}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => onRejectInvitation(invitation.roomId)}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Discover Section */}
        {activeSection === "discover" && (
          <div className="p-4">
            <div className="text-center text-gray-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto mb-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-sm font-medium">Discover Servers</p>
              <p className="text-xs mt-1 text-gray-600">
                Find and join public rooms
              </p>
            </div>
            <button
              onClick={onOpenJoinRoom}
              className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Join a Room
            </button>
          </div>
        )}
      </div>

      {/* User Controls */}
      <div className="border-t border-gray-700/50 bg-gradient-to-b from-gray-900 to-gray-950 shadow-inner">
        <div className="px-3 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center flex-shrink-0 relative shadow-lg shadow-green-900/40">
              <span className="text-white text-sm font-bold">
                {(displayName || userId).charAt(0).toUpperCase()}
              </span>
              {/* Status indicator */}
              {status !== "invisible" && (
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${statusInfo.bgColor} rounded-full border-2 border-gray-950 shadow-md`}
                ></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">
                {displayName || userId}
              </p>
              <p className={`${statusInfo.color} text-[10px] font-medium`}>
                {statusInfo.text}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/60 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            title="Settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
            title="Logout"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
