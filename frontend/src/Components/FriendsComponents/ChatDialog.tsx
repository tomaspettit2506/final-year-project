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
} from "@mui/material";
import { Send } from "lucide-react";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
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
  onSendMessage: (text: string, friendId: string) => void;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  open,
  onOpenChange,
  friend,
  messages,
  currentUserId,
  onSendMessage,
}: ChatDialogProps) => {
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim(), friend.id);
      setMessageText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
            return (
              <Box
                key={message.id}
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
                  }}
                >
                  <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                    {message.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      opacity: 0.7,
                    }}
                  >
                    {message.timestamp}
                  </Typography>
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
          gap: 1,
        }}
      >
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
    </Dialog>
  );
}

export default ChatDialog;
