'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, Avatar, Stack, IconButton, Badge, Chip, Button
} from '@mui/material';
import {
  Dashboard, MedicationLiquid, Assignment, Chat, Notifications,
  Logout, Favorite, Menu as MenuIcon, Warning as WarningIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { elderlyApi } from '@/lib/api';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, href: '/elderly/dashboard' },
  { label: 'My Medications', icon: <MedicationLiquid />, href: '/elderly/medications' },
  { label: 'My Routines', icon: <Assignment />, href: '/elderly/routines' },
  { label: 'AI Assistant', icon: <Chat />, href: '/elderly/chat' },
  { label: 'Notifications', icon: <Notifications />, href: '/elderly/notifications' },
];

export function ElderlyLayout({ children }: { children: React.ReactNode }) {
  const { fullName, logout } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['elderly-notifications'],
    queryFn: () => elderlyApi.getNotifications().then(r => r.data),
    refetchInterval: 30000,
  });
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleLogout = () => { logout(); router.push('/'); };

  const handleEmergency = async () => {
    try {
      await elderlyApi.sendEmergencyAlert(`🚨 ${fullName} pressed the EMERGENCY button!`);
      alert('Emergency alert sent to your family member!');
    } catch (e) {
      console.error(e);
      alert('Failed to send emergency alert.');
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1A2D2A', color: '#FFFFFF' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 3, pt: 4, pb: 4 }}>
        <Favorite sx={{ fontSize: 36, color: '#EBBFA1' }} />
        <Typography sx={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1 }}>DailyAid</Typography>
      </Stack>
      <Chip label="Elderly Panel" sx={{ mx: 3, mb: 1, bgcolor: 'rgba(203,225,124,0.2)', color: '#CBE17C', borderRadius: 2, fontSize: 16, height: 32 }} />
      <List sx={{ flex: 1, px: 1, pt: 0 }}>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 1.5 }}>
            <ListItemButton
              component={Link} href={item.href}
              sx={{
                borderRadius: 1, color: 'rgba(255,255,255,0.85)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' },
                py: 3
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 44 }}>
                {React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: 26 } })}
              </ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600, color: 'inherit', fontSize: '1.1rem' }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ px: 1, pb: 15 }}>
        <ListItemButton onClick={handleLogout} sx={{ mb: 2, borderRadius: 1, color: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }, py: 7 }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 44 }}><Logout sx={{ fontSize: 26 }} /></ListItemIcon>
          <ListItemText primary="Sign Out" primaryTypographyProps={{ fontWeight: 600, color: 'inherit', fontSize: '1.1rem' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#E2DBD5' }}>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', bgcolor: '#1A2D2A' } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', bgcolor: '#1A2D2A' } }}>
          {drawer}
        </Drawer>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#E2DBD5', borderBottom: '1px solid rgba(63,45,51,0.1)', color: '#3F2D33' }}>
          <Toolbar>
            <IconButton sx={{ mr: 2, display: { md: 'none' }, color: '#3F2D33' }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Box flex={1}>
              <Typography variant="body1" fontWeight={800} color="#3F2D33" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '26px' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Button
                variant="contained"
                color="error"
                onClick={handleEmergency}
                sx={{ borderRadius: 2, fontWeight: 700, px: 2, textTransform: 'none', fontSize: 18 }}
              >
                Emergency Button
              </Button>
              <IconButton onClick={() => router.push('/elderly/notifications')} sx={{ color: '#3F2D33' }}>
                <Badge badgeContent={unreadCount} sx={{ '& .MuiBadge-badge': { bgcolor: '#EBBFA1', color: '#1A2D2A', fontSize: 14, minWidth: 24, height: 24 } }} invisible={unreadCount === 0}>
                  <Notifications sx={{ fontSize: 32 }} />
                </Badge>
              </IconButton>
              <Avatar sx={{ bgcolor: '#1A2D2A', color: '#FFFFFF', width: 48, height: 48, fontSize: 22, borderRadius: 1.5 }}>
                {fullName?.charAt(0) ?? 'U'}
              </Avatar>
              <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#3F2D33' }}>{fullName}</Typography>
            </Stack>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
