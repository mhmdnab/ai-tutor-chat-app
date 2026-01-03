import { useState, useEffect } from "react";

interface User {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status?: string;
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteUser: (userId: string) => void;
  roomName: string;
}

export default function InviteUserModal({
  isOpen,
  onClose,
  onInviteUser,
  roomName,
}: InviteUserModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("matrix_access_token");
        const response = await fetch(
          `http://localhost:5001/api/users/search?q=${encodeURIComponent(
            searchQuery
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to search users");
        }

        const data = await response.json();
        setSearchResults(data.users || []);
      } catch (err: any) {
        console.error("Error searching users:", err);
        setError("Failed to search users");
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleInvite = (userId: string) => {
    onInviteUser(userId);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-700/50 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Invite User to {roomName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700/50 rounded-lg"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search for users
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type username or name..."
              className="w-full px-4 py-3 pl-10 bg-gray-700/80 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-600 focus:border-indigo-500 transition-all"
              autoFocus
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
          <p className="text-xs text-gray-400 mt-2">
            Search by username, display name, or email
          </p>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm">Searching...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            searchQuery.length >= 2 &&
            searchResults.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-2 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-sm">No users found</p>
              </div>
            )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleInvite(user._id)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-700/60 hover:bg-gray-700 rounded-xl transition-all duration-200 border border-gray-600/50 hover:border-indigo-500/50 group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold">
                      {(user.displayName || user.username)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">{user.displayName}</p>
                    <p className="text-sm text-gray-400">@{user.username}</p>
                  </div>
                  {user.status && (
                    <div
                      className={`w-3 h-3 rounded-full ${
                        user.status === "online"
                          ? "bg-green-500"
                          : user.status === "away"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                  )}
                </button>
              ))}
            </div>
          )}

          {searchQuery.length < 2 && searchQuery.length > 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Type at least 2 characters to search
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              onClose();
            }}
            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
