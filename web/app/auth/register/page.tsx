'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Button, Card, CardContent, TextField, Typography, Stack,
  Alert, InputAdornment, IconButton, Divider
} from '@mui/material';
import {
  Favorite, Visibility, VisibilityOff, Email, Lock,
  Person, ElderlyWoman, HealthAndSafety
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.number(),
});
type FormData = z.infer<typeof schema>;

const roleOptions = [
  { value: 0, label: 'I am an Elderly Person', icon: <ElderlyWoman />, desc: "I'll use it for my daily care" },
  { value: 1, label: 'I am a Family Member / Caregiver', icon: <HealthAndSafety />, desc: "I'll monitor a loved one" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 0 },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.register(data);
      const { token, userId, fullName, role } = res.data;
      setAuth(token, userId, fullName, role);
      router.push(role === 'Elderly' ? '/elderly/dashboard' : '/caregiver/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'background.default', p: 2, py: 6
    }}>
      <Card sx={{ width: '100%', maxWidth: 500, p: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack alignItems="center" mb={4}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Favorite sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography variant="h5" fontWeight={800} color="primary.main">DailyAid</Typography>
            </Stack>
            <Typography variant="h5" fontWeight={700} mb={0.5}>Create an Account</Typography>
            <Typography variant="body2" color="text.secondary">Free — get started in seconds</Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              {/* Role Selection */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="text.secondary">
                  I am a...
                </Typography>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      {roleOptions.map((opt) => (
                        <Box
                          key={opt.value}
                          onClick={() => field.onChange(opt.value)}
                          sx={{
                            flex: 1, p: 2, borderRadius: 3, cursor: 'pointer',
                            border: '2px solid',
                            borderColor: field.value === opt.value ? 'primary.main' : 'divider',
                            bgcolor: field.value === opt.value ? 'secondary.main' : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: 'primary.light' }
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ color: field.value === opt.value ? 'primary.main' : 'grey.400' }}>
                              {opt.icon}
                            </Box>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>{opt.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{opt.desc}</Typography>
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                />
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="First Name"
                  fullWidth
                  {...register('firstName')}
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }}
                />
                <TextField
                  label="Last Name"
                  fullWidth
                  {...register('lastName')}
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </Stack>

              <TextField
                label="Email"
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <Button
                type="submit" variant="contained" fullWidth size="large"
                disabled={loading}
                sx={{ py: 1.5, fontSize: '1rem', boxShadow: 'none' }}
              >
                {loading ? 'Creating account...' : 'Create Free Account'}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">or</Typography>
          </Divider>

          <Stack alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Box component={Link} href="/auth/login" sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}>
                Sign In
              </Box>
            </Typography>
            <Button component={Link} href="/" variant="text" size="small" sx={{ mt: 1, color: 'text.secondary' }}>
              ← Back to home
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
