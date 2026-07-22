'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, Avatar, Stack, IconButton, Badge, Chip
} from '@mui/material';
import {
  Dashboard, People, Notifications, Analytics,
  Logout, Favorite, Menu as MenuIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { caregiverApi } from '@/lib/api';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, href: '/caregiver/dashboard' },
  { label: 'Connected Elders', icon: <People />, href: '/caregiver/patients' },
  { label: 'Emotional Insights', icon: <Analytics />, href: '/caregiver/sentiment' },
  { label: 'Notifications', icon: <Notifications />, href: '/caregiver/notifications' },
];

export function CaregiverLayout({ children }: { children: React.ReactNode }) {
  const { fullName, logout } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['caregiver-notifications'],
    queryFn: () => caregiverApi.getNotifications().then(r => r.data),
    refetchInterval: 30000,
  });
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleLogout = () => { logout(); router.push('/'); };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1A2D2A', color: '#FFFFFF' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 3, pb: 2 }}>
        <Favorite sx={{ fontSize: 28, color: '#EBBFA1' }} />
        <Typography variant="h6" fontWeight={800} color="white">DailyAid</Typography>
      </Stack>
      <Chip label="Family Panel" size="small" sx={{ mx: 2, mb: 2, bgcolor: 'rgba(203,225,124,0.2)', color: '#CBE17C', borderRadius: 1 }} />
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link} href={item.href}
              sx={{
                borderRadius: 1, color: 'rgba(255,255,255,0.7)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#FFFFFF' }
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 500, color: 'inherit' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <ListItemButton onClick={handleLogout} sx={{ m: 2, borderRadius: 1, color: 'rgba(255,255,255,0.5)', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
        <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><Logout /></ListItemIcon>
        <ListItemText primary="Sign Out" primaryTypographyProps={{ color: 'inherit' }} />
      </ListItemButton>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#E2DBD5' }}>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#E2DBD5', borderBottom: '1px solid rgba(63,45,51,0.1)', color: '#3F2D33' }}>
          <Toolbar>
            <IconButton sx={{ mr: 2, display: { md: 'none' }, color: '#3F2D33' }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Box flex={1} />
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={() => router.push('/caregiver/notifications')} sx={{ color: '#3F2D33' }}>
                <Badge badgeContent={unreadCount} sx={{ '& .MuiBadge-badge': { bgcolor: '#EBBFA1', color: '#1A2D2A' } }} invisible={unreadCount === 0}>
                  <Notifications />
                </Badge>
              </IconButton>
              <Avatar sx={{ bgcolor: '#1A2D2A', color: '#FFFFFF', width: 36, height: 36, fontSize: 14, borderRadius: 1 }}>
                {fullName?.charAt(0) ?? 'C'}
              </Avatar>
              <Typography variant="body2" fontWeight={600} color="#3F2D33">{fullName}</Typography>
            </Stack>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
