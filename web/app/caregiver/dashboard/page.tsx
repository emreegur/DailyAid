'use client';
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, CardActionArea, Typography, Stack, Avatar, Button,
  List, ListItem, ListItemText, ListItemAvatar, Chip, Alert, CircularProgress, Divider
} from '@mui/material';
import {
  People, Notifications, TrendingUp, CheckCircle, Warning, AccessTime, Wifi
} from '@mui/icons-material';
import Link from 'next/link';
import { caregiverApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function CaregiverDashboard() {
  const { fullName } = useAuthStore();
  const firstName = fullName?.split(' ')[0] ?? 'there';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good Morning';
    if (h >= 12 && h < 17) return 'Good Afternoon';
    if (h >= 17 && h < 22) return 'Good Evening';
    return 'Good Night';
  };

  const { data: patients, isLoading } = useQuery({
    queryKey: ['caregiver-patients'],
    queryFn: () => caregiverApi.getPatients().then(r => r.data),
    refetchInterval: 5000,
  });

  const { data: notifications } = useQuery({
    queryKey: ['caregiver-notifications'],
    queryFn: () => caregiverApi.getNotifications().then(r => r.data),
    refetchInterval: 5000,
  });

  const { data: sentiments } = useQuery({
    queryKey: ['caregiver-sentiment'],
    queryFn: () => caregiverApi.getSentimentAnalysis().then(r => r.data),
    refetchInterval: 5000,
  });

  const [nextAction, setNextAction] = useState<{ time: string, title: string, patientName: string } | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  useEffect(() => {
    if (!patients || patients.length === 0) return;

    const fetchAllTasks = async () => {
      setIsLoadingAction(true);
      try {
        const allTasks: { time: string, title: string, patientName: string, isCompleted: boolean }[] = [];
        
        await Promise.all(patients.map(async (p) => {
          const [medsRes, routinesRes] = await Promise.all([
            caregiverApi.getPatientMedications(p.id).catch(() => ({ data: [] })),
            caregiverApi.getPatientRoutines(p.id).catch(() => ({ data: [] }))
          ]);
          
          medsRes.data.forEach(m => {
            if (m.isActive) {
              allTasks.push({ time: m.scheduledTime, title: m.name + ' (Medication)', patientName: p.fullName, isCompleted: m.isTakenToday });
            }
          });
          
          routinesRes.data.forEach(r => {
            if (r.isActive) {
              allTasks.push({ time: r.scheduledTime, title: r.title + ' (Routine)', patientName: p.fullName, isCompleted: r.isCompletedToday });
            }
          });
        }));

        const nowTR = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
        const currentMinutes = nowTR.getHours() * 60 + nowTR.getMinutes();

        const pendingTasks = allTasks.filter(t => !t.isCompleted);

        const upcoming = pendingTasks.map(t => {
          const [h, m] = t.time.split(':').map(Number);
          const taskMinutes = h * 60 + m;
          return { ...t, taskMinutes };
        }).filter(t => t.taskMinutes >= currentMinutes).sort((a, b) => a.taskMinutes - b.taskMinutes);

        let nextTask = null;
        let isTomorrow = false;

        if (upcoming.length > 0) {
          nextTask = upcoming[0];
        } else if (allTasks.length > 0) {
          const allSorted = allTasks.map(t => {
            const [h, m] = t.time.split(':').map(Number);
            const taskMinutes = h * 60 + m;
            return { ...t, taskMinutes };
          }).sort((a, b) => a.taskMinutes - b.taskMinutes);
          
          nextTask = allSorted[0];
          isTomorrow = true;
        }

        if (nextTask) {
          const formattedTime = nextTask.time.split(':').slice(0, 2).join(':');
          const titleDisplay = isTomorrow ? `${nextTask.title} (Tomorrow)` : nextTask.title;
          setNextAction({ time: formattedTime, title: titleDisplay, patientName: nextTask.patientName });
        } else {
          setNextAction(null);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingAction(false);
      }
    };

    fetchAllTasks();
  }, [patients]);

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  let connVal = 'Offline';
  let connSubVal = 'No active devices';
  let connColor = 'error';

  if (patients && patients.length > 0) {
    const isAnyOnline = patients.some(p => p.isOnline);
    if (isAnyOnline) {
      connVal = 'Online';
      connSubVal = 'Active right now';
      connColor = 'success';
    } else {
      connVal = 'Offline';
      connColor = 'error';
      const lastSeenPatient = [...patients].sort((a, b) => {
        if (!a.lastSeen) return 1;
        if (!b.lastSeen) return -1;
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
      })[0];
      
      if (lastSeenPatient && lastSeenPatient.lastSeen) {
        const lastSeenDate = new Date(lastSeenPatient.lastSeen);
        const diffMs = new Date().getTime() - lastSeenDate.getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins < 60) {
          connSubVal = `Last seen: ${diffMins} min ago`;
        } else {
          const diffHrs = Math.round(diffMins / 60);
          if (diffHrs < 24) {
            connSubVal = `Last seen: ${diffHrs} hrs ago`;
          } else {
            connSubVal = `Last seen: ${Math.round(diffHrs / 24)} days ago`;
          }
        }
      } else {
        connSubVal = 'Offline';
      }
    }
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700}>{getGreeting()}, {firstName}</Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
      </Stack>

      {/* Stats */}
      <Grid container spacing={3} mb={4} alignItems="stretch">
        {[
          { 
            label: 'Next Action', 
            value: isLoadingAction ? '...' : (nextAction ? nextAction.time : '--:--'), 
            subValue: isLoadingAction ? 'Loading...' : (nextAction ? `${nextAction.title} • ${nextAction.patientName}` : 'No pending tasks'), 
            icon: <AccessTime />, 
            color: 'warning' 
          },
          { label: 'Unread Alerts', value: unreadCount, icon: <Notifications />, color: 'error' },
          { 
            label: 'Connection Status', 
            value: connVal, 
            subValue: connSubVal, 
            icon: <Wifi />, 
            color: connColor 
          },
        ].map((s) => (
          <Grid item xs={12} md={4} key={s.label}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>{s.label}</Typography>
                  <Avatar sx={{ bgcolor: `${s.color}.main`, color: 'background.paper', width: 36, height: 36, borderRadius: 2 }}>
                    {s.icon}
                  </Avatar>
                </Stack>
                <Stack direction="row" alignItems="baseline" spacing={1} sx={{ overflow: 'hidden' }}>
                  <Typography variant="h4" fontWeight={700} color={`${s.color}.main`}>{s.value}</Typography>
                  {'subValue' in s && (
                    <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap sx={{ textOverflow: 'ellipsis' }}>
                      {s.subValue}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={0} sx={{ alignItems: 'stretch' }}>
        {/* Patients List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%', borderTopRightRadius: { md: 0 }, borderBottomRightRadius: { md: 0 } }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={700}>🏥 Connected Elders</Typography>
                <Button component={Link} href="/caregiver/patients" size="small">View All</Button>
              </Stack>
              {isLoading ? (
                <Stack alignItems="center" py={4}><CircularProgress /></Stack>
              ) : patients && patients.length > 0 ? (
                <List disablePadding>
                  {patients.map((patient, i) => (
                    <Box key={patient.id}>
                      {i > 0 && <Divider />}
                      <ListItem
                        disablePadding sx={{ py: 1.5 }}
                        component={Link}
                        href={`/caregiver/patients`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>{patient.fullName.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography fontWeight={600}>{patient.fullName}</Typography>}
                          secondary={patient.email}
                        />
                        <Chip label="Active" color="success" size="small" variant="outlined" />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>No patients linked yet.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Notifications */}
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid', borderLeft: { md: 'none' }, borderColor: 'divider', boxShadow: 'none', height: '100%', borderRadius: 0 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={700}>🔔 Notifications</Typography>
                <Button size="small">View All</Button>
              </Stack>
              {notifications && notifications.length > 0 ? (
                <List disablePadding>
                  {notifications.slice(0, sentiments?.length === 2 ? 4 : 3).map((notif, i) => (
                    <Box key={notif.id}>
                      {i > 0 && <Divider />}
                      <ListItem disablePadding sx={{ py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: notif.isRead ? 'grey.200' : 'error.light', width: 32, height: 32 }}>
                            <Warning sx={{ fontSize: 18, color: notif.isRead ? 'grey.500' : 'error.main' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={notif.isRead ? 400 : 700}>{notif.title}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{notif.message}</Typography>}
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              ) : (
                <Alert severity="success" sx={{ borderRadius: 2 }}>No new notifications. All is well! ✓</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Emotional Well-being */}
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid', borderLeft: { md: 'none' }, borderColor: 'divider', boxShadow: 'none', height: '100%', borderTopLeftRadius: { md: 0 }, borderBottomLeftRadius: { md: 0 } }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={700}>📊 Emotional Well-being</Typography>
              </Stack>
              {sentiments && sentiments.length > 0 ? (
                <Grid container spacing={2}>
                  {sentiments.map((s) => {
                    const getSentimentSummary = (pos: number, neg: number, neu: number) => {
                      if (pos === 0 && neg === 0 && neu === 0) return "No interactions today.";
                      if (neg > pos && neg > 0) return "Seems to be feeling a bit down or frustrated today.";
                      if (pos > neg && pos > neu) return "Seems to be feeling mostly positive and happy today.";
                      if (pos > 0 || neu > 0) return "Appears to be feeling calm and neutral today.";
                      return "Not enough emotional data for today.";
                    };
                    return (
                      <Grid item xs={12} key={s.elderlyId}>
                        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, boxShadow: 'none' }}>
                          <CardActionArea component={Link} href={`/caregiver/sentiment?patientId=${s.elderlyId}`} sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600} mb={1}>{s.fullName}</Typography>
                            <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ fontStyle: 'italic' }}>
                              "{getSentimentSummary(s.positive, s.negative, s.neutral)}"
                            </Typography>
                            <Stack direction="row" spacing={1} mb={1} useFlexGap flexWrap="wrap">
                              <Chip label={`Positive: ${s.positive}`} color="success" size="small" variant="outlined" />
                              <Chip label={`Neutral: ${s.neutral}`} color="default" size="small" variant="outlined" />
                              <Chip label={`Negative: ${s.negative}`} color="error" size="small" variant="outlined" />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" display="block">Based on {s.totalMessages} chat messages today. Click for details.</Typography>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Alert severity="info" sx={{ borderRadius: 2 }}>No sentiment data available yet.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
