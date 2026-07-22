'use client';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  Box, Typography, Stack, Card, CardContent, CircularProgress, Alert, Chip, Avatar, Tabs, Tab, Divider, IconButton
} from '@mui/material';
import { SmartToy, Person, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { caregiverApi } from '@/lib/api';

export default function SentimentAnalysisPage() {
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get('patientId');

  const { data: patients, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['caregiver-patients'],
    queryFn: () => caregiverApi.getPatients().then(r => r.data),
  });

  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatient(initialPatientId);
    } else if (patients && patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0].id);
    }
  }, [patients, initialPatientId, selectedPatient]);

  // Reset selected date when patient changes
  useEffect(() => {
    setSelectedDateIndex(0);
  }, [selectedPatient]);

  const { data: chatHistory, isLoading: isLoadingHistory, error } = useQuery({
    queryKey: ['patient-chat-history', selectedPatient],
    queryFn: () => caregiverApi.getPatientChatHistory(selectedPatient!).then(r => r.data),
    enabled: !!selectedPatient,
  });

  const groupedHistory = useMemo(() => {
    if (!chatHistory) return [];
    const groups: Record<string, typeof chatHistory> = {};
    chatHistory.forEach(msg => {
      const dateStr = new Date(msg.sentAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(msg);
    });

    return Object.entries(groups).map(([dateStr, messages]) => ({
      dateStr,
      date: new Date(messages[0].sentAt),
      messages,
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [chatHistory]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setSelectedPatient(newValue);
  };

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'default';
    const s = sentiment.toUpperCase();
    if (s === 'POSITIVE') return 'success';
    if (s === 'NEGATIVE') return 'error';
    return 'default';
  };

  const getSentimentBgColor = (sentiment?: string) => {
    if (!sentiment) return 'grey.100';
    const s = sentiment.toUpperCase();
    if (s === 'POSITIVE') return 'success.light';
    if (s === 'NEGATIVE') return 'error.light';
    return 'grey.100';
  };

  if (isLoadingPatients) return <Stack alignItems="center" mt={4}><CircularProgress /></Stack>;
  if (!patients || patients.length === 0) return <Alert severity="info" mt={4}>No patients found.</Alert>;

  const currentPerson = patients?.find(p => p.id === selectedPatient)?.fullName || 'Your loved one';
  const selectedDay = groupedHistory.length > 0 ? groupedHistory[selectedDateIndex] : null;
  const currentMessages = selectedDay?.messages || [];

  const positiveCount = currentMessages.filter(m => m.sentiment?.toUpperCase() === 'POSITIVE').length;
  const negativeCount = currentMessages.filter(m => m.sentiment?.toUpperCase() === 'NEGATIVE').length;
  const neutralCount = currentMessages.filter(m => m.sentiment?.toUpperCase() === 'NEUTRAL' || (!m.sentiment && m.isBot)).length;

  const getSentimentSummary = () => {
    if (currentMessages.length === 0) return `${currentPerson} hasn't had any interactions yet.`;

    let dayStr = "on this day";
    if (selectedDay) {
      const today = new Date();
      const isToday = selectedDay.date.getDate() === today.getDate() && 
                      selectedDay.date.getMonth() === today.getMonth() && 
                      selectedDay.date.getFullYear() === today.getFullYear();
      
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const isYesterday = selectedDay.date.getDate() === yesterday.getDate() && 
                          selectedDay.date.getMonth() === yesterday.getMonth() && 
                          selectedDay.date.getFullYear() === yesterday.getFullYear();

      if (isToday) dayStr = "today";
      else if (isYesterday) dayStr = "yesterday";
    }

    if (negativeCount > positiveCount && negativeCount > 0) {
      return `${currentPerson} seemed to be feeling a bit down or frustrated ${dayStr}.`;
    }
    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      return `${currentPerson} seemed to be feeling mostly positive and happy ${dayStr}.`;
    }
    if (positiveCount > 0 || neutralCount > 0) {
      return `${currentPerson} appeared to be feeling calm and neutral ${dayStr}.`;
    }
    return `Not enough emotional data to determine the mood for ${dayStr === 'today' || dayStr === 'yesterday' ? dayStr : 'this day'}.`;
  };

  const summarySeverity = (negativeCount > positiveCount && negativeCount > 0) ? "warning" : 
                          (positiveCount > negativeCount && positiveCount > neutralCount) ? "success" : "info";

  return (
    <Box maxWidth="lg" mx="auto">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Chat Logs and Sentiment Analysis</Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>
            Review chat interactions and emotional well-being for your patients.
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={selectedPatient || false} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          {patients.map((p) => (
            <Tab key={p.id} label={p.fullName} value={p.id} sx={{ fontWeight: 600 }} />
          ))}
        </Tabs>
      </Box>

      {isLoadingHistory ? (
        <Stack alignItems="center" my={4}><CircularProgress /></Stack>
      ) : error ? (
        <Alert severity="error">Failed to load chat history.</Alert>
      ) : (
        <>
          <Alert severity={summarySeverity} sx={{ mb: 4, borderRadius: 3, fontSize: '1.05rem', alignItems: 'center' }}>
            {getSentimentSummary()}
          </Alert>

          <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-around" textAlign="center">
                <Box>
                  <Typography variant="h3" fontWeight={700} color="primary">{currentMessages.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Messages</Typography>
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="success.main">{positiveCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Positive</Typography>
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="text.secondary">{neutralCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Neutral</Typography>
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700} color="error.main">{negativeCount}</Typography>
                  <Typography variant="body2" color="text.secondary">Negative</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={700}>Chat History Log</Typography>
            {groupedHistory.length > 0 && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton 
                  onClick={() => setSelectedDateIndex(Math.min(groupedHistory.length - 1, selectedDateIndex + 1))}
                  disabled={selectedDateIndex === groupedHistory.length - 1}
                  size="small"
                  sx={{ bgcolor: 'grey.200' }}
                >
                  <ChevronLeft />
                </IconButton>
                <Typography fontWeight={600} minWidth={110} textAlign="center">
                  {selectedDay?.dateStr}
                </Typography>
                <IconButton 
                  onClick={() => setSelectedDateIndex(Math.max(0, selectedDateIndex - 1))}
                  disabled={selectedDateIndex === 0}
                  size="small"
                  sx={{ bgcolor: 'grey.200' }}
                >
                  <ChevronRight />
                </IconButton>
              </Stack>
            )}
          </Stack>

          <Stack spacing={3}>
            {currentMessages.filter((msg, index, arr) => {
              if (msg.sentiment === 'SYSTEM_EVENT') {
                if (index === 0) return false;
                if (arr[index - 1].sentiment === 'SYSTEM_EVENT') return false;
              }
              return true;
            }).map((msg) => {
              if (msg.sentiment === 'SYSTEM_EVENT') {
                return (
                  <Divider key={msg.id} sx={{ my: 2 }}>
                    <Chip label={msg.content} size="small" color="default" sx={{ fontSize: '0.75rem', color: 'text.secondary' }} />
                  </Divider>
                );
              }

              return (
                <Box key={msg.id} sx={{ display: 'flex', flexDirection: msg.isBot ? 'row' : 'row-reverse', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: msg.isBot ? 'primary.main' : 'secondary.main', width: 36, height: 36 }}>
                    {msg.isBot ? <SmartToy /> : <Person />}
                  </Avatar>
                  <Box sx={{ maxWidth: '70%' }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: msg.isBot ? getSentimentBgColor(msg.sentiment) : 'grey.200',
                        color: 'text.primary',
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} mt={1} justifyContent={msg.isBot ? 'flex-start' : 'flex-end'} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                      {msg.isBot && msg.sentiment && (
                        <Chip
                          label={msg.sentiment}
                          size="small"
                          color={getSentimentColor(msg.sentiment) as 'success' | 'error' | 'default'}
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>
              );
            })}
            {currentMessages.length === 0 && (
              <Alert severity="info">No chat history available for this patient.</Alert>
            )}
          </Stack>
        </>
      )}
    </Box>
  );
}
