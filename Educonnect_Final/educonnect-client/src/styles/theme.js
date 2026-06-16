import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { main: '#1976D2', light: '#42A5F5', dark: '#1565C0' },
          secondary: { main: '#6C63FF', light: '#9C94FF', dark: '#3F51B5' },
          success: { main: '#4CAF50', light: '#81C784', dark: '#388E3C' },
          warning: { main: '#FF9800', light: '#FFB74D', dark: '#F57C00' },
          error: { main: '#F44336', light: '#E57373', dark: '#D32F2F' },
          info: { main: '#2196F3', light: '#64B5F6', dark: '#1976D2' },
          background: {
            default: '#F5F7FA',
            paper: '#FFFFFF',
          },
          text: {
            primary: '#1A1A2E',
            secondary: '#555770',
          },
          divider: 'rgba(0, 0, 0, 0.08)',
        }
      : {
          primary: { main: '#42A5F5', light: '#64B5F6', dark: '#1976D2' },
          secondary: { main: '#9C94FF', light: '#B8B2FF', dark: '#6C63FF' },
          success: { main: '#66BB6A', light: '#81C784', dark: '#388E3C' },
          warning: { main: '#FFA726', light: '#FFB74D', dark: '#F57C00' },
          error: { main: '#EF5350', light: '#E57373', dark: '#D32F2F' },
          info: { main: '#42A5F5', light: '#64B5F6', dark: '#1976D2' },
          background: {
            default: '#0F0F23',
            paper: '#1A1A2E',
          },
          text: {
            primary: '#E8E8F0',
            secondary: '#A0A0B8',
          },
          divider: 'rgba(255, 255, 255, 0.08)',
        }),
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.6 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.06)',
    '0 2px 6px rgba(0,0,0,0.08)',
    '0 4px 12px rgba(0,0,0,0.1)',
    '0 6px 16px rgba(0,0,0,0.12)',
    '0 8px 24px rgba(0,0,0,0.14)',
    '0 12px 32px rgba(0,0,0,0.16)',
    ...Array(18).fill('0 12px 32px rgba(0,0,0,0.16)'),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #1976D2, #1565C0)',
          },
          '&.MuiButton-containedSecondary': {
            background: 'linear-gradient(135deg, #6C63FF, #3F51B5)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
            },
            '&.Mui-focused': {
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.8rem',
        },
      },
    },
  },
});

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));

export default createAppTheme;
