'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { matrixClient, Room, Message, Member } from '@/lib/matrix-client';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import MemberList from '@/components/MemberList';
import SettingsModal from '@/components/SettingsModal';
import CreateRoomModal from '@/components/CreateRoomModal';
import JoinRoomModal from '@/components/JoinRoomModal';
import StartDMModal from '@/components/StartDMModal';

export default function ChatPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<string>('SYNCING');
  const selectedRoomRef = useRef<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showStartDM, setShowStartDM] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{[roomId: string]: string[]}>({});

  // Keep ref in sync with state
  useEffect(() => {
    selectedRoomRef.current = selectedRoom;
  }, [selectedRoom]);

  // Apply saved theme on page load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | 'auto' | null;
    const theme = savedTheme || 'dark';

    document.documentElement.classList.remove('dark', 'light');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      // Auto mode - use system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.add('light');
      }
    }
  }, []);

  useEffect(() => {
    const initializeClient = async () => {
      const savedToken = localStorage.getItem('matrix_access_token');
      const savedUserId = localStorage.getItem('matrix_user_id');
      const savedHomeserver = localStorage.getItem('matrix_homeserver');

      if (!savedToken || !savedUserId || !savedHomeserver) {
        router.push('/');
        return;
      }

      try {
        // Only initialize if not already logged in
        if (!matrixClient.isLoggedIn()) {
          // Setup event handlers ONCE
          matrixClient.onRoomUpdate = (updatedRooms) => {
            setRooms(updatedRooms);
          };

          matrixClient.onMessage = (message) => {
            // Add message and check for duplicates
            setMessages((prev) => {
              // Avoid duplicates by checking if eventId already exists
              if (prev.some((m) => m.eventId === message.eventId)) {
                return prev;
              }
              return [...prev, message];
            });
          };

          matrixClient.onRoomDataUpdate = async (roomId) => {
            // When reactions, edits, or deletions happen, reload messages for that room
            if (roomId === selectedRoomRef.current) {
              const msgs = await matrixClient.getMessages(roomId, 50);
              const uniqueMsgs = msgs.filter(
                (msg, index, self) =>
                  index === self.findIndex((m) => m.eventId === msg.eventId)
              );
              setMessages(uniqueMsgs);
            }
          };

          matrixClient.onSyncState = (state) => {
            setSyncState(state);
          };

          matrixClient.onTyping = (roomId, userIds) => {
            setTypingUsers(prev => ({
              ...prev,
              [roomId]: userIds.filter(id => id !== matrixClient.getUserId())
            }));
          };

          // Login with saved credentials
          await matrixClient.loginWithToken(savedHomeserver, savedToken, savedUserId);
        }

        const roomsList = matrixClient.getRooms();
        setRooms(roomsList);

        // Select first room by default
        if (roomsList.length > 0 && !selectedRoom) {
          setSelectedRoom(roomsList[0].roomId);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize client:', error);
        localStorage.clear();
        router.push('/');
      }
    };

    initializeClient();
    // Only run once on mount, not when selectedRoom changes
  }, [router]);

  useEffect(() => {
    const loadRoomData = async () => {
      if (!selectedRoom) return;

      const msgs = await matrixClient.getMessages(selectedRoom, 50);

      // Remove duplicates by event ID
      const uniqueMsgs = msgs.filter(
        (msg, index, self) =>
          index === self.findIndex((m) => m.eventId === msg.eventId)
      );

      // Replace messages entirely when switching rooms
      setMessages(uniqueMsgs);

      const roomMembers = matrixClient.getRoomMembers(selectedRoom);
      setMembers(roomMembers);
    };

    loadRoomData();
  }, [selectedRoom]);

  const handleSendMessage = async (message: string) => {
    if (!selectedRoom || !matrixClient.isLoggedIn()) return;

    try {
      await matrixClient.sendMessage(selectedRoom, message);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please refresh and try again.');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!selectedRoom || !matrixClient.isLoggedIn()) return;
    try {
      await matrixClient.sendReaction(selectedRoom, messageId, emoji);
    } catch (error) {
      console.error('Failed to react:', error);
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    if (!selectedRoom || !matrixClient.isLoggedIn()) return;
    try {
      await matrixClient.editMessage(selectedRoom, messageId, newContent);
    } catch (error) {
      console.error('Failed to edit message:', error);
      alert('Failed to edit message. Please refresh and try again.');
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!selectedRoom || !matrixClient.isLoggedIn()) return;
    try {
      await matrixClient.deleteMessage(selectedRoom, messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Please refresh and try again.');
    }
  };

  const handleLogout = async () => {
    await matrixClient.logout();
    localStorage.clear();
    router.push('/');
  };

  const handleCreateRoom = async (name: string) => {
    try {
      const roomId = await matrixClient.createRoom(name, '', false);
      setSelectedRoom(roomId);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  const handleJoinRoom = async (roomIdOrAlias: string) => {
    try {
      const roomId = await matrixClient.joinRoom(roomIdOrAlias);
      setSelectedRoom(roomId);
      // Refresh rooms list
      const updatedRooms = matrixClient.getRooms();
      setRooms(updatedRooms);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Please check the Room ID/Alias and try again.');
    }
  };

  const handleCreateDM = async (userId: string) => {
    try {
      const roomId = await matrixClient.createDirectMessage(userId);
      setSelectedRoom(roomId);
      // Refresh rooms list
      const updatedRooms = matrixClient.getRooms();
      setRooms(updatedRooms);
    } catch (error) {
      console.error('Failed to create DM:', error);
      alert('Failed to create direct message. Please check the User ID and try again.');
    }
  };

  const handleStartTyping = () => {
    if (selectedRoom) {
      matrixClient.sendTyping(selectedRoom, true);
    }
  };

  const handleStopTyping = () => {
    if (selectedRoom) {
      matrixClient.sendTyping(selectedRoom, false);
    }
  };

  const handleSendFile = async (file: File) => {
    if (!selectedRoom || !matrixClient.isLoggedIn()) return;
    try {
      // Upload the file and get MXC URL
      const mxcUrl = await matrixClient.uploadFile(file);
      // Send file message
      await matrixClient.sendFile(selectedRoom, file, mxcUrl);
    } catch (error) {
      console.error('Failed to send file:', error);
      throw error; // Re-throw to let ChatArea handle the error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">
            {syncState === 'PREPARED' ? 'Loading rooms...' : 'Syncing with server...'}
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
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
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
          userId={matrixClient.getUserId() || ''}
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
        currentUserId={matrixClient.getUserId()}
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
        getMediaUrl={(mxcUrl) => matrixClient.getMediaUrl(mxcUrl)}
        fetchAuthenticatedMedia={(mxcUrl) => matrixClient.fetchAuthenticatedMedia(mxcUrl)}
      />

      {/* Member List - Hidden on mobile/tablet, visible on desktop */}
      <div
        className={`
          fixed inset-y-0 right-0 z-30 transform transition-transform duration-300 ease-in-out
          xl:relative xl:translate-x-0
          ${showMemberList ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <MemberList members={members} />
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
        userId={matrixClient.getUserId() || ''}
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
    </div>
  );
}
