'use client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, Button } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@/lib/theme';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { Toaster, toast } from 'react-hot-toast';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
  }));

  const [isMounted, setIsMounted] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState<{ title: string, message: string } | null>(null);
  const { hydrate, token, role } = useAuthStore();

  useEffect(() => {
    hydrate();
    setIsMounted(true);
  }, [hydrate]);

  // Set up SignalR connection
  useEffect(() => {
    if (!isMounted || !token) return;

    const connection = new HubConnectionBuilder()
      .withUrl("http://localhost:5116/hubs/notifications", {
        accessTokenFactory: () => token
      })
      .configureLogging(LogLevel.Error)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", (notif) => {
      if (notif.type === 'emergency') {
        setEmergencyAlert(notif);
      } else {
        toast.success(notif.title);
      }
      if (role === 'Caregiver') {
        queryClient.invalidateQueries({ queryKey: ['caregiver-notifications'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['elderly-notifications'] });
      }
    });

    connection.start().catch(err => console.error("SignalR Connection Error: ", err));

    return () => {
      connection.stop();
    };
  }, [isMounted, token, role, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster position="top-right" />
        {children}
        {emergencyAlert && (
          <Box sx={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            bgcolor: 'error.main', color: 'white', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4
          }}>
            <Typography variant="h2" fontWeight={900} mb={2}>🚨 EMERGENCY ALERT</Typography>
            <Typography variant="h4" mb={6} textAlign="center">{emergencyAlert.message}</Typography>
            <Button variant="contained" size="large" onClick={() => setEmergencyAlert(null)} sx={{ bgcolor: 'white', color: 'error.main', fontSize: '24px', py: 2, px: 6, '&:hover': { bgcolor: 'grey.200' } }}>
              OKEY
            </Button>
          </Box>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
