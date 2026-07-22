'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Stack, Button, Card, CardContent,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, CircularProgress, Alert, Avatar, IconButton
} from '@mui/material';
import { People, Add, MedicationLiquid, Person, Assignment, CheckCircle, Delete, RestoreFromTrash, Edit, Undo } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { caregiverApi, CreateMedication, CreateRoutine } from '@/lib/api';

const FREQUENCIES = ['Daily', 'Twice'];
const FREQ_LABELS: Record<string, string> = { Daily: 'Daily', Twice: 'Twice a day' };

export default function PatientsPage() {
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [openMedDialog, setOpenMedDialog] = useState(false);
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const [openPatientDialog, setOpenPatientDialog] = useState(false);
  const [openRoutineDialog, setOpenRoutineDialog] = useState(false);

  const { data: patients, isLoading } = useQuery({
    queryKey: ['caregiver-patients'],
    queryFn: () => caregiverApi.getPatients().then(r => r.data),
    refetchInterval: 5000,
  });

  const { data: patientMeds } = useQuery({
    queryKey: ['caregiver-patient-meds', selectedPatient],
    queryFn: () => caregiverApi.getPatientMedications(selectedPatient!).then(r => r.data),
    enabled: !!selectedPatient,
    refetchInterval: 5000,
  });

  const { data: patientRoutines } = useQuery({
    queryKey: ['caregiver-patient-routines', selectedPatient],
    queryFn: () => caregiverApi.getPatientRoutines(selectedPatient!).then(r => r.data),
    enabled: !!selectedPatient,
    refetchInterval: 5000,
  });

  const addMed = useMutation({
    mutationFn: (data: CreateMedication) => caregiverApi.addPatientMedication(selectedPatient!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-patient-meds', selectedPatient] });
      setOpenMedDialog(false); reset();
    },
  });

  const updateMed = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateMedication }) => caregiverApi.updatePatientMedication(selectedPatient!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-patient-meds', selectedPatient] });
      setOpenMedDialog(false); reset(); setEditingMedId(null);
    },
    onError: (err: any) => alert(err.message),
  });

  const deleteMed = useMutation({
    mutationFn: (id: number) => caregiverApi.deletePatientMedication(selectedPatient!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caregiver-patient-meds', selectedPatient] }),
    onError: (err: any) => alert(err.message),
  });

  const restoreMed = useMutation({
    mutationFn: (id: number) => caregiverApi.restorePatientMedication(selectedPatient!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caregiver-patient-meds', selectedPatient] }),
    onError: (err: any) => alert(err.message),
  });

  const untakeMed = useMutation({
    mutationFn: (id: number) => caregiverApi.untakePatientMedication(selectedPatient!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caregiver-patient-meds', selectedPatient] }),
    onError: (err: any) => alert(err.message),
  });

  const addRoutine = useMutation({
    mutationFn: (data: CreateRoutine) => caregiverApi.addPatientRoutine(selectedPatient!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-patient-routines', selectedPatient] });
      setOpenRoutineDialog(false); resetRoutine();
    },
    onError: (err: any) => alert(err.message),
  });

  const deleteRoutine = useMutation({
    mutationFn: (id: number) => caregiverApi.deletePatientRoutine(selectedPatient!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caregiver-patient-routines', selectedPatient] }),
    onError: (err: any) => alert(err.message),
  });

  const restoreRoutine = useMutation({
    mutationFn: (id: number) => caregiverApi.restorePatientRoutine(selectedPatient!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caregiver-patient-routines', selectedPatient] }),
    onError: (err: any) => alert(err.message),
  });

  const uncompleteRoutine = useMutation({
    mutationFn: (id: number) => caregiverApi.uncompletePatientRoutine(selectedPatient!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caregiver-patient-routines', selectedPatient] }),
    onError: (err: any) => alert(err.message),
  });

  const disconnectPatient = useMutation({
    mutationFn: () => caregiverApi.disconnectPatient(selectedPatient!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-patients'] });
      setSelectedPatient(null);
    },
    onError: (err: any) => alert(err.response?.data || 'Failed to disconnect patient'),
  });

  const { register, handleSubmit, reset } = useForm<CreateMedication>({
    defaultValues: { frequency: 'Daily', scheduledTime: '08:00' }
  });

  const { register: regRoutine, handleSubmit: handleRoutineSubmit, reset: resetRoutine } = useForm<CreateRoutine>({
    defaultValues: { scheduledTime: '09:00' }
  });

  const handleOpenMedAdd = () => {
    reset({ frequency: 'Daily', scheduledTime: '08:00', name: '', dosage: '' });
    setEditingMedId(null);
    setOpenMedDialog(true);
  };

  const handleOpenMedEdit = (med: any) => {
    reset({ name: med.name, dosage: med.dosage, frequency: med.frequency, scheduledTime: med.scheduledTime });
    setEditingMedId(med.id);
    setOpenMedDialog(true);
  };

  const onMedSubmit = (data: CreateMedication) => {
    if (editingMedId) {
      updateMed.mutate({ id: editingMedId, data });
    } else {
      addMed.mutate(data);
    }
  };

  const handleOpenRoutineAdd = () => {
    resetRoutine({ title: '', description: '', scheduledTime: '09:00' });
    setOpenRoutineDialog(true);
  };

  const onRoutineSubmit = (data: CreateRoutine) => {
    addRoutine.mutate(data);
  };

  const addPatient = useMutation({
    mutationFn: (email: string) => caregiverApi.requestPatient(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caregiver-patients'] });
      setOpenPatientDialog(false);
      resetPatient();
      alert('Patient request sent!');
    },
    onError: (err: any) => alert(err.response?.data || 'Failed to send request')
  });

  const { register: regPatient, handleSubmit: handlePatientSubmit, reset: resetPatient } = useForm<{ email: string }>();

  const selectedPatientData = patients?.find(p => p.id === selectedPatient);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>🏥 Connected Elders</Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>Manage the individuals in your care</Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Elder List */}
        <Card sx={{ width: { md: 300 }, flexShrink: 0 }}>
          <CardContent sx={{ p: 0 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, pt: 2, pb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>
                <People sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />Elder List
              </Typography>
              <IconButton size="small" onClick={() => setOpenPatientDialog(true)} color="primary"><Add fontSize="small" /></IconButton>
            </Stack>
            <Divider />
            {isLoading ? (
              <Stack alignItems="center" py={4}><CircularProgress /></Stack>
            ) : patients && patients.length > 0 ? (
              <List disablePadding>
                {patients.map((patient, i) => (
                  <Box key={patient.id}>
                    {i > 0 && <Divider />}
                    <ListItem
                      disablePadding
                      onClick={() => setSelectedPatient(patient.id)}
                      sx={{
                        cursor: 'pointer', px: 2, py: 1.5,
                        bgcolor: selectedPatient === patient.id ? 'primary.light' : 'transparent',
                        '&:hover': { bgcolor: 'grey.100' },
                      }}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 1.5, width: 36, height: 36 }}>
                        {patient.fullName.charAt(0)}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography fontWeight={600} variant="body2">{patient.fullName}</Typography>
                            {patient.status === 'Pending' && <Chip label="Pending" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
                          </Stack>
                        }
                        secondary={<Typography variant="caption">{patient.email}</Typography>}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            ) : (
              <Box px={2} py={3}>
                <Alert severity="info">No patients linked yet.</Alert>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Patient Detail */}
        <Box flex={1}>
          {selectedPatient && selectedPatientData ? (
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                      {selectedPatientData.fullName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{selectedPatientData.fullName}</Typography>
                      <Chip label="Active Care" color="success" size="small" />
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Button color="error" variant="outlined" onClick={() => { if(confirm('Are you sure you want to completely disconnect from this patient?')) disconnectPatient.mutate() }} disabled={disconnectPatient.isPending}>
                      Disconnect
                    </Button>
                    <Button variant="contained" startIcon={<Add />} onClick={handleOpenMedAdd}>
                      Add Medication
                    </Button>
                  </Stack>
                </Stack>

                <Typography variant="subtitle1" fontWeight={700} mb={2}>💊 Medications</Typography>
                {patientMeds && patientMeds.length > 0 ? (
                  <List disablePadding>
                    {patientMeds.map((med, i) => (
                      <Box key={med.id}>
                        {i > 0 && <Divider />}
                        <ListItem sx={{ py: 1.5, opacity: med.isActive ? 1 : 0.6 }}>
                          <MedicationLiquid sx={{ mr: 2, color: med.isActive ? 'primary.main' : 'text.disabled' }} />
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography fontWeight={600} sx={{ textDecoration: med.isActive ? 'none' : 'line-through' }}>{med.name}</Typography>
                                {!med.isActive && <Chip label="Deleted" color="error" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />}
                              </Stack>
                            }
                            secondary={
                              <Stack direction="row" spacing={1} mt={0.5}>
                                <Chip label={med.dosage} size="small" variant="outlined" />
                                <Chip label={FREQ_LABELS[med.frequency] ?? med.frequency} size="small" color="primary" variant="outlined" />
                                <Chip label={`⏰ ${med.scheduledTime}`} size="small" />
                              </Stack>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {med.isTakenToday && med.isActive && (
                                <Chip 
                                  label="Taken" 
                                  color="success" 
                                  icon={<CheckCircle />} 
                                  size="small" 
                                  onDelete={(e) => { e.stopPropagation(); untakeMed.mutate(med.id); }}
                                  deleteIcon={<Undo titleAccess="Undo" />}
                                />
                              )}
                              {med.isActive ? (
                                <>
                                  <IconButton onClick={(e) => { e.stopPropagation(); handleOpenMedEdit(med); }} color="primary" size="small">
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton onClick={(e) => { e.stopPropagation(); deleteMed.mutate(med.id); }} color="error" size="small">
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </>
                              ) : (
                                <>
                                  <Button size="small" variant="outlined" color="primary" startIcon={<RestoreFromTrash />} onClick={(e) => { e.stopPropagation(); restoreMed.mutate(med.id); }}>
                                    Restore
                                  </Button>
                                  <IconButton onClick={(e) => { e.stopPropagation(); deleteMed.mutate(med.id); }} color="error" size="small">
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Stack>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">No medications added for this patient yet.</Alert>
                )}

                <Stack direction="row" alignItems="center" justifyContent="space-between" mt={4} mb={2}>
                  <Typography variant="subtitle1" fontWeight={700}>📋 Routines</Typography>
                  <Button variant="contained" startIcon={<Add />} onClick={handleOpenRoutineAdd}>
                    Add Routine
                  </Button>
                </Stack>
                {patientRoutines && patientRoutines.length > 0 ? (
                  <List disablePadding>
                    {patientRoutines.map((routine, i) => (
                      <Box key={routine.id}>
                        {i > 0 && <Divider />}
                        <ListItem sx={{ py: 1.5, opacity: routine.isActive ? 1 : 0.6 }}>
                          <Assignment sx={{ mr: 2, color: routine.isActive ? 'primary.main' : 'text.disabled' }} />
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography fontWeight={600} sx={{ textDecoration: routine.isActive ? 'none' : 'line-through' }}>{routine.title}</Typography>
                                {!routine.isActive && <Chip label="Deleted" color="error" size="small" sx={{ height: 20, fontSize: '0.65rem' }} />}
                              </Stack>
                            }
                            secondary={
                              <Stack direction="row" spacing={1} mt={0.5}>
                                <Typography variant="body2" color="text.secondary">{routine.description}</Typography>
                                <Chip label={`⏰ ${routine.scheduledTime}`} size="small" />
                              </Stack>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {routine.isCompletedToday && routine.isActive && (
                                <Chip 
                                  label="Completed" 
                                  color="success" 
                                  icon={<CheckCircle />} 
                                  size="small" 
                                  onDelete={(e) => { e.stopPropagation(); uncompleteRoutine.mutate(routine.id); }}
                                  deleteIcon={<Undo titleAccess="Undo" />}
                                />
                              )}
                              {routine.isActive ? (
                                <IconButton onClick={(e) => { e.stopPropagation(); deleteRoutine.mutate(routine.id); }} color="error" size="small">
                                  <Delete fontSize="small" />
                                </IconButton>
                              ) : (
                                <>
                                  <Button size="small" variant="outlined" color="primary" startIcon={<RestoreFromTrash />} onClick={(e) => { e.stopPropagation(); restoreRoutine.mutate(routine.id); }}>
                                    Restore
                                  </Button>
                                  <IconButton onClick={(e) => { e.stopPropagation(); deleteRoutine.mutate(routine.id); }} color="error" size="small">
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Stack>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">No routines added by this patient yet.</Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Stack alignItems="center" py={8} spacing={2}>
                  <Person sx={{ fontSize: 80, color: 'grey.300' }} />
                  <Typography color="text.secondary" variant="h6">Select a patient from the list</Typography>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>
      </Stack>

      {/* Add Medication Dialog */}
      <Dialog open={openMedDialog} onClose={() => setOpenMedDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onMedSubmit)}>
          <DialogTitle fontWeight={700}>{editingMedId ? 'Edit Medication' : 'Add Medication'} — {selectedPatientData?.fullName}</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} pt={1}>
              <TextField label="Medication Name" fullWidth {...register('name', { required: true })} />
              <TextField label="Dosage" fullWidth placeholder="e.g. 500mg" {...register('dosage', { required: true })} />
              <TextField label="Frequency" select fullWidth {...register('frequency')} defaultValue="Daily">
                {FREQUENCIES.map(f => <MenuItem key={f} value={f}>{FREQ_LABELS[f]}</MenuItem>)}
              </TextField>
              <TextField label="Time" type="time" fullWidth {...register('scheduledTime')} InputLabelProps={{ shrink: true }} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenMedDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addMed.isPending || updateMed.isPending}>
              {addMed.isPending || updateMed.isPending ? 'Saving...' : (editingMedId ? 'Save Changes' : 'Add')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Patient Dialog */}
      <Dialog open={openPatientDialog} onClose={() => setOpenPatientDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handlePatientSubmit(d => addPatient.mutate(d.email))}>
          <DialogTitle fontWeight={700}>Add Patient</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} pt={1}>
              <Typography variant="body2" color="text.secondary">Enter the email address of the patient you want to invite.</Typography>
              <TextField label="Patient Email" type="email" fullWidth {...regPatient('email', { required: true })} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenPatientDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addPatient.isPending}>
              {addPatient.isPending ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Add Routine Dialog */}
      <Dialog open={openRoutineDialog} onClose={() => setOpenRoutineDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleRoutineSubmit(onRoutineSubmit)}>
          <DialogTitle fontWeight={700}>Add Routine — {selectedPatientData?.fullName}</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} pt={1}>
              <TextField label="Routine Title" fullWidth placeholder="e.g. Morning Walk" {...regRoutine('title', { required: true })} />
              <TextField label="Description (Optional)" fullWidth placeholder="e.g. Walk in the park for 30 minutes" {...regRoutine('description')} />
              <TextField label="Time" type="time" fullWidth {...regRoutine('scheduledTime', { required: true })} InputLabelProps={{ shrink: true }} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpenRoutineDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addRoutine.isPending}>
              {addRoutine.isPending ? 'Saving...' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
