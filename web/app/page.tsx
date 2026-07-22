'use client';
import {
  Box, Button, Container, Grid, Typography, Card, CardContent, Stack, Chip, Avatar, Divider
} from '@mui/material';
import {
  Favorite, MedicationLiquid, NotificationsActive, Chat, ArrowForward,
  CheckCircle, Security, Speed, FamilyRestroom
} from '@mui/icons-material';
import Link from 'next/link';

const features = [
  { icon: <MedicationLiquid sx={{ fontSize: 40, color: 'primary.main' }} />, title: 'Medication Tracking', desc: 'Never miss a dose with timely reminders and full history.' },
  { icon: <NotificationsActive sx={{ fontSize: 40, color: 'primary.main' }} />, title: 'Instant Alerts', desc: 'Caregivers receive real-time notifications for critical events.' },
  { icon: <Chat sx={{ fontSize: 40, color: 'primary.main' }} />, title: 'AI Health Assistant', desc: 'Ask any health question — your smart chatbot is available 24/7.' },
  { icon: <FamilyRestroom sx={{ fontSize: 40, color: 'primary.main' }} />, title: 'Family Connection', desc: 'Remotely monitor the wellbeing of your loved ones.' },
];

export default function LandingPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      {/* Navbar */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 100,
        bgcolor: 'background.default',
        borderBottom: '1px solid', borderColor: 'divider',
        px: { xs: 2, md: 6 }, py: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Favorite sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight={800} color="text.primary">DailyAid</Typography>
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button component={Link} href="/auth/login" variant="text" size="medium" sx={{ color: 'text.primary', fontWeight: 600 }}>Sign In</Button>
          <Button component={Link} href="/auth/register" variant="contained" size="medium">Get Started Free</Button>
        </Stack>
      </Box>

      {/* Hero */}
      <Box sx={{ bgcolor: 'background.default', pt: { xs: 8, md: 14 }, pb: { xs: 8, md: 8 } }}>
        <style>
          {`
            @keyframes dropIn {
              0% { opacity: 0; transform: translateY(-40px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes blink {
              0%, 100% { opacity: 0; }
              50% { opacity: 1; }
            }
          `}
        </style>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Chip label="AI-Powered Elderly Care Platform" sx={{ mb: 3, fontWeight: 600, border: '1px solid', borderColor: 'text.primary', bgcolor: 'transparent', color: 'primary.main', borderRadius: 1 }} />
              <Typography variant="h1" sx={{
                fontSize: { xs: '2.8rem', md: '4.5rem' }, fontWeight: 800, mb: 3, lineHeight: 1.1,
                color: 'text.primary'
              }}>
                <Box component="span" sx={{ display: 'inline-block', animation: 'dropIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards', opacity: 0 }}>
                  Provide the Best Care
                </Box>
                <br />
                <Box component="span" sx={{
                  color: 'primary.main', display: 'inline-block',
                  animation: 'dropIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.15s forwards', opacity: 0
                }}>
                  for Your Loved Ones
                </Box>
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{
                mb: 5, fontWeight: 400, lineHeight: 1.7
              }}>
                DailyAid is a smart care platform designed to simplify daily medication management,
                routines, and health monitoring for the elderly.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  component={Link} href="/auth/register"
                  variant="contained" size="large" endIcon={<ArrowForward />}
                  sx={{ py: 1.8, px: 4, fontSize: '1.1rem' }}
                >
                  Get Started Free
                </Button>
                <Button
                  component={Link} href="/auth/login"
                  variant="outlined" size="large"
                  sx={{ py: 1.8, px: 4, fontSize: '1.1rem' }}
                >
                  Sign In
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{
                position: 'relative', width: '100%', pt: '75%',
                bgcolor: 'text.primary',
                borderRadius: 2,
                overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <Box sx={{ position: 'absolute', top: 20, left: 20, right: 20, bottom: -20, bgcolor: 'background.paper', borderRadius: '4px 4px 0 0', p: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={2} mb={3}>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', color: 'background.paper', borderRadius: 1 }}><NotificationsActive /></Avatar>
                    <Box>
                      <Typography fontWeight={700} color="text.primary">New Alert</Typography>
                      <Typography variant="body2" color="text.secondary">Medication taken successfully.</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: 'success.main', color: 'background.paper', borderRadius: 1 }}><CheckCircle /></Avatar>
                    <Box>
                      <Typography fontWeight={700} color="text.primary">Morning Routine</Typography>
                      <Typography variant="body2" color="text.secondary">Completed at 08:30 AM</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Box sx={{ bgcolor: 'background.default', pt: { xs: 8, md: 8 }, pb: 12 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" fontWeight={800} textAlign="center" mb={2} color="text.primary">
            Our Solutions
          </Typography>
          <Typography variant="h6" color="text.secondary" textAlign="center" mb={8} fontWeight={400} sx={{ maxWidth: 600, mx: 'auto', opacity: 0.85 }}>
            Designed specifically for elderly individuals and their caregivers to provide seamless, intuitive healthcare management.
          </Typography>
          <Grid container spacing={4} sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            {features.map((f) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={f.title}>
                <Card sx={{
                  height: '100%', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.paper', boxShadow: 'none',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { transform: 'translateY(-8px)', border: '1px solid', borderColor: 'primary.main' }
                }}>
                  <CardContent sx={{ textAlign: 'center', p: 0 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', color: 'primary.main', width: 80, height: 80, mx: 'auto', mb: 3, borderRadius: 2 }}>
                      {f.icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} mb={2} color="text.primary">{f.title}</Typography>
                    <Typography variant="body1" color="text.secondary" lineHeight={1.6}>{f.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Why DailyAid */}
      <Box sx={{ py: 14, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }} sx={{ mx: 'auto' }}>
              <Typography variant="h2" fontWeight={800} mb={5} color="text.primary" textAlign="center">Why DailyAid?</Typography>
              {[
                { icon: <FamilyRestroom sx={{ fontSize: 28, color: 'background.paper' }} />, title: 'Family Integration', text: 'Caregiver and family panels unified in one platform.' },
                { icon: <CheckCircle sx={{ fontSize: 28, color: 'background.paper' }} />, title: 'Always Available', text: 'AI health assistant at your disposal 24/7.' },
                { icon: <Security sx={{ fontSize: 28, color: 'background.paper' }} />, title: 'Bank-grade Security', text: 'All data is fully encrypted and GDPR-compliant.' },
                { icon: <Speed sx={{ fontSize: 28, color: 'background.paper' }} />, title: 'Real-Time Sync', text: 'Instant notifications — never miss a critical moment.' },
              ].map((item, i) => (
                <Stack key={i} direction="row" spacing={3} alignItems="flex-start" mb={5}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, borderRadius: 2 }}>{item.icon}</Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700} mb={0.5} color="text.primary">{item.title}</Typography>
                    <Typography variant="body1" color="text.secondary" lineHeight={1.6}>{item.text}</Typography>
                  </Box>
                </Stack>
              ))}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{ py: 16, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={800} mb={3} color="text.primary">Ready to Get Started?</Typography>
          <Typography variant="h5" color="text.secondary" mb={6} fontWeight={400}>
            Create a free account today and experience the future of caregiving immediately.
          </Typography>
          <Button
            component={Link} href="/auth/register"
            variant="contained" size="large" endIcon={<ArrowForward />}
            sx={{ py: 2.2, px: 6, fontSize: '1.2rem' }}
          >
            Get Started Free
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 8, bgcolor: 'text.primary', color: 'background.paper' }}>
        <Container maxWidth="lg">
          <Stack alignItems="center" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Favorite sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h5" color="background.paper" fontWeight={800}>DailyAid</Typography>
            </Stack>
            <Typography variant="body1" align="center" lineHeight={1.7} color="background.default" sx={{ maxWidth: 600 }}>
              Empowering families with smart, compassionate, and reliable care tools for the elderly.
            </Typography>
            <Typography variant="body2" align="center" color="background.default" sx={{ opacity: 0.6 }}>
              © 2026 DailyAid. All rights reserved.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
