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
        <Stack
          spacing={1}
          sx={{
            maxHeight: { xs: "60vh", sm: "70vh", md: "none" },
            overflowY: { xs: "auto", md: "visible" },
            pr: { xs: 1, md: 0 }
          }}
        >
          {requests.map((request) => (
            <Card key={request.id} sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                flexWrap={{ xs: "wrap", sm: "nowrap" }}
                gap={2}
              >
                <Box display="flex" alignItems="center" gap={2} sx={{ minWidth: 0 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    color="success"
                    variant={request.online ? "dot" : undefined}
                    invisible={!request.online}
                  >
                    <Avatar>
                      {request.name.charAt(0).toUpperCase()}{request.name.split(' ')[1]?.charAt(0).toUpperCase() || ''}
                    </Avatar>
                  </Badge>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography>{request.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      @{request.username} • {request.receivedAt}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  flexWrap="wrap"
                  sx={{ width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "flex-start", sm: "flex-end" } }}
                >
                  <Chip label={request.rating} color="secondary" size="small" />
                  <Box display="flex" gap={1} flexWrap="wrap" sx={{ width: { xs: "100%", sm: "auto" } }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => onAccept(request.id)}
                      sx={{ flex: { xs: "1 1 auto", sm: "0 0 auto" } }}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CloseIcon />}
                      onClick={() => onDecline(request.id)}
                      sx={{ flex: { xs: "1 1 auto", sm: "0 0 auto" } }}
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
