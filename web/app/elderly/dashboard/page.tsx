'use client';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, CardActionArea, Typography, Button, Stack,
  List, ListItem, ListItemText, ListItemSecondaryAction, Chip,
  CircularProgress, Alert, Avatar, Divider, Pagination, Fade
} from '@mui/material';
import {
  MedicationLiquid, CheckCircle, Schedule, TrendingUp, Assignment, Chat as ChatIcon, WbSunny, Cloud, WaterDrop, CalendarMonth, AccessAlarm
} from '@mui/icons-material';
import Link from 'next/link';
import { elderlyApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function ElderlyDashboard() {
  const { fullName } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: medications, isLoading: medsLoading } = useQuery({
    queryKey: ['elderly-medications'],
    queryFn: () => elderlyApi.getMedications().then(r => r.data),
    refetchInterval: 5000,
  });

  const { data: routines, isLoading: routinesLoading } = useQuery({
    queryKey: ['elderly-routines'],
    queryFn: () => elderlyApi.getRoutines().then(r => r.data),
    refetchInterval: 5000,
  });

  const { data: weatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather', 'dynamic'],
    queryFn: async () => {
      let lat = 41.0082;
      let lon = 28.9784;
      let cityName = 'Istanbul';

      try {
        const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (geoRes.ok) {
          const geo = await geoRes.json();
          if (geo.latitude && geo.longitude) {
            lat = parseFloat(geo.latitude);
            lon = parseFloat(geo.longitude);
            cityName = geo.city || cityName;
          }
        }
      } catch (e) {
        console.warn('Geolocation failed, defaulting to Istanbul');
      }

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
      const weather = await res.json();
      return { weather, city: cityName };
    }
  });

  const takeMed = useMutation({
    mutationFn: (id: number) => elderlyApi.takeMedication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-medications'] }),
  });

  const untakeMed = useMutation({
    mutationFn: (id: number) => elderlyApi.untakeMedication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-medications'] }),
  });

  const completeRoutine = useMutation({
    mutationFn: (id: number) => elderlyApi.completeRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-routines'] }),
  });

  const uncompleteRoutine = useMutation({
    mutationFn: (id: number) => elderlyApi.uncompleteRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-routines'] }),
  });

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good Morning';
    if (h >= 12 && h < 17) return 'Good Afternoon';
    if (h >= 17 && h < 22) return 'Good Evening';
    return 'Good Night';
  };

  const firstName = fullName?.split(' ')[0] ?? 'there';

  const allTasks = useMemo(() => {
    const tasks: any[] = [];
    if (medications) {
      const activeMeds = medications.filter((m: any) => !m.isTakenToday);
      tasks.push(...activeMeds.map((m: any) => ({ ...m, itemType: 'medication', time: m.scheduledTime })));
    }
    if (routines) {
      const activeRoutines = routines.filter((r: any) => !r.isCompletedToday);
      tasks.push(...activeRoutines.map((r: any) => ({ ...r, itemType: 'routine', time: r.scheduledTime })));
    }
    return tasks.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, routines]);

  useEffect(() => {
    const totalPages = Math.ceil(allTasks.length / 3);
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    } else if (totalPages === 0 && page !== 1) {
      setPage(1);
    }
  }, [allTasks.length, page]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {getGreeting()}, {firstName}
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={1} sx={{ display: 'flex', alignItems: 'stretch' }}>
        {/* What's on for Today? */}
        <Grid item xs={12} md={7}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            <CardContent sx={{ flexGrow: 1, p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" alignItems="center" spacing={1.5} mb={4}>
                <CalendarMonth sx={{ color: 'primary.main', fontSize: 32 }} />
                <Typography variant="h5" fontWeight={800}>What&apos;s on for Today?</Typography>
              </Stack>

              {medsLoading || routinesLoading ? (
                <Stack alignItems="center" py={6}><CircularProgress /></Stack>
              ) : allTasks.length > 0 ? (
                <Stack spacing={2.5} sx={{ flexGrow: 1 }}>
                  <Fade in={true} key={page} timeout={400}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, minHeight: 400 }}>
                      {allTasks.slice((page - 1) * 3, page * 3).map((task) => (
                        <Card key={`${task.itemType}-${task.id}`} sx={{
                          boxShadow: 'none',
                          border: '1px solid',
                          borderColor: 'grey.300',
                          borderRadius: 3,
                          p: 3,
                          height: 120, // Standard height for all cards
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                        }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ height: '100%' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, color: 'text.primary' }}>
                                {task.itemType === 'medication' ? `Take medication: ${task.name}` : task.title}
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'warning.main', fontWeight: 600 }}>
                                <AccessAlarm sx={{ fontSize: 18 }} />
                                <Typography variant="body2" fontWeight={700}>Time: {task.time}</Typography>
                              </Stack>
                              {task.itemType === 'medication' && task.dosage ? (
                                <Typography variant="body2" color="text.secondary" mt={0.5} fontWeight={500}>Dosage: {task.dosage}</Typography>
                              ) : (
                                <Typography variant="body2" mt={0.5} sx={{ opacity: 0 }}>Placeholder</Typography>
                              )}
                            </Box>
                            <Box sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}>
                              {task.itemType === 'medication' ? (
                                task.isTakenToday ? (
                                  <Button fullWidth variant="contained" color="success" size="large" sx={{ borderRadius: 8, px: 4, py: 1.5, fontWeight: 800, fontSize: '1rem', letterSpacing: 1 }} onClick={() => untakeMed.mutate(task.id)}>DONE ✓</Button>
                                ) : (
                                  <Button fullWidth variant="contained" color="primary" size="large" sx={{ borderRadius: 8, px: 4, py: 1.5, fontWeight: 800, fontSize: '1rem', letterSpacing: 1 }} onClick={() => takeMed.mutate(task.id)}>DONE</Button>
                                )
                              ) : (
                                task.isCompletedToday ? (
                                  <Button fullWidth variant="contained" color="success" size="large" sx={{ borderRadius: 8, px: 4, py: 1.5, fontWeight: 800, fontSize: '1rem', letterSpacing: 1 }} onClick={() => uncompleteRoutine.mutate(task.id)}>DONE ✓</Button>
                                ) : (
                                  <Button fullWidth variant="contained" color="primary" size="large" sx={{ borderRadius: 8, px: 4, py: 1.5, fontWeight: 800, fontSize: '1rem', letterSpacing: 1 }} onClick={() => completeRoutine.mutate(task.id)}>DONE</Button>
                                )
                              )}
                            </Box>
                          </Stack>
                        </Card>
                      ))}
                    </Box>
                  </Fade>

                  <Box sx={{ flexGrow: 1 }} />

                  {Math.ceil(allTasks.length / 3) > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 'auto', pt: 2 }}>
                      <Pagination
                        count={Math.ceil(allTasks.length / 3)}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                        size="large"
                        sx={{
                          '& .MuiPaginationItem-root': {
                            fontSize: '1.15rem',
                            minWidth: 44,
                            height: 44,
                            borderRadius: '50%'
                          }
                        }}
                      />
                    </Box>
                  )}
                </Stack>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>Nothing scheduled for today!</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar (Chat & Weather) */}
        <Grid item xs={12} md={5}>
          <Stack spacing={0} sx={{ height: '100%' }}>

            {/* AI Assistant */}
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardActionArea component={Link} href="/elderly/chat" sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <Avatar sx={{ bgcolor: 'secondary.main', color: 'primary.main', width: 80, height: 80, borderRadius: 3, mb: 3 }}>
                  <ChatIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h3" fontWeight={800} color="text.primary">Chat</Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={500} mt={1}>AI Assistant — 24/7 Support</Typography>
              </CardActionArea>
            </Card>

            {/* Weather */}
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ width: '100%', textAlign: 'left', mb: 3 }}>🌤️ Weather ({weatherData?.city || 'Istanbul'})</Typography>

                {weatherLoading ? (
                  <Stack alignItems="center" py={4}><CircularProgress /></Stack>
                ) : weatherData?.weather ? (
                  <Stack alignItems="center" justifyContent="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'info.main', color: 'background.paper', width: 80, height: 80, borderRadius: 3 }}>
                      {weatherData.weather.current.weather_code < 3 ? <WbSunny sx={{ fontSize: 40 }} /> :
                        weatherData.weather.current.weather_code < 60 ? <Cloud sx={{ fontSize: 40 }} /> : <WaterDrop sx={{ fontSize: 40 }} />}
                    </Avatar>
                    <Typography variant="h2" fontWeight={800} color="info.main">
                      {Math.round(weatherData.weather.current.temperature_2m)}°C
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {weatherData.weather.current.weather_code < 3 ? 'Clear / Sunny' :
                        weatherData.weather.current.weather_code < 60 ? 'Cloudy / Foggy' : 'Rainy'}
                    </Typography>
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>Weather data unavailable.</Alert>
                )}
              </CardContent>
            </Card>

          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
