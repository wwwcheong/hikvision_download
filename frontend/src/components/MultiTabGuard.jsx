import React, { useState, useEffect, useRef } from 'react';
import { Container, Box, Typography, Alert, Button, CircularProgress } from '@mui/material';

const HANDSHAKE_TIMEOUT = 1000; // Increased from 500ms
const HEARTBEAT_INTERVAL = 2000; // Periodically check if we can become active
const CHANNEL_NAME = 'hik_tab_guard';

const MultiTabGuard = ({ children }) => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'active' | 'blocked'
  const channelRef = useRef(null);
  const timeoutIdRef = useRef(null);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    const handleMessage = (event) => {
      if (event.data === 'HEARTBEAT_QUERY') {
        if (status === 'active') {
          channel.postMessage('HEARTBEAT_ACK');
        }
      } else if (event.data === 'HEARTBEAT_ACK') {
        if (status === 'checking' || status === 'active') {
           // If we receive an ACK while checking, we block.
           // If we receive an ACK while active, it means another tab just became active (race), 
           // we should probably stay active or block. 
           // Handshake protocol says first one wins.
           if (status === 'checking') {
             if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
             setStatus('blocked');
           }
        }
      }
    };

    channel.onmessage = handleMessage;
    
    // Initial check
    channel.postMessage('HEARTBEAT_QUERY');
    timeoutIdRef.current = setTimeout(() => {
      setStatus(prev => prev === 'checking' ? 'active' : prev);
    }, HANDSHAKE_TIMEOUT);

    // Periodic check to see if we can unblock
    const intervalId = setInterval(() => {
      if (status === 'blocked') {
        channel.postMessage('HEARTBEAT_QUERY');
        // If no one ACKs within 1s, we'll try to become active next time or on refresh
        // For simplicity and safety (AC3), we rely on refresh or periodic re-query.
        // Let's implement a "silent" check that can auto-unblock.
        let silentCheckTimeout = setTimeout(() => {
            setStatus('active');
        }, HANDSHAKE_TIMEOUT);
        
        const tempHandler = (e) => {
            if (e.data === 'HEARTBEAT_ACK') {
                clearTimeout(silentCheckTimeout);
                channel.removeEventListener('message', tempHandler);
            }
        };
        channel.addEventListener('message', tempHandler);
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      channel.close();
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      clearInterval(intervalId);
    };
  }, [status]);

  if (status === 'checking') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 10, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Checking for other active tabs...</Typography>
        </Box>
      </Container>
    );
  }

  if (status === 'blocked') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 10 }}>
          <Alert severity="warning" variant="filled">
            <Typography variant="h6" gutterBottom>
              Already Open
            </Typography>
            <Typography>
              Hikvision Downloader is already open in another tab. Please use the existing tab or close it and refresh this one.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </Box>
          </Alert>
        </Box>
      </Container>
    );
  }

  return children;
};

export default MultiTabGuard;