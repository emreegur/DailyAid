'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, Stack, TextField, Button, Paper, Avatar,
  CircularProgress, Chip
} from '@mui/material';
import { Send, SmartToy, Person } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { elderlyApi, ChatResponse } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  sentiment?: string;
  isCritical?: boolean;
  time: string;
}

const SENTIMENT_LABEL: Record<string, { label: string; color: 'success' | 'warning' | 'default' }> = {
  LABEL_0: { label: 'Neutral', color: 'default' },
  LABEL_1: { label: 'Positive', color: 'success' },
  POSITIVE: { label: 'Positive', color: 'success' },
  NEGATIVE: { label: 'Negative', color: 'warning' },
};

export default function ChatPage() {
  const { fullName } = useAuthStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello${fullName ? ` ${fullName.split(' ')[0]}` : ''}! 👋 I am the DailyAid AI Assistant. How are you feeling today? Feel free to share anything about your medications, routines, or health.`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send leave chat event on unmount
  useEffect(() => {
    return () => {
      // Use navigator.sendBeacon for better reliability on unload if we had full URL,
      // but since we use axios interceptors with headers, we just use the api call.
      // Next.js unmount handles this fine on page navigation.
      elderlyApi.leaveChat().catch(e => console.error("Failed to send leave event", e));
    };
  }, []);

  const chat = useMutation({
    mutationFn: (msg: string) => elderlyApi.chat(msg),
    onSuccess: (res: { data: ChatResponse }) => {
      const isCritical = res.data.is_critical ?? false;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: res.data.reply,
        sentiment: res.data.sentiment,
        isCritical,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }]);

      if (isCritical) {
        elderlyApi.sendEmergencyAlert(res.data.reply).catch(e => console.error("Failed to alert caregiver:", e));
      }
    },
  });

  const send = () => {
    const msg = input.trim();
    if (!msg || chat.isPending) return;
    setMessages(prev => [...prev, {
      role: 'user', text: msg,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setInput('');
    chat.mutate(msg);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Avatar sx={{ bgcolor: 'primary.main' }}><SmartToy /></Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>AI Health Assistant</Typography>
          <Typography variant="caption" color="success.main">● Online — Available 24/7</Typography>
        </Box>
      </Stack>

      {/* Messages */}
      <Paper variant="outlined" sx={{ flex: 1, overflowY: 'auto', p: 2, borderRadius: 3, mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg, i) => (
          <Stack key={i} direction="row" spacing={1.5} alignItems="flex-end"
            justifyContent={msg.role === 'user' ? 'flex-end' : 'flex-start'}>
            {msg.role === 'assistant' && (
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                <SmartToy sx={{ fontSize: 18 }} />
              </Avatar>
            )}
            <Box sx={{ maxWidth: '70%' }}>
              <Paper sx={{
                p: 1.5, borderRadius: 3,
                bgcolor: msg.role === 'user' ? 'primary.main' : msg.isCritical ? 'error.light' : 'grey.100',
                color: msg.role === 'user' ? 'white' : msg.isCritical ? 'error.contrastText' : 'text.primary',
              }}>
                <Typography variant="body1" lineHeight={1.6}>{msg.text}</Typography>
              </Paper>
              <Stack direction="row" spacing={1} mt={0.5} alignItems="center">
                <Typography variant="caption" color="text.disabled">{msg.time}</Typography>
                {msg.sentiment && SENTIMENT_LABEL[msg.sentiment] && (
                  <Chip
                    label={SENTIMENT_LABEL[msg.sentiment].label}
                    color={SENTIMENT_LABEL[msg.sentiment].color}
                    size="small" sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                )}
              </Stack>
            </Box>
            {msg.role === 'user' && (
              <Avatar sx={{ bgcolor: 'grey.300', width: 32, height: 32 }}>
                <Person sx={{ fontSize: 18 }} />
              </Avatar>
            )}
          </Stack>
        ))}
        {chat.isPending && (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}><SmartToy sx={{ fontSize: 18 }} /></Avatar>
            <Paper sx={{ p: 1.5, borderRadius: 3, bgcolor: 'grey.100' }}>
              <CircularProgress size={16} />
            </Paper>
          </Stack>
        )}
        <div ref={bottomRef} />
      </Paper>

      {/* Input */}
      <Stack direction="row" spacing={1.5}>
        <TextField
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Type your message..."
          fullWidth
          variant="outlined"
          size="medium"
          multiline
          maxRows={3}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <Button
          variant="contained"
          onClick={send}
          disabled={!input.trim() || chat.isPending}
          sx={{ px: 3, borderRadius: 3, minWidth: 56 }}
        >
          <Send />
        </Button>
      </Stack>
    </Box>
  );
}
