'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Stack, Button, Card, CardContent,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, CircularProgress, Divider
} from '@mui/material';
import { Add, Delete, Edit, CheckCircle, MedicationLiquid } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { elderlyApi, CreateMedication } from '@/lib/api';

const FREQUENCIES = ['Daily', 'Twice'];
const FREQ_LABELS: Record<string, string> = { Daily: 'Daily', Twice: 'Twice a day' };

export default function MedicationsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: medications, isLoading } = useQuery({
    queryKey: ['elderly-medications'],
    queryFn: () => elderlyApi.getMedications().then(r => r.data),
    refetchInterval: 5000,
  });

  const addMed = useMutation({
    mutationFn: (data: CreateMedication) => elderlyApi.addMedication(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['elderly-medications'] }); setOpen(false); reset(); },
    onError: (err: any) => { alert('Failed to add medication: ' + (err.response?.data || err.message)); console.error(err); }
  });

  const takeMed = useMutation({
    mutationFn: (id: number) => elderlyApi.takeMedication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-medications'] }),
  });

  const untakeMed = useMutation({
    mutationFn: (id: number) => elderlyApi.untakeMedication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-medications'] }),
  });

  const deleteMed = useMutation({
    mutationFn: (id: number) => elderlyApi.deleteMedication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['elderly-medications'] }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateMedication>({
    defaultValues: { frequency: 'Daily', scheduledTime: '08:00' }
  });

  const handleOpenAdd = () => {
    reset({ frequency: 'Daily', scheduledTime: '08:00', name: '', dosage: '' });
    setOpen(true);
  };

  const onSubmit = (data: CreateMedication) => {
    addMed.mutate(data);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700}>💊 My Medications</Typography>
          <Typography variant="body1" color="text.secondary" mt={0.5}>Track your daily medications here</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>Add Medication</Button>
      </Stack>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Stack alignItems="center" py={6}><CircularProgress /></Stack>
          ) : medications && medications.length > 0 ? (
            <List disablePadding>
              {medications.map((med, i) => (
                <Box key={med.id}>
                  {i > 0 && <Divider />}
                  <ListItem sx={{ py: 2.5, px: 3 }}>
                    <MedicationLiquid sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
                    <ListItemText
                      primary={<Typography fontWeight={700} variant="h6">{med.name}</Typography>}
                      secondary={
                        <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                          <Chip label={med.dosage} size="small" variant="outlined" />
                          <Chip label={FREQ_LABELS[med.frequency] ?? med.frequency} size="small" color="primary" variant="outlined" />
                          <Chip label={`⏰ ${med.scheduledTime}`} size="small" />
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        {med.isTakenToday ? (
                          <Button
                            size="small" variant="contained" color="success"
                            onClick={() => untakeMed.mutate(med.id)}
                            startIcon={<CheckCircle />} sx={{ borderRadius: 2 }}
                          >
                            Taken
                          </Button>
                        ) : (
                          <Button
                            size="small" variant="outlined" color="primary"
                            onClick={() => takeMed.mutate(med.id)}
                            startIcon={<CheckCircle />} sx={{ borderRadius: 2 }}
                          >
                            Mark as Taken
                          </Button>
                        )}
                        <IconButton onClick={() => deleteMed.mutate(med.id)} color="error" size="small">
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
              <MedicationLiquid sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
              <Typography color="text.secondary">No medications added yet.</Typography>
              <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={handleOpenAdd}>
                Add Your First Medication
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle fontWeight={700}>Add New Medication</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} pt={1}>
              <TextField label="Medication Name" fullWidth {...register('name', { required: true })} error={!!errors.name} helperText={errors.name && 'Required'} />
              <TextField label="Dosage" fullWidth placeholder="e.g. 500mg" {...register('dosage', { required: true })} error={!!errors.dosage} />
              <TextField label="Frequency" select fullWidth {...register('frequency')} defaultValue="Daily">
                {FREQUENCIES.map(f => <MenuItem key={f} value={f}>{FREQ_LABELS[f]}</MenuItem>)}
              </TextField>
              <TextField label="Time" type="time" fullWidth {...register('scheduledTime')} InputLabelProps={{ shrink: true }} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addMed.isPending}>
              {addMed.isPending ? 'Saving...' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
