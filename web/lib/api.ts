import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  register: (data: RegisterDto) => api.post<AuthResponse>('/auth/register', data),
  login: (data: LoginDto) => api.post<AuthResponse>('/auth/login', data),
};

// Elderly
export const elderlyApi = {
  getMedications: () => api.get<Medication[]>('/elderly/medications'),
  addMedication: (data: CreateMedication) => api.post<Medication>('/elderly/medications', data),
  updateMedication: (id: number, data: CreateMedication) => api.put<Medication>(`/elderly/medications/${id}`, data),
  takeMedication: (id: number) => api.post(`/elderly/medications/${id}/take`),
  untakeMedication: (id: number) => api.post(`/elderly/medications/${id}/untake`),
  deleteMedication: (id: number) => api.delete(`/elderly/medications/${id}`),
  getRoutines: () => api.get<Routine[]>('/elderly/routines'),
  addRoutine: (data: CreateRoutine) => api.post<Routine>('/elderly/routines', data),
  completeRoutine: (id: number) => api.post(`/elderly/routines/${id}/complete`),
  uncompleteRoutine: (id: number) => api.post(`/elderly/routines/${id}/uncomplete`),
  deleteRoutine: (id: number) => api.delete(`/elderly/routines/${id}`),
  chat: (message: string) => api.post<ChatResponse>('/elderly/chat', { message }),
  leaveChat: () => api.post('/elderly/chat/leave'),
  sendEmergencyAlert: (message: string) => api.post('/elderly/emergency', { message }),
  getNotifications: () => api.get<Notification[]>('/elderly/notifications'),
  markRead: (id: number) => api.put(`/elderly/notifications/${id}/read`),
  deleteNotification: (id: number) => api.delete(`/elderly/notifications/${id}`),
  acceptRequest: (id: number) => api.post(`/elderly/requests/${id}/accept`),
  rejectRequest: (id: number) => api.post(`/elderly/requests/${id}/reject`),
};

// Caregiver
export const caregiverApi = {
  getPatients: () => api.get<Patient[]>('/caregiver/patients'),
  getPatientMedications: (elderlyId: string) => api.get<Medication[]>(`/caregiver/patients/${elderlyId}/medications`),
  getPatientRoutines: (elderlyId: string) => api.get<Routine[]>(`/caregiver/patients/${elderlyId}/routines`),
  addPatientMedication: (elderlyId: string, data: CreateMedication) =>
    api.post<Medication>(`/caregiver/patients/${elderlyId}/medications`, data),
  updatePatientMedication: (elderlyId: string, medicationId: number, data: CreateMedication) =>
    api.put<Medication>(`/caregiver/patients/${elderlyId}/medications/${medicationId}`, data),
  deletePatientMedication: (elderlyId: string, medicationId: number) => 
    api.delete(`/caregiver/patients/${elderlyId}/medications/${medicationId}`),
  restorePatientMedication: (elderlyId: string, medicationId: number) => 
    api.post(`/caregiver/patients/${elderlyId}/medications/${medicationId}/restore`),
  untakePatientMedication: (elderlyId: string, medicationId: number) => 
    api.post(`/caregiver/patients/${elderlyId}/medications/${medicationId}/untake`),
  addPatientRoutine: (elderlyId: string, data: CreateRoutine) =>
    api.post<Routine>(`/caregiver/patients/${elderlyId}/routines`, data),
  deletePatientRoutine: (elderlyId: string, routineId: number) => 
    api.delete(`/caregiver/patients/${elderlyId}/routines/${routineId}`),
  restorePatientRoutine: (elderlyId: string, routineId: number) => 
    api.post(`/caregiver/patients/${elderlyId}/routines/${routineId}/restore`),
  uncompletePatientRoutine: (elderlyId: string, routineId: number) => 
    api.post(`/caregiver/patients/${elderlyId}/routines/${routineId}/uncomplete`),
  getNotifications: () => api.get<Notification[]>('/caregiver/notifications'),
  markRead: (id: number) => api.put(`/caregiver/notifications/${id}/read`),
  deleteNotification: (id: number) => api.delete(`/caregiver/notifications/${id}`),
  requestPatient: (email: string) => api.post('/caregiver/patients/request', { email }),
  disconnectPatient: (elderlyId: string) => api.delete(`/caregiver/patients/${elderlyId}`),
  getSentimentAnalysis: () => api.get<SentimentAnalysis[]>('/caregiver/sentiment'),
  getPatientChatHistory: (elderlyId: string) => api.get<ChatHistory[]>(`/caregiver/patients/${elderlyId}/chat-history`),
};

// Types
export interface RegisterDto {
  firstName: string; lastName: string; email: string; password: string; role: number;
}
export interface LoginDto { email: string; password: string; }
export interface AuthResponse {
  token: string; userId: string; fullName: string; email: string; role: string;
}
export interface Medication {
  id: number; name: string; dosage: string; frequency: string; scheduledTime: string; isActive: boolean; isTakenToday: boolean;
}
export interface CreateMedication {
  name: string; dosage: string; frequency: string; scheduledTime: string;
}
export interface Routine {
  id: number; title: string; description?: string; scheduledTime: string; isActive: boolean; isCompletedToday: boolean;
}
export interface CreateRoutine { title: string; description?: string; scheduledTime: string; }
export interface ChatResponse { reply: string; sentiment: string; is_critical?: boolean; }
export interface Notification {
  id: number; title: string; message: string; isRead: boolean; createdAt: string; type?: string;
}
export interface Patient {
  id: string; fullName: string; email: string; relationStartDate: string; status: string; isOnline?: boolean; lastSeen?: string | null;
}
export interface SentimentAnalysis {
  elderlyId: string; fullName: string; totalMessages: number; positive: number; negative: number; neutral: number;
}
export interface ChatHistory {
  id: number; content: string; isBot: boolean; sentiment?: string; sentAt: string;
}

export default api;
