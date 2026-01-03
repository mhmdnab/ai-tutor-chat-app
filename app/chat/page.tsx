"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  customChatClient,
  Room,
  Message,
  Member,
  Invitation,
} from "@/lib/custom-client";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import MemberList from "@/components/MemberList";
import SettingsModal from "@/components/SettingsModal";
import CreateRoomModal from "@/components/CreateRoomModal";
import JoinRoomModal from "@/components/JoinRoomModal";
import StartDMModal from "@/components/StartDMModal";
import InviteUserModal from "@/components/InviteUserModal";

export default function ChatPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<string>("SYNCING");
  const selectedRoomRef = useRef<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showStartDM, setShowStartDM] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{
    [roomId: string]: string[];
  }>({});
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [displayName, setDisplayName] = useState<string>("");

  // Keep ref in sync with state
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // Apply saved theme on page load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as
      | "dark"
      | "light"
      | "auto"
      | null;
    const theme = savedTheme || "dark";

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
  }, []);

  useEffect(() => {
    const initializeClient = async () => {
      const savedToken = localStorage.getItem("access_token");
      const savedUserId = localStorage.getItem("user_id");

      if (!savedToken || !savedUserId) {
        router.push("/");
        return;
      }

      try {
        // Only initialize if not already logged in
        if (!customChatClient.isLoggedIn()) {
          // Setup event handlers ONCE
          customChatClient.onRoomUpdate = (updatedRooms) => {
            setRooms(updatedRooms);
          };

          customChatClient.onMessage = (message) => {
            // Add message and check for duplicates
            setMessages((prev) => {
              // Avoid duplicates by checking if eventId already exists
              if (prev.some((m) => m.eventId === message.eventId)) {
                return prev;
              }
              return [...prev, message];
            });
          };

          customChatClient.onRoomDataUpdate = async (roomId) => {
            // When reactions, edits, or deletions happen, reload messages for that room
            if (roomId === selectedRoomRef.current) {
              const msgs = await customChatClient.getMessages(roomId, 50);
              const uniqueMsgs = msgs.filter(
                (msg, index, self) =>
                  index === self.findIndex((m) => m.eventId === msg.eventId)
              );
              setMessages(uniqueMsgs);
            }
          };

          customChatClient.onSyncState = (state) => {
            setSyncState(state);
          };

          customChatClient.onTyping = (roomId, userIds) => {
            setTypingUsers((prev) => ({
              ...prev,
              [roomId]: userIds.filter(
                (id) => id !== customChatClient.getUserId()
              ),
            }));
          };

          customChatClient.onInvitation = (invites: Invitation[]) => {
            setInvitations(invites);
          };

          // Login with saved credentials
          await customChatClient.loginWithToken("", savedToken, savedUserId);
        }

        // Load initial invitations
        const invites = customChatClient.getInvitations();
        setInvitations(invites);

        // Load user's display name
        const userDisplayName = await customChatClient.getDisplayName();
        if (userDisplayName) {
          setDisplayName(userDisplayName);
        }

        const roomsList = customChatClient.getRooms();
        setRooms(roomsList);

        // Select first room by default
        if (roomsList.length > 0 && !selectedRoom) {
          setSelectedRoom(roomsList[0].roomId);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to initialize client:", error);
        localStorage.clear();
        router.push("/");
      }
    };

    initializeClient();
    // Only run once on mount, not when selectedRoom changes
  }, [router]);

  useEffect(() => {
    const loadRoomData = async () => {
      if (!selectedRoom) return;

      const msgs = await customChatClient.getMessages(selectedRoom, 50);

      // Remove duplicates by event ID
      const uniqueMsgs = msgs.filter(
        (msg, index, self) =>
          index === self.findIndex((m) => m.eventId === msg.eventId)
      );

      // Replace messages entirely when switching rooms
      setMessages(uniqueMsgs);

      const roomMembers = await customChatClient.getRoomMembers(selectedRoom);
      setMembers(roomMembers);

      // Mark the room as read when entering it
      await customChatClient.markRoomAsRead(selectedRoom);

      // Refresh rooms list to update unread counts
      const updatedRooms = customChatClient.getRooms();
      setRooms(updatedRooms);
    };

    loadRoomData();
  }, [selectedRoom]);

  const handleSendMessage = async (message: string) => {
    if (!selectedRoom || !customChatClient.isLoggedIn()) return;

    try {
      await customChatClient.sendMessage(selectedRoom, message);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please refresh and try again.");
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!selectedRoom || !customChatClient.isLoggedIn()) return;
    try {
      await customChatClient.sendReaction(selectedRoom, messageId, emoji);
    } catch (error) {
      console.error("Failed to react:", error);
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    if (!selectedRoom || !customChatClient.isLoggedIn()) return;
    try {
      await customChatClient.editMessage(selectedRoom, messageId, newContent);
    } catch (error) {
      console.error("Failed to edit message:", error);
      alert("Failed to edit message. Please refresh and try again.");
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!selectedRoom || !customChatClient.isLoggedIn()) return;
    try {
      await customChatClient.deleteMessage(selectedRoom, messageId);
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message. Please refresh and try again.");
    }
  };

  const handleLogout = async () => {
    await customChatClient.logout();
    localStorage.clear();
    router.push("/");
  };

  const handleCreateRoom = async (name: string) => {
    try {
      const roomId = await customChatClient.createRoom(name, "", false);
      setSelectedRoom(roomId);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Please try again.");
    }
  };

  const handleJoinRoom = async (roomIdOrAlias: string) => {
    try {
      const roomId = await customChatClient.joinRoom(roomIdOrAlias);
      setSelectedRoom(roomId);
      // Refresh rooms list
      const updatedRooms = customChatClient.getRooms();
      setRooms(updatedRooms);
    } catch (error) {
      console.error("Failed to join room:", error);
      alert(
        "Failed to join room. Please check the Room ID/Alias and try again."
      );
    }
  };

  const handleCreateDM = async (userId: string) => {
    try {
      const roomId = await customChatClient.createDirectMessage(userId);
      setSelectedRoom(roomId);
      // Refresh rooms list
      const updatedRooms = customChatClient.getRooms();
      setRooms(updatedRooms);
    } catch (error) {
      console.error("Failed to create DM:", error);
      alert(
        "Failed to create direct message. Please check the User ID and try again."
      );
    }
  };

  const handleStartTyping = () => {
    if (selectedRoom) {
      customChatClient.sendTyping(selectedRoom, true);
    }
  };

  const handleStopTyping = () => {
    if (selectedRoom) {
      customChatClient.sendTyping(selectedRoom, false);
    }
  };

  const handleSendFile = async (file: File) => {
    if (!selectedRoom || !customChatClient.isLoggedIn()) return;
    try {
      // Upload the file and get MXC URL
      const mxcUrl = await customChatClient.uploadFile(file);
      // Send file message
      await customChatClient.sendFile(selectedRoom, file, mxcUrl);
    } catch (error) {
      console.error("Failed to send file:", error);
      throw error; // Re-throw to let ChatArea handle the error
    }
  };

  const handleAcceptInvitation = async (roomId: string) => {
    try {
      await customChatClient.acceptInvitation(roomId);
      // Refresh rooms list
      const updatedRooms = customChatClient.getRooms();
      setRooms(updatedRooms);
      // Select the newly joined room
      setSelectedRoom(roomId);
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      alert("Failed to accept invitation. Please try again.");
    }
  };

  const handleRejectInvitation = async (roomId: string) => {
    try {
      await customChatClient.rejectInvitation(roomId);
    } catch (error) {
      console.error("Failed to reject invitation:", error);
      alert("Failed to reject invitation. Please try again.");
    }
  };

  const handleInviteUser = async (userId: string) => {
    if (!selectedRoom) return;
    try {
      await customChatClient.inviteUserToRoom(selectedRoom, userId);
      alert(`Invitation sent to ${userId}`);
    } catch (error) {
      console.error("Failed to invite user:", error);
      alert("Failed to invite user. Please check the User ID and try again.");
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    try {
      await customChatClient.leaveRoom(roomId);

      // If the deleted room was selected, switch to another room or null
      if (selectedRoom === roomId) {
        const updatedRooms = customChatClient.getRooms();
        setRooms(updatedRooms);
        setSelectedRoom(
          updatedRooms.length > 0 ? updatedRooms[0].roomId : null
        );
      } else {
        // Just refresh the rooms list
        const updatedRooms = customChatClient.getRooms();
        setRooms(updatedRooms);
      }
    } catch (error) {
      console.error("Failed to leave room:", error);
      alert("Failed to leave room. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">
            {syncState === "PREPARED"
              ? "Loading rooms..."
              : "Syncing with server..."}
          </p>
        </div>
      </div>
    );
  }

  const currentRoom = rooms.find((r) => r.roomId === selectedRoom);

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${showSidebar ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          rooms={rooms}
          selectedRoom={selectedRoom}
          onSelectRoom={(roomId) => {
            setSelectedRoom(roomId);
            setShowSidebar(false); // Close sidebar on mobile after selection
          }}
          onOpenCreateRoom={() => setShowCreateRoom(true)}
          onOpenJoinRoom={() => setShowJoinRoom(true)}
          onOpenStartDM={() => setShowStartDM(true)}
          onLogout={handleLogout}
          onOpenSettings={() => setShowSettings(true)}
          userId={customChatClient.getUserId() || ""}
          displayName={displayName}
          invitations={invitations}
          onAcceptInvitation={handleAcceptInvitation}
          onRejectInvitation={handleRejectInvitation}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>

      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <ChatArea
        room={currentRoom}
        messages={messages}
        members={members}
        currentUserId={customChatClient.getUserId()}
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onReact={handleReaction}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onToggleMemberList={() => setShowMemberList(!showMemberList)}
        typingUsers={selectedRoom ? typingUsers[selectedRoom] || [] : []}
        onStartTyping={handleStartTyping}
        onStopTyping={handleStopTyping}
        getMediaUrl={(mxcUrl) => customChatClient.getMediaUrl(mxcUrl)}
        fetchAuthenticatedMedia={(mxcUrl) =>
          customChatClient.fetchAuthenticatedMedia(mxcUrl)
        }
      />

      {/* Member List - Hidden on mobile/tablet, visible on desktop */}
      <div
        className={`
          fixed inset-y-0 right-0 z-30 transform transition-transform duration-300 ease-in-out
          xl:relative xl:translate-x-0
          ${showMemberList ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <MemberList
          members={members}
          onInviteUser={
            selectedRoom ? () => setShowInviteUser(true) : undefined
          }
        />
      </div>

      {/* Overlay for mobile member list */}
      {showMemberList && (
        <div
          className="fixed inset-0 bg-black/50 z-20 xl:hidden"
          onClick={() => setShowMemberList(false)}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={customChatClient.getUserId() || ""}
      />

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        onCreateRoom={handleCreateRoom}
      />

      {/* Join Room Modal */}
      <JoinRoomModal
        isOpen={showJoinRoom}
        onClose={() => setShowJoinRoom(false)}
        onJoinRoom={handleJoinRoom}
      />

      {/* Start DM Modal */}
      <StartDMModal
        isOpen={showStartDM}
        onClose={() => setShowStartDM(false)}
        onCreateDM={handleCreateDM}
      />

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={showInviteUser}
        onClose={() => setShowInviteUser(false)}
        onInviteUser={handleInviteUser}
        roomName={currentRoom?.name || "this room"}
      />
    </div>
  );
}
