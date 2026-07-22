'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Stack, Button, Card, CardContent,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, CircularProgress, Divider, IconButton
} from '@mui/material';
import { Add, CheckCircle, Assignment, Delete } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { elderlyApi, CreateRoutine } from '@/lib/api';

export default function RoutinesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: routines, isLoading } = useQuery({
    queryKey: ['elderly-routines'],
    queryFn: () => elderlyApi.getRoutines().then(r => r.data),
    refetchInterval: 5000,
  });

  const addRoutine = useMutation({
    mutationFn: (data: CreateRoutine) => elderlyApi.addRoutine(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['elderly-routines'] }); setOpen(false); reset(); },
  });

  const completeRoutine = useMutation({
    mutationFn: (id: number) => elderlyApi.completeRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-routines'] }),
  });

  const uncompleteRoutine = useMutation({
    mutationFn: (id: number) => elderlyApi.uncompleteRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-routines'] }),
  });

  const deleteRoutine = useMutation({
    mutationFn: (id: number) => elderlyApi.deleteRoutine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-routines'] }),
  });

  const { register, handleSubmit, reset } = useForm<CreateRoutine>({
    defaultValues: { scheduledTime: '09:00' }
  });

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700}>📋 My Routines</Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>Track your daily activities</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>Add Routine</Button>
      </Stack>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Stack alignItems="center" py={6}><CircularProgress /></Stack>
          ) : routines && routines.length > 0 ? (
            <List disablePadding>
              {routines.map((r, i) => (
                <Box key={r.id}>
                  {i > 0 && <Divider />}
                  <ListItem sx={{ py: 2.5, px: 3 }}>
                    <Assignment sx={{ mr: 2, color: 'secondary.main', fontSize: 28 }} />
                    <ListItemText
                      primary={<Typography fontWeight={700} variant="h6">{r.title}</Typography>}
                      secondary={
                        <Stack direction="row" spacing={1} mt={0.5}>
                          {r.description && <Chip label={r.description} size="small" variant="outlined" />}
                          <Chip label={`⏰ ${r.scheduledTime}`} size="small" />
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {r.isCompletedToday ? (
                          <Button
                            size="small" variant="contained" color="success"
                            onClick={() => uncompleteRoutine.mutate(r.id)}
                            startIcon={<CheckCircle />} sx={{ borderRadius: 2 }}
                          >
                            Completed
                          </Button>
                        ) : (
                          <Button
                            size="small" variant="outlined" color="primary"
                            onClick={() => completeRoutine.mutate(r.id)}
                            startIcon={<CheckCircle />} sx={{ borderRadius: 2 }}
                          >
                            Mark as Done
                          </Button>
                        )}
                        <IconButton onClick={() => deleteRoutine.mutate(r.id)} color="error" size="small">
                          <Delete />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </List>
          ) : (
            <Box py={6} textAlign="center">
              <Assignment sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
              <Typography color="text.secondary">No routines added yet.</Typography>
              <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setOpen(true)}>
                Add Your First Routine
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(d => addRoutine.mutate(d))}>
          <DialogTitle fontWeight={700}>Add New Routine</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} pt={1}>
              <TextField label="Routine Name" fullWidth {...register('title', { required: true })} placeholder="e.g. Morning walk" />
              <TextField label="Description" fullWidth {...register('description')} placeholder="Optional" />
              <TextField label="Time" type="time" fullWidth {...register('scheduledTime')} InputLabelProps={{ shrink: true }} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addRoutine.isPending}>
              {addRoutine.isPending ? 'Saving...' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
