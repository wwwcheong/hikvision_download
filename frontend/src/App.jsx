import React, { useState } from 'react';
import { Container, Typography, Box, Alert, Button } from '@mui/material';
import axios from 'axios';
import ConnectionForm from './components/ConnectionForm';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';

function App() {
  const [credentials, setCredentials] = useState(null);
  const [channels, setChannels] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = (creds, channelList) => {
    setCredentials(creds);
    setChannels(channelList);
    setResults(null); // Reset results
  };

const API_URL = ''; // import.meta.env.VITE_API_URL || '';

  const handleSearch = async (startTime, endTime) => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await axios.post(`${API_URL}/api/search`, {
        ...credentials,
        startTime,
        endTime
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

      {!credentials ? (
        <ConnectionForm onConnect={handleConnect} />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
           <Box sx={{ flexShrink: 0 }}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
               <Typography variant="subtitle1">Connected to {credentials.ip} ({channels.length} cameras found)</Typography>
               <Button onClick={() => setCredentials(null)}>Disconnect</Button>
             </Box>
             
             <SearchForm onSearch={handleSearch} />
             
             {results && (
               <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                 Found {results.length} recordings
               </Typography>
             )}

             {loading && <Typography>Searching...</Typography>}
             {error && <Alert severity="error">{error}</Alert>}
           </Box>
           
           {results && <ResultsTable results={results} credentials={credentials} />}
        </Box>
      )}
    </Container>
  );
}

export default App;