import React, { useState, useMemo, useCallback } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import axios from 'axios';
import { startOfDay, endOfDay } from 'date-fns';
import AppHeader from './components/AppHeader';
import SidebarConfig from './components/SidebarConfig';
import SidebarFilters from './components/SidebarFilters';
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

  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(startOfDay(new Date()));
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(endOfDay(new Date()));

  const { addToDownloadedLog, isDownloaded } = useDownloadedLog();
  const downloadState = useDownloadQueue(credentials, addToDownloadedLog);

  const handleConnect = (creds, channelList) => {
    setCredentials(creds);
    setChannels(channelList);
    setSelectedCameras(channelList);
    setResults(null);
  };

  const handleDisconnect = () => {
    setCredentials(null);
    setChannels([]);
    setSelectedCameras([]);
    setResults(null);
  };

  const handleCameraToggle = useCallback((camera) => {
    setSelectedCameras(prev => {
      const exists = prev.find(c => c.id === camera.id);
      if (exists) {
        return prev.filter(c => c.id !== camera.id);
      }
      return [...prev, camera];
    });
  }, []);

  const handleSelectAll = () => setSelectedCameras([...channels]);
  const handleSelectNone = () => setSelectedCameras([]);

  const API_URL = '';

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const fmt = (d) => {
        const date = d instanceof Date ? d : new Date(d);
        const y = date.getFullYear();
        const mo = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const mi = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${y}-${mo}-${day}T${h}:${mi}:${s}Z`;
      };

      const res = await axios.post(`${API_URL}/api/search`, {
        ...credentials,
        startTime: fmt(startTime),
        endTime: fmt(endTime),
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

    return results.filter(r => {
      const rid = String(r.cameraID);
      if (selectedIds.has(rid)) return true;
      if (rid.length >= 3 && rid.endsWith('01')) {
        const baseId = rid.substring(0, rid.length - 2);
        if (selectedIds.has(baseId)) return true;
      }
      if (selectedNames.has(r.cameraName)) return true;
      return false;
    });
  }, [results, selectedCameras]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', p: 1.5 }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <AppHeader />

        {/* Body: Sidebar + Main */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          {/* Left Sidebar */}
          <Box
            sx={{
              width: 280,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {/* Connect Panel */}
            <Box sx={{ backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
              <SidebarConfig credentials={credentials} onConnect={handleConnect} onDisconnect={handleDisconnect} />
            </Box>

            {/* Filters Panel */}
            {credentials && channels.length > 0 && (
              <Box sx={{ backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <SidebarFilters
                  channels={channels}
                  selectedCameras={selectedCameras}
                  onCameraToggle={handleCameraToggle}
                  onSelectAll={handleSelectAll}
                  onSelectNone={handleSelectNone}
                  startDate={startDate}
                  setStartDate={setStartDate}
                  startTime={startTime}
                  setStartTime={setStartTime}
                  endDate={endDate}
                  setEndDate={setEndDate}
                  endTime={endTime}
                  setEndTime={setEndTime}
                  onSearch={handleSearch}
                  loading={loading}
                  disabled={!credentials}
                />
              </Box>
            )}

            {/* Download Monitor */}
            {credentials && downloadState.queue.length > 0 && (
              <Box sx={{ backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <DownloadQueueMonitor
                  downloadState={downloadState}
                  onCancelAll={() => setOpenCancelDialog(true)}
                />
              </Box>
            )}
          </Box>

          {/* Main Content */}
          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {/* Results Panel */}
            {credentials && results && (
              <Box
                sx={{
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                  flexGrow: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      letterSpacing: '0.5px',
                      color: 'text.secondary',
                    }}
                  >
                    Recording Files — {filteredResults.length} Results
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {credentials.ip} — {channels.length} cameras
                    </Typography>
                  </Box>
                </Box>
                <ResultsTable
                  results={filteredResults}
                  totalCount={results.length}
                  credentials={credentials}
                  downloadState={downloadState}
                  isDownloaded={isDownloaded}
                  loading={loading}
                />
              </Box>
            )}

            {/* Empty state when not connected */}
            {!credentials && (
              <Box
                sx={{
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" color="text.secondary" sx={{ fontFamily: '"Fira Code", monospace', fontSize: '0.9rem' }}>
                  Connect to an NVR to search recordings
                </Typography>
              </Box>
            )}

            {/* Loading / error states */}
            {credentials && !results && !loading && !error && (
              <Box
                sx={{
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Set time range and cameras, then click Search
                </Typography>
              </Box>
            )}

            {loading && (
              <Box
                sx={{
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Searching...
                </Typography>
              </Box>
            )}

            {error && (
              <Box
                sx={{
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                }}
                role="alert"
              >
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Cancel Dialog */}
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
        <DialogTitle>Cancel All Downloads?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will stop all active and pending downloads and clear the queue. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>No, Keep Downloading</Button>
          <Button
            onClick={() => {
              downloadState.cancelAll();
              setOpenCancelDialog(false);
            }}
            color="error"
            autoFocus
          >
            Yes, Cancel All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
