import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";

interface SentRequest {
  id: string;
  name: string;
  username: string;
  rating: number;
  online: boolean;
  sentAt: string;
  status?: string;
}

interface SentRequestsProps {
  requests: SentRequest[];
}

const SentRequests: React.FC<SentRequestsProps> = ({ requests }) => {
  return (
    <Stack spacing={2}>
      {requests.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No sent friend requests</Typography>
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
                      @{request.username} • {request.sentAt}
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
                  <Chip label={request.status || "Pending"} variant="outlined" size="small" />
                </Box>
              </Box>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default SentRequests;
