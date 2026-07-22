'use client';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#C56A3C', // Terracotta
    },
    secondary: {
      main: '#F3E9D8', // Warm cream
    },
    error: { main: '#DC2626' },
    warning: { main: '#D97706' },
    info: { main: '#111827' },
    success: { main: '#16A34A' },
    background: {
      default: '#F3E9D8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: 'rgba(17, 24, 39, 0.7)',
    },
  },
  typography: {
    fontFamily: '"DM Serif Display", serif',
    allVariants: {
      color: '#111827',
    },
    h1: { fontSize: '2.5rem', fontWeight: 400 },
    h2: { fontWeight: 400 },
    h3: { fontWeight: 400 },
    h4: { fontWeight: 400 },
    h5: { fontWeight: 400 },
    h6: { fontWeight: 400 },
    button: {
      fontFamily: '"JetBrains Mono", monospace',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    },
    overline: {
      fontFamily: '"JetBrains Mono", monospace',
    }
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F3E9D8',
          color: '#111827',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
          padding: '10px 24px',
          boxShadow: 'none',
        },
        contained: {
          backgroundColor: '#C56A3C',
          color: '#FFFFFF',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#C56A3C',
            opacity: 0.9,
            boxShadow: 'none',
          }
        },
        outlined: {
          borderColor: '#C56A3C',
          color: '#C56A3C',
          borderWidth: 2,
          '&:hover': {
            borderColor: '#C56A3C',
            borderWidth: 2,
            backgroundColor: 'rgba(197, 106, 60, 0.05)',
          }
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(17, 24, 39, 0.05)',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': { borderRadius: 8 },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"JetBrains Mono", monospace',
          borderRadius: 4,
        }
      }
    }
  },
});
