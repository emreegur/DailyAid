'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, List, ListItem, ListItemText,
  ListItemAvatar, Avatar, Stack, Button, CircularProgress, Alert, Chip,
  Divider, IconButton
} from '@mui/material';
import {
  Warning, Healing, CheckCircle, Info, NotificationsActive, DoneAll, Delete
} from '@mui/icons-material';
import { caregiverApi } from '@/lib/api';

const getIcon = (type: string, isRead: boolean) => {
  const color = isRead ? 'grey.400' : 'error.main';
  switch (type.toLowerCase()) {
    case 'emergency': return <Warning sx={{ color }} />;
    case 'medical': return <Healing sx={{ color: isRead ? 'grey.400' : 'warning.main' }} />;
    case 'success': return <CheckCircle sx={{ color: isRead ? 'grey.400' : 'success.main' }} />;
    default: return <Info sx={{ color: isRead ? 'grey.400' : 'primary.main' }} />;
  }
};

const getBgColor = (type: string, isRead: boolean) => {
  if (isRead) return 'grey.100';
  switch (type.toLowerCase()) {
    case 'emergency': return 'error.light';
    case 'medical': return 'warning.light';
    case 'success': return 'success.light';
    default: return 'primary.light';
  }
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['caregiver-notifications'],
    queryFn: () => caregiverApi.getNotifications().then(r => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => caregiverApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caregiver-notifications'] }),
  });

  const deleteNotif = useMutation({
    mutationFn: (id: number) => caregiverApi.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caregiver-notifications'] }),
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleMarkAllRead = () => {
    if (!notifications) return;
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    // Execute all read sequentially since we don't have a bulk endpoint
    unreadIds.forEach(id => markRead.mutate(id));
  };

  return (
    <Box maxWidth="lg" mx="auto">
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={4} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>🔔 Notifications</Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            You have <Typography component="span" fontWeight={700} color="error">{unreadCount}</Typography> unread alerts
          </Typography>
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
          {isLoading ? (
            <Stack alignItems="center" py={8}><CircularProgress /></Stack>
          ) : notifications && notifications.length > 0 ? (
            <List disablePadding>
              {notifications.map((notif, i) => (
                <Box key={notif.id}>
                  {i > 0 && <Divider />}
                  <ListItem
                    sx={{
                      py: 2.5, px: { xs: 2, md: 4 },
                      bgcolor: notif.isRead ? 'transparent' : 'rgba(26,115,232,0.02)',
                      transition: 'background 0.2s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                    }}
                  >
                    <ListItemAvatar sx={{ mr: 2 }}>
                      <Avatar sx={{
                        bgcolor: getBgColor(notif.type || 'info', notif.isRead),
                        width: 48, height: 48
                      }}>
                        {getIcon(notif.type || 'info', notif.isRead)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      disableTypography
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          <Typography variant="h6" fontSize="1.1rem" color={notif.isRead ? 'text.secondary' : 'text.primary'} fontWeight={notif.isRead ? 500 : 700}>
                            {notif.title}
                          </Typography>
                          {!notif.isRead && <Chip label="New" color="error" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />}
                        </Stack>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body1" color={notif.isRead ? 'text.disabled' : 'text.secondary'} mb={1} lineHeight={1.6}>
                            {notif.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled" fontWeight={600}>
                            {new Date(notif.createdAt).toLocaleString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </Typography>
                        </Box>
                      }
                    />
                    <Stack direction="row" spacing={1} alignItems="center" ml={2}>
                      {!notif.isRead && (
                        <Button
                          size="small" variant="contained"
                          onClick={() => markRead.mutate(notif.id)}
                          sx={{ borderRadius: 2 }}
                          disabled={markRead.isPending}
                        >
                          Mark Read
                        </Button>
                      )}
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => deleteNotif.mutate(notif.id)}
                        disabled={deleteNotif.isPending}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </ListItem>
                </Box>
              ))}
            </List>
          ) : (
            <Stack alignItems="center" py={10} spacing={2}>
              <NotificationsActive sx={{ fontSize: 80, color: 'grey.300' }} />
              <Typography variant="h6" color="text.secondary">All Caught Up!</Typography>
              <Typography color="text.disabled">There are no notifications at the moment.</Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
