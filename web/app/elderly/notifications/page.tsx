'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, Button, Stack, CircularProgress, Alert, IconButton } from '@mui/material';
import { Notifications as BellIcon, CheckCircle, Cancel, Delete, DoneAll } from '@mui/icons-material';
import { elderlyApi } from '@/lib/api';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['elderly-notifications'],
    queryFn: () => elderlyApi.getNotifications().then(r => r.data),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => elderlyApi.acceptRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-notifications'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => elderlyApi.rejectRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => elderlyApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => elderlyApi.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-notifications'] }),
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleMarkAllRead = () => {
    if (!notifications) return;
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    unreadIds.forEach(id => markReadMutation.mutate(id));
  };

  if (isLoading) return <Stack alignItems="center" py={10}><CircularProgress /></Stack>;

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={4} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700} mb={1}>🔔 Notifications</Typography>
          <Typography variant="body1" color="text.secondary">Stay updated on your requests and alerts</Typography>
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="outlined" startIcon={<DoneAll />}
            onClick={handleMarkAllRead} color="inherit"
          >
            Mark all as read
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {notifications && notifications.length > 0 ? (
            <List disablePadding>
              {notifications.map((notif, i) => (
                <ListItem key={notif.id} sx={{ borderBottom: i < notifications.length - 1 ? '1px solid #eee' : 'none', py: 2, px: 3, opacity: notif.isRead ? 0.7 : 1 }}>
                  <BellIcon sx={{ mr: 2, color: notif.type === 'request' ? 'primary.main' : 'text.secondary' }} />
                  <ListItemText
                    disableTypography
                    primary={<Typography fontWeight={600}>{notif.title}</Typography>}
                    secondary={<Typography variant="body2">{notif.message}</Typography>}
                  />
                  <Stack direction="row" spacing={1} alignItems="center" ml={2}>
                    {notif.type === 'request' && !notif.isRead && (
                      <>
                        <Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => acceptMutation.mutate(notif.id)}>Accept</Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<Cancel />} onClick={() => rejectMutation.mutate(notif.id)}>Reject</Button>
                      </>
                    )}
                    {notif.type !== 'request' && !notif.isRead && (
                      <Button size="small" variant="outlined" onClick={() => markReadMutation.mutate(notif.id)}>Mark as Read</Button>
                    )}
                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(notif.id)} disabled={deleteMutation.isPending}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box p={4}><Alert severity="info">No notifications found.</Alert></Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
