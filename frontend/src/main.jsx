import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from './theme';
import './index.css'
import App from './App.jsx'
import MultiTabGuard from './components/MultiTabGuard';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MultiTabGuard>
          <App />
        </MultiTabGuard>
      </LocalizationProvider>
    </ThemeProvider>
  </StrictMode>,
)
