'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box, Button, Card, CardContent, TextField, Typography,
  Stack, Alert, InputAdornment, IconButton, Divider
} from '@mui/material';
import { Favorite, Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(data);
      const { token, userId, fullName, role } = res.data;
      setAuth(token, userId, fullName, role);
      router.push(role === 'Elderly' ? '/elderly/dashboard' : '/caregiver/dashboard');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'background.default', p: 2
    }}>
      <Card sx={{ width: '100%', maxWidth: 440, p: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack alignItems="center" mb={4}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Favorite sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography variant="h5" fontWeight={800} color="primary.main">DailyAid</Typography>
            </Stack>
            <Typography variant="h5" fontWeight={700} mb={0.5}>Welcome Back</Typography>
            <Typography variant="body2" color="text.secondary">Sign in to your account</Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <TextField
                label="Email"
                fullWidth
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment>
                }}
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
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Stack>
          </form>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">or</Typography>
          </Divider>

          <Stack alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Don&apos;t have an account?{' '}
              <Box component={Link} href="/auth/register" sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}>
                Sign up for free
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
