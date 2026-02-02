import React, { useState } from 'react';
import { 
  Container, Typography, Box, Alert, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import axios from 'axios';
import { startOfDay, endOfDay } from 'date-fns';
import ConnectionForm from './components/ConnectionForm';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import DownloadQueueMonitor from './components/DownloadQueueMonitor';
import useDownloadQueue from './hooks/useDownloadQueue';

function App() {
  const [credentials, setCredentials] = useState(null);
  const [channels, setChannels] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);

  // Lifted state for SearchForm
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(startOfDay(new Date()));
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(endOfDay(new Date()));

  // Lifted Download Queue
  const downloadState = useDownloadQueue(credentials);

  const handleConnect = (creds, channelList) => {
    setCredentials(creds);
    setChannels(channelList);
    setResults(null); // Reset results on new connection
  };

  const API_URL = ''; // import.meta.env.VITE_API_URL || '';

  const handleSearch = async (startTimeStr, endTimeStr) => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await axios.post(`${API_URL}/api/search`, {
        ...credentials,
        startTime: startTimeStr,
        endTime: endTimeStr
      });
      if (res.data.success) {
        setResults(res.data.results);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ flexShrink: 0 }}>
        Hikvision NVR Downloader
      </Typography>

      {/* Connection Section */}
      <Box sx={{ mb: 2 }}>
        {!credentials ? (
          <ConnectionForm onConnect={handleConnect} />
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <Typography variant="subtitle1">Connected to {credentials.ip} ({channels.length} cameras found)</Typography>
            <Button variant="outlined" color="error" onClick={() => setCredentials(null)}>Disconnect</Button>
          </Box>
        )}
      </Box>

      {/* Search Section - Always visible, state preserved */}
      <Box sx={{ flexShrink: 0 }}>
        <SearchForm 
          startDate={startDate} setStartDate={setStartDate}
          startTime={startTime} setStartTime={setStartTime}
          endDate={endDate} setEndDate={setEndDate}
          endTime={endTime} setEndTime={setEndTime}
          onSearch={handleSearch}
          disabled={!credentials}
        />
        
        {/* Messages */}
        {results && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Found {results.length} recordings
          </Typography>
        )}

        {loading && <Typography>Searching...</Typography>}
        {error && <Alert severity="error">{error}</Alert>}
      </Box>

      {/* Download Monitor - visible when connected and has items */}
      {credentials && (
         <DownloadQueueMonitor 
            downloadState={downloadState}
            onCancelAll={() => setOpenCancelDialog(true)}
         />
      )}

      {/* Results Section */}
      {credentials && results && (
        <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
           <ResultsTable 
             results={results} 
             credentials={credentials}
             downloadState={downloadState}
             onCancelAll={() => setOpenCancelDialog(true)}
           />
        </Box>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
      >
        <DialogTitle>Cancel All Downloads?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will stop all active and pending downloads and clear the queue. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>No, Keep Downloading</Button>
          <Button onClick={() => {
            downloadState.cancelAll();
            setOpenCancelDialog(false);
          }} color="error" autoFocus>
            Yes, Cancel All
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default App;
