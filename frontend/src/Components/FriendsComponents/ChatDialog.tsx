import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Avatar,
  Box,
  Typography,
  Paper,
  IconButton,
} from "@mui/material";
import { Send, Edit2, Trash2, Check, X, Reply } from "lucide-react";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  replyTo?: string;
  timestamp: string;
  timestampRaw?: string;
  read: boolean;
}

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rating: number;
  online: boolean;
  lastSeen?: string;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friend: Friend;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (text: string, friendId: string, replyToId?: string) => void;
  onEditMessage: (messageId: string, newText: string, friendId: string) => void;
  onDeleteMessage: (messageId: string, friendId: string) => void;
  onReloadChat?: (friendId: string, options?: { before?: string; append?: boolean }) => Promise<Message[] | undefined> | void;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  open,
  onOpenChange,
  friend,
  messages,
  currentUserId,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReloadChat,
}: ChatDialogProps) => {
  const [messageText, setMessageText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const latestMessagesRef = useRef<Message[]>([]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    // Poll for new messages every 2 seconds when chat is open
    if (!open || !onReloadChat) return;

    const intervalId = setInterval(async () => {
      try {
        await onReloadChat(friend.id);
      } catch (error) {
        // Silently ignore polling errors
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [open, friend.id, onReloadChat]);

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim(), friend.id, replyToMessage?.id);
      setMessageText("");
      setReplyToMessage(null);
      
      // Trigger chat reload after sending
      if (onReloadChat) {
        onReloadChat(friend.id);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEditStart = (message: Message) => {
    setEditingMessageId(message.id);
    setEditText(message.text);
  };

  const handleReplyStart = (message: Message) => {
    setReplyToMessage(message);
  };

  const handleEditSave = (messageId: string) => {
    if (editText.trim() && editText !== messages.find(m => m.id === messageId)?.text) {
      onEditMessage(messageId, editText.trim(), friend.id);
      
      // Trigger chat reload after editing
      if (onReloadChat) {
        onReloadChat(friend.id);
      }
    }
    setEditingMessageId(null);
    setEditText("");
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleDelete = (messageId: string) => {
    onDeleteMessage(messageId, friend.id);
    
    // Trigger chat reload after deleting
    if (onReloadChat) {
      onReloadChat(friend.id);
    }
  };

  const getReplyPreview = (replyToId?: string) => {
    if (!replyToId) return null;
    return messages.find((msg) => msg.id === replyToId) || null;
  };

  const scrollToMessage = (messageId?: string) => {
    if (!messageId) return;
    const target = messageRefs.current[messageId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      window.setTimeout(() => setHighlightedMessageId(null), 1500);
    }
  };

  const jumpToOriginalMessage = async (messageId?: string, attempt = 0) => {
    if (!messageId) return;

    if (messageRefs.current[messageId]) {
      scrollToMessage(messageId);
      return;
    }

    if (!onReloadChat || attempt >= 3) return;

    const oldest = latestMessagesRef.current[0];
    const before = oldest?.timestampRaw;
    if (!before) return;

    const fetched = await onReloadChat(friend.id, { before, append: true });
    if (!fetched || fetched.length === 0) return;

    window.setTimeout(() => {
      jumpToOriginalMessage(messageId, attempt + 1);
    }, 200);
  };

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
      sx={{ "& .MuiDialog-paper": { height: 600, display: "flex", flexDirection: "column" } }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider", pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={friend.avatar}
              alt={friend.name}
              sx={{ width: 40, height: 40 }}
            >
              {friend.name.charAt(0)}
            </Avatar>
            {friend.online && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  bgcolor: "success.main",
                  borderRadius: "50%",
                  border: "2px solid background",
                }}
              />
            )}
          </Box>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {friend.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {friend.online ? "Online" : `Last seen ${friend.lastSeen}`}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        ref={scrollRef}
        sx={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          py: 2,
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ textAlign: "center", color: "textSecondary", py: 4 }}>
            <Typography>No messages yet</Typography>
            <Typography variant="caption">Send a message to start chatting!</Typography>
          </Box>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === currentUserId;
            const isEditing = editingMessageId === message.id;
            const replyPreview = getReplyPreview(message.replyTo);
            
            return (
              <Box
                key={message.id}
                ref={(node) => {
                  messageRefs.current[message.id] = node as HTMLDivElement | null;
                }}
                sx={{
                  display: "flex",
                  justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                }}
              >
                <Paper
                  sx={{
                    maxWidth: "70%",
                    p: 1.5,
                    bgcolor: isCurrentUser ? "primary.main" : "action.hover",
                    color: isCurrentUser ? "primary.contrastText" : "text.primary",
                    boxShadow: message.id === highlightedMessageId ? 6 : undefined,
                    outline: message.id === highlightedMessageId ? "2px solid" : undefined,
                    outlineColor: message.id === highlightedMessageId ? "warning.main" : undefined,
                    transition: "box-shadow 0.2s ease, outline 0.2s ease",
                  }}
                >
                  {isEditing ? (
                    <Box>
                      <TextField
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        size="small"
                        fullWidth
                        multiline
                        autoFocus
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            color: "inherit",
                            "& fieldset": {
                              borderColor: "rgba(255, 255, 255, 0.3)",
                            },
                          },
                        }}
                      />
                      <Box sx={{ display: "flex", gap: 0.5, mt: 1, justifyContent: "flex-end" }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditSave(message.id)}
                          sx={{ color: "inherit" }}
                        >
                          <Check size={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={handleEditCancel}
                          sx={{ color: "inherit" }}
                        >
                          <X size={16} />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      {message.replyTo && (
                        <Box
                          sx={{
                            mb: 1,
                            pl: 1,
                            borderLeft: 3,
                            borderColor: isCurrentUser ? "rgba(255, 255, 255, 0.5)" : "primary.main",
                            opacity: 0.85,
                            cursor: replyPreview ? "pointer" : "default",
                          }}
                          onClick={() => jumpToOriginalMessage(message.replyTo)}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                            {replyPreview
                              ? replyPreview.senderId === currentUserId
                                ? "You"
                                : friend.name
                              : "Message"}
                          </Typography>
                          <Typography variant="caption" sx={{ display: "block" }}>
                            {replyPreview ? replyPreview.text : "Original message deleted"}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                        {message.text}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                          }}
                        >
                          {message.timestamp}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleReplyStart(message)}
                            sx={{
                              color: "inherit",
                              p: 0.5,
                              opacity: 0.7,
                              "&:hover": { opacity: 1 }
                            }}
                          >
                            <Reply size={14} />
                          </IconButton>
                          {isCurrentUser && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleEditStart(message)}
                                sx={{ 
                                  color: "inherit",
                                  p: 0.5,
                                  opacity: 0.7,
                                  "&:hover": { opacity: 1 }
                                }}
                              >
                                <Edit2 size={14} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(message.id)}
                                sx={{ 
                                  color: "inherit",
                                  p: 0.5,
                                  opacity: 0.7,
                                  "&:hover": { opacity: 1 }
                                }}
                              >
                                <Trash2 size={14} />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </Box>
                    </>
                  )}
                </Paper>
              </Box>
            );
          })
        )}
      </DialogContent>

      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {replyToMessage && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "action.hover",
              borderRadius: 1,
              px: 1.5,
              py: 1,
            }}
          >
            <Box
              sx={{ overflow: "hidden", cursor: "pointer" }}
              onClick={() => jumpToOriginalMessage(replyToMessage.id)}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
                Replying to {replyToMessage.senderId === currentUserId ? "you" : friend.name}
              </Typography>
              <Typography variant="caption" sx={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {replyToMessage.text}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setReplyToMessage(null)}>
              <X size={16} />
            </IconButton>
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
            fullWidth
            variant="outlined"
          />
          <Button
            onClick={handleSend}
            variant="contained"
            disabled={!messageText.trim()}
            sx={{ minWidth: 40, p: 1 }}
          >
            <Send size={20} />
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}

export default ChatDialog;
