import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

interface PendingRequest {
  id: string;
  name: string;
  username: string;
  avatar: string;
  rating: number;
  online: boolean;
  receivedAt: string;
}

interface PendingRequestsProps {
  requests: PendingRequest[];
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
}

const PendingRequests: React.FC<PendingRequestsProps> = ({ requests, onAccept, onDecline }) => {
  return (
    <Stack spacing={2}>
      {requests.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No pending friend requests</Typography>
        </Card>
      ) : (
        <Stack spacing={1}>
          {requests.map((request) => (
            <Card key={request.id} sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    color="success"
                    variant={request.online ? "dot" : undefined}
                    invisible={!request.online}
                  >
                    <Avatar src={request.avatar} alt={request.name}>
                      {request.name.charAt(0)}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography>{request.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      @{request.username} • {request.receivedAt}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={1}>
                  <Chip label={request.rating} color="secondary" size="small" />
                  <Box display="flex" gap={1}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => onAccept(request.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CloseIcon />}
                      onClick={() => onDecline(request.id)}
                    >
                      Decline
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default PendingRequests;
