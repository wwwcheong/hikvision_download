import React, { useState, useMemo } from 'react';
import { 
  Container, Typography, Box, Alert, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Autocomplete, TextField, Stack
} from '@mui/material';
import axios from 'axios';
import { startOfDay, endOfDay } from 'date-fns';
import ConnectionForm from './components/ConnectionForm';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import DownloadQueueMonitor from './components/DownloadQueueMonitor';
import useDownloadQueue from './hooks/useDownloadQueue';
import { useDownloadedLog } from './hooks/useDownloadedLog';

function App() {
  const [credentials, setCredentials] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);

  // Lifted state for SearchForm
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(startOfDay(new Date()));
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(endOfDay(new Date()));

  // Lifted Downloaded Log
  const { addToDownloadedLog, isDownloaded } = useDownloadedLog();

  // Lifted Download Queue
  const downloadState = useDownloadQueue(credentials, addToDownloadedLog);

  const handleConnect = (creds, channelList) => {
    setCredentials(creds);
    setChannels(channelList);
    setSelectedCameras(channelList); // Select all by default
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

  const filteredResults = useMemo(() => {
    if (!results) return [];
    if (selectedCameras.length === 0) return [];
    
    const selectedIds = new Set(selectedCameras.map(c => String(c.id)));
    const selectedNames = new Set(selectedCameras.map(c => c.name));

    const filtered = results.filter(r => {
      const rid = String(r.cameraID);
      // Direct match
      if (selectedIds.has(rid)) return true;
      
      // Handle NVR trackID mapping (e.g., Camera 1 id '1' -> trackID '101')
      // If rid is '101', check if '1' is selected.
      if (rid.length >= 3 && rid.endsWith('01')) {
          const baseId = rid.substring(0, rid.length - 2);
          if (selectedIds.has(baseId)) return true;
      }
      
      // Fallback to name match if ID fails (for robustness)
      if (selectedNames.has(r.cameraName)) return true;

      return false;
    });

    console.log('Filter Debug:', {
      total: results.length,
      filtered: filtered.length,
      selectedIds: Array.from(selectedIds),
      firstResult: results.length > 0 ? { id: results[0].cameraID, name: results[0].cameraName } : null
    });
    return filtered;
  }, [results, selectedCameras]);

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', py: 1 }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1, 
        pb: 1, 
        borderBottom: '1px solid #eee',
        flexShrink: 0 
      }}>
        <Typography variant="h6" component="h1">
          Hikvision NVR Downloader
        </Typography>
        
        {credentials && (
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Connected: <strong>{credentials.ip}</strong> ({channels.length} cams)
            </Typography>
            <Button size="small" variant="outlined" color="error" onClick={() => setCredentials(null)}>
              Disconnect
            </Button>
          </Stack>
        )}
      </Box>

      {/* Connection Form (when not connected) */}
      {!credentials && (
        <Box sx={{ mb: 2 }}>
          <ConnectionForm onConnect={handleConnect} />
        </Box>
      )}

      {/* Search & Filter Section */}
      <Box sx={{ flexShrink: 0 }}>
        <SearchForm 
          startDate={startDate} setStartDate={setStartDate}
          startTime={startTime} setStartTime={setStartTime}
          endDate={endDate} setEndDate={setEndDate}
          endTime={endTime} setEndTime={setEndTime}
          onSearch={handleSearch}
          disabled={!credentials}
        />
        
        {/* Camera Filter - Compact */}
        {credentials && channels.length > 0 && (
          <Box sx={{ mb: 1, p: 1, border: '1px solid #f0f0f0', borderRadius: 1, backgroundColor: '#fafafa' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Autocomplete
                multiple
                size="small"
                limitTags={5}
                id="camera-filter"
                options={channels}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedCameras}
                onChange={(_, newValue) => setSelectedCameras(newValue)}
                filterSelectedOptions
                disableClearable
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Camera"
                    placeholder="Select cameras"
                  />
                )}
                sx={{ flexGrow: 1 }}
              />
              <Button size="small" onClick={() => setSelectedCameras(channels)} sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}>
                All
              </Button>
              <Button size="small" onClick={() => setSelectedCameras([])} sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}>
                None
              </Button>
            </Stack>
          </Box>
        )}

        {/* Messages */}
        {(loading || error) && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
            {loading && <Typography variant="caption">Searching...</Typography>}
            {error && <Typography variant="caption" color="error">{error}</Typography>}
          </Box>
        )}
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
             results={filteredResults} 
             totalCount={results.length}
             credentials={credentials}
             downloadState={downloadState}
             isDownloaded={isDownloaded}
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
