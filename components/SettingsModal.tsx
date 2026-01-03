import { useState, useEffect } from "react";
import { customChatClient } from "@/lib/custom-client";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function SettingsModal({ isOpen, onClose, userId }: SettingsModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [theme, setTheme] = useState<"dark" | "light" | "auto">(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | "auto";
    return saved || "dark";
  });
  const [showTimestamps, setShowTimestamps] = useState(() => {
    const saved = localStorage.getItem("showTimestamps");
    return saved !== null ? saved === "true" : true;
  });
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
  const [messageDisplay, setMessageDisplay] = useState<
    "comfortable" | "compact"
  >(() => {
    const saved = localStorage.getItem("messageDisplay") as
      | "comfortable"
      | "compact";
    return saved || "comfortable";
  });

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load display name
      customChatClient.getDisplayName().then((name: string | null) => {
        if (name) setDisplayName(name);
      });
    }
  }, [isOpen]);

  const handleSaveSettings = async () => {
    try {
      let displayNameSaved = false;

      // Save display name if changed
      if (displayName.trim()) {
        await customChatClient.setDisplayName(displayName.trim());
        displayNameSaved = true;
      }

      // Save theme to localStorage and apply it immediately
      localStorage.setItem("theme", theme);
      document.documentElement.classList.remove("dark", "light");
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.add("light");
      } else {
        // Auto mode - use system preference
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.add("light");
        }
      }

      // Save timestamps setting
      localStorage.setItem("showTimestamps", showTimestamps.toString());

      // Save status setting
      localStorage.setItem("status", status);

      // Save message display setting
      localStorage.setItem("messageDisplay", messageDisplay);

      // Trigger storage event for same-window updates
      window.dispatchEvent(new Event("storage"));

      onClose();

      // Show success message with details
      const savedItems = [];
      if (displayNameSaved) savedItems.push("Display name");
      savedItems.push("Theme");
      savedItems.push("Status");
      savedItems.push("Message display");
      savedItems.push("Timestamp preference");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert(`Failed to save some settings: ${error}\n\nPlease try again.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl w-full max-w-2xl border border-gray-700/50 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-700/50 flex items-center justify-between bg-gray-800/50">
          <h3 className="text-white text-lg sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            User Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700/60 transition-all duration-200 p-2 rounded-lg hover:scale-110 active:scale-95"
            title="Close"
          >
            <svg
              className="w-6 h-6"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="space-y-6">
            {/* Account Section */}
            <div>
              <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Account
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                    User ID
                  </label>
                  <div className="mt-1 px-3 py-2 bg-gray-700 rounded text-white text-sm font-mono flex items-center justify-between">
                    <span className="truncate">{userId}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(userId);
                        alert("User ID copied to clipboard!");
                      }}
                      className="ml-2 text-indigo-400 hover:text-indigo-300 text-xs"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                    Display Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Set your display name"
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as
                          | "online"
                          | "away"
                          | "busy"
                          | "invisible"
                      )
                    }
                    className="mt-1 w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="online">🟢 Online</option>
                    <option value="away">🟡 Away</option>
                    <option value="busy">🔴 Busy</option>
                    <option value="invisible">⚫ Invisible</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                Notifications
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700">
                  <span className="text-white text-sm">
                    Enable desktop notifications
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    defaultChecked
                  />
                </label>
                <label className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700">
                  <span className="text-white text-sm">
                    Notification sounds
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    defaultChecked
                  />
                </label>
                <label className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700">
                  <span className="text-white text-sm">
                    Show message preview
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>

            {/* Appearance Section */}
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
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
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                Appearance
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                    Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) =>
                      setTheme(e.target.value as "dark" | "light" | "auto")
                    }
                    className="mt-1 w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide">
                    Message Display
                  </label>
                  <select
                    value={messageDisplay}
                    onChange={(e) =>
                      setMessageDisplay(
                        e.target.value as "comfortable" | "compact"
                      )
                    }
                    className="mt-1 w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </div>
                <label className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700">
                  <span className="text-white text-sm">
                    Show timestamps
                  </span>
                  <input
                    type="checkbox"
                    checked={showTimestamps}
                    onChange={(e) => setShowTimestamps(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Privacy & Security
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700">
                  <span className="text-white text-sm">Read receipts</span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    defaultChecked
                  />
                </label>
                <label className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700">
                  <span className="text-white text-sm">
                    Typing indicators
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    defaultChecked
                  />
                </label>
                <label className="flex items-center justify-between px-3 py-2 bg-gray-700/50 rounded cursor-pointer hover:bg-gray-700">
                  <span className="text-white text-sm">
                    Allow direct messages
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    defaultChecked
                  />
                </label>
              </div>
            </div>

            {/* About */}
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                About
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between px-3 py-2 bg-gray-700/50 rounded">
                  <span className="text-gray-400">Version</span>
                  <span className="text-white">1.0.0</span>
                </div>
                <div className="flex justify-between px-3 py-2 bg-gray-700/50 rounded">
                  <span className="text-gray-400">Platform</span>
                  <span className="text-white font-mono text-xs">
                    Custom Chat
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-5 border-t border-gray-700/50 flex flex-col sm:flex-row gap-2 sm:gap-3 bg-gray-800/50">
          <button
            onClick={handleSaveSettings}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-900/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-6 sm:px-8 bg-gray-700 hover:bg-gray-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 font-medium text-sm sm:text-base shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
