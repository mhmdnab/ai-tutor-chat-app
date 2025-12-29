import { useState, useEffect, useRef, useMemo } from 'react';
import { Room, Message, Member } from '@/lib/matrix-client';
import MessageActions from './MessageActions';
import ReactionPicker from './ReactionPicker';
import EditMessageModal from './EditMessageModal';
import MessageContent from './MessageContent';
import MentionPicker from './MentionPicker';
import ImagePreview from './ImagePreview';
import { debounce, formatTypingUsers } from '@/lib/utils';

interface ChatAreaProps {
  room: Room | undefined;
  messages: Message[];
  members: Member[];
  currentUserId: string | null;
  onSendMessage: (message: string) => void;
  onSendFile: (file: File) => Promise<void>;
  onReact: (messageId: string, emoji: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onToggleSidebar: () => void;
  onToggleMemberList: () => void;
  typingUsers?: string[];
  onStartTyping: () => void;
  onStopTyping: () => void;
  getMediaUrl: (mxcUrl: string) => string;
  fetchAuthenticatedMedia: (mxcUrl: string) => Promise<string>;
}

export default function ChatArea({
  room,
  messages,
  members,
  currentUserId,
  onSendMessage,
  onSendFile,
  onReact,
  onEdit,
  onDelete,
  onToggleSidebar,
  onToggleMemberList,
  typingUsers = [],
  onStartTyping,
  onStopTyping,
  getMediaUrl,
  fetchAuthenticatedMedia
}: ChatAreaProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(() => {
    const saved = localStorage.getItem('showTimestamps');
    return saved !== null ? saved === 'true' : true;
  });
  const [messageDisplay, setMessageDisplay] = useState<'comfortable' | 'compact'>(() => {
    const saved = localStorage.getItem('messageDisplay') as 'comfortable' | 'compact';
    return saved || 'comfortable';
  });
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ x: 0, y: 0 });
  const [mentionStart, setMentionStart] = useState(0);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imagePreviewName, setImagePreviewName] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle image preview
  const handleImageClick = (imageUrl: string, imageName: string) => {
    setImagePreviewUrl(imageUrl);
    setImagePreviewName(imageName);
  };

  const handleCloseImagePreview = () => {
    setImagePreviewUrl(null);
    setImagePreviewName('');
  };

  // Debounced stop typing handler
  const debouncedStopTyping = useMemo(() =>
    debounce(() => {
      onStopTyping();
    }, 3000), [onStopTyping]
  );

  // Handle input change with mention detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    setInputMessage(value);

    // Typing indicator
    if (value.trim()) {
      onStartTyping();
      debouncedStopTyping();
    } else {
      onStopTyping();
    }

    // Detect @ mention
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && lastAtIndex === cursorPos - 1) {
      // Just typed @
      setShowMentionPicker(true);
      setMentionQuery('');
      setMentionStart(lastAtIndex);

      // Calculate position
      const rect = e.target.getBoundingClientRect();
      setMentionPosition({ x: rect.left, y: rect.top - 200 });
    } else if (showMentionPicker && lastAtIndex !== -1) {
      // Typing after @
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      if (query.includes(' ')) {
        setShowMentionPicker(false);
      } else {
        setMentionQuery(query);
      }
    } else if (showMentionPicker) {
      setShowMentionPicker(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (member: Member) => {
    const before = inputMessage.substring(0, mentionStart);
    const after = inputMessage.substring(mentionStart + mentionQuery.length + 1);
    setInputMessage(before + '@' + member.displayName + ' ' + after);
    setShowMentionPicker(false);
    inputRef.current?.focus();
  };

  // Listen for storage changes (when settings are updated in another component)
  useEffect(() => {
    const handleStorageChange = () => {
      const newTimestamps = localStorage.getItem('showTimestamps');
      if (newTimestamps !== null) {
        setShowTimestamps(newTimestamps === 'true');
      }

      const newMessageDisplay = localStorage.getItem('messageDisplay') as 'comfortable' | 'compact';
      if (newMessageDisplay) {
        setMessageDisplay(newMessageDisplay);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    // If there's a file selected, upload and send it
    if (selectedFile && room) {
      setIsUploading(true);
      try {
        await onSendFile(selectedFile);
        // Clear file selection
        setSelectedFile(null);
        if (filePreviewUrl) {
          URL.revokeObjectURL(filePreviewUrl);
          setFilePreviewUrl(null);
        }
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Clear message if it was just used as a caption
        setInputMessage('');
      } catch (error) {
        console.error('Failed to upload file:', error);
        alert('Failed to upload file. Please try again.');
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Otherwise send text message
    if (inputMessage.trim() && room) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !room) return;

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewUrl(previewUrl);
    }

    setSelectedFile(file);

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!room) {
    return (
      <div className="flex-1 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
        <div className="text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-black/30">
            <svg
              className="w-10 h-10 text-gray-400"
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
          </div>
          <h3 className="text-white text-xl font-bold mb-2">No Room Selected</h3>
          <p className="text-gray-400 text-sm">Select a room from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-700 to-gray-800 flex flex-col">
      {/* Room Header */}
      <div className="h-18 px-4 md:px-6 flex items-center justify-between border-b border-gray-600/50 bg-gradient-to-r from-gray-800 to-gray-800/95 shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
          {/* Mobile Menu Button - Sidebar */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700/60 rounded-lg transition-all"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/40 flex-shrink-0">
            <span className="text-white font-bold">
              {room.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-base md:text-lg truncate">{room.name}</h2>
            {room.topic && (
              <p className="text-gray-400 text-xs mt-0.5 truncate hidden sm:block">{room.topic}</p>
            )}
          </div>
        </div>

        {/* Mobile Menu Button - Members */}
        <button
          onClick={onToggleMemberList}
          className="xl:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700/60 rounded-lg transition-all flex-shrink-0"
          aria-label="Toggle member list"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 ${messageDisplay === 'compact' ? 'space-y-1' : 'space-y-4'}`}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].sender !== message.sender;
            const isOwnMessage = message.sender === localStorage.getItem('matrix_user_id');
            const isMentioned = message.mentions?.includes(currentUserId || '');

            return (
              <div
                key={`${message.eventId}-${index}`}
                className={`flex ${messageDisplay === 'compact' ? 'gap-3' : 'gap-4'} group relative hover:bg-gray-800/60 -mx-3 px-4 ${messageDisplay === 'compact' ? 'py-1' : 'py-2.5'} rounded-lg transition-all duration-200 hover:shadow-md ${isMentioned ? 'bg-indigo-900/20 border-l-2 border-indigo-500 pl-3' : ''}`}
              >
                {showAvatar ? (
                  <div className={`${messageDisplay === 'compact' ? 'w-9 h-9' : 'w-11 h-11'} rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-900/30`}>
                    <span className={`text-white font-bold ${messageDisplay === 'compact' ? 'text-sm' : 'text-base'}`}>
                      {message.senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <div className={`${messageDisplay === 'compact' ? 'w-9' : 'w-11'} flex-shrink-0`} />
                )}

                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className={`flex items-baseline gap-2 ${messageDisplay === 'compact' ? 'mb-0' : 'mb-1'}`}>
                      <span className={`font-semibold ${messageDisplay === 'compact' ? 'text-xs' : 'text-sm'} ${isOwnMessage ? 'text-indigo-400' : 'text-white'}`}>
                        {message.senderName}
                      </span>
                      {showTimestamps && (
                        <span className={`text-gray-400 ${messageDisplay === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {message.isEdited && (
                        <span className={`text-gray-500 ${messageDisplay === 'compact' ? 'text-[10px]' : 'text-xs'}`}>(edited)</span>
                      )}
                    </div>
                  )}

                  {message.isDeleted ? (
                    <p className={`text-gray-500 ${messageDisplay === 'compact' ? 'text-xs' : 'text-sm'} italic`}>Message deleted</p>
                  ) : (
                    <>
                      <MessageContent
                        content={message.content}
                        formattedContent={message.formattedContent}
                        format={message.format}
                        type={message.type}
                        fileUrl={message.fileUrl}
                        fileInfo={message.fileInfo}
                        getMediaUrl={getMediaUrl}
                        fetchAuthenticatedMedia={fetchAuthenticatedMedia}
                        onImageClick={handleImageClick}
                        className={`text-gray-200 ${messageDisplay === 'compact' ? 'text-xs' : 'text-sm'} break-words`}
                      />

                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.reactions.map((reaction) => (
                            <button
                              key={reaction.key}
                              onClick={() => onReact(message.eventId, reaction.key)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/50 border border-gray-700/50 rounded-full text-sm transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                            >
                              <span className="text-base">{reaction.key}</span>
                              <span className="text-gray-400 font-semibold text-xs">{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Message Actions */}
                {!message.isDeleted && (
                  <>
                    <MessageActions
                      isOwnMessage={isOwnMessage}
                      onReact={() => setShowReactionPicker(message.eventId)}
                      onEdit={() => setEditingMessage(message)}
                      onDelete={() => {
                        if (confirm('Delete this message?')) {
                          onDelete(message.eventId);
                        }
                      }}
                    />

                    {/* Reaction Picker */}
                    {showReactionPicker === message.eventId && (
                      <div className="absolute bottom-full left-12 mb-2">
                        <ReactionPicker
                          onSelectEmoji={(emoji) => onReact(message.eventId, emoji)}
                          onClose={() => setShowReactionPicker(null)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Edit Message Modal */}
      {editingMessage && (
        <EditMessageModal
          originalMessage={editingMessage.content}
          onSave={(newContent) => {
            onEdit(editingMessage.eventId, newContent);
            setEditingMessage(null);
          }}
          onCancel={() => setEditingMessage(null)}
        />
      )}

      {/* Typing Indicator */}
      {typingUsers && typingUsers.length > 0 && (
        <div className="px-3 sm:px-4 md:px-6 py-2">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
            </span>
            <span>{formatTypingUsers(typingUsers)} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        </div>
      )}

      {/* Mention Picker */}
      {showMentionPicker && (
        <MentionPicker
          members={members}
          query={mentionQuery}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentionPicker(false)}
          position={mentionPosition}
        />
      )}

      {/* Message Input */}
      <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 pt-2 bg-gradient-to-t from-gray-800 to-transparent">
        {isUploading && (
          <div className="mb-3 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
            <div className="flex items-center gap-3 text-indigo-300 text-sm">
              <div className="animate-spin">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span>Uploading file...</span>
            </div>
          </div>
        )}

        {/* File Preview */}
        {selectedFile && !isUploading && (
          <div className="mb-3 px-4 py-3 bg-gray-700/60 border border-gray-600/50 rounded-lg">
            <div className="flex items-start gap-3">
              {/* Preview */}
              <div className="flex-shrink-0">
                {filePreviewUrl ? (
                  <img
                    src={filePreviewUrl}
                    alt={selectedFile.name}
                    className="w-16 h-16 rounded-lg object-cover shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                  {selectedFile.type && ` • ${selectedFile.type.split('/')[1]}`}
                </p>
                <p className="text-xs text-indigo-400 mt-1">Click send to upload</p>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={handleRemoveFile}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                title="Remove file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2 sm:gap-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 bg-gray-600/80 hover:bg-gray-600 disabled:bg-gray-700/50 disabled:cursor-not-allowed text-gray-300 hover:text-white disabled:text-gray-500 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:scale-100 flex-shrink-0"
            title="Attach file or image"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder={selectedFile ? "Add a caption (optional)" : `Message ${room.name}`}
            className="flex-1 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 bg-gray-600/80 text-white text-sm sm:text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-gray-600 border border-gray-600 focus:border-indigo-500/50 transition-all duration-200 shadow-inner placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!selectedFile && !inputMessage.trim()}
            className="px-4 sm:px-6 md:px-7 py-2.5 sm:py-3 md:py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 shadow-lg shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-900/50 disabled:shadow-none hover:scale-105 active:scale-95 disabled:scale-100 flex-shrink-0"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>

      {/* Image Preview Modal */}
      {imagePreviewUrl && (
        <ImagePreview
          imageUrl={imagePreviewUrl}
          imageName={imagePreviewName}
          onClose={handleCloseImagePreview}
        />
      )}
    </div>
  );
}
