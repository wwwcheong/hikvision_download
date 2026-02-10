import React, { useState, useEffect, useRef } from 'react';
import { Container, Box, Typography, Alert, Button, CircularProgress } from '@mui/material';

const HANDSHAKE_TIMEOUT = 1000;
const CHANNEL_NAME = 'hik_tab_guard';

const generateInstanceId = () => {
  const array = new Uint32Array(2);
  window.crypto.getRandomValues(array);
  return `${array[0].toString(36)}-${array[1].toString(36)}`;
};

const MultiTabGuard = ({ children }) => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'active' | 'blocked'
  const instanceIdRef = useRef(generateInstanceId());
  const statusRef = useRef('checking');

  useEffect(() => {
    statusRef.current = status;
    console.debug(`[MultiTabGuard] Status changed: ${status} (${instanceIdRef.current})`);
  }, [status]);

  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch (err) {
      console.error('[MultiTabGuard] Failed to initialize BroadcastChannel:', err);
      setStatus('active'); // Fallback to active if channel fails
      return;
    }

    const handleMessage = (event) => {
      const data = event.data;
      const currentStatus = statusRef.current;

      if (data.type === 'HEARTBEAT_QUERY') {
        if (currentStatus === 'active') {
          console.debug(`[MultiTabGuard] Responding to QUERY from ${data.instanceId}`);
          channel.postMessage({ type: 'HEARTBEAT_ACK' });
        } else if (currentStatus === 'checking') {
          if (data.instanceId > instanceIdRef.current) {
            console.debug(`[MultiTabGuard] Simultaneous load detected. Yielding to ${data.instanceId}`);
            setStatus('blocked');
          }
        }
      } 
      else if (data.type === 'HEARTBEAT_ACK') {
        if (currentStatus === 'checking') {
          console.debug('[MultiTabGuard] Received ACK from existing leader. Blocking.');
          setStatus('blocked');
        }
      }
    };

    channel.onmessage = handleMessage;
    
    try {
      channel.postMessage({ 
        type: 'HEARTBEAT_QUERY', 
        instanceId: instanceIdRef.current 
      });
    } catch (err) {
      console.error('[MultiTabGuard] Failed to post initial query:', err);
    }

    const timeoutId = setTimeout(() => {
      if (statusRef.current === 'checking') {
        console.debug('[MultiTabGuard] Handshake timeout reached. Becoming leader.');
        setStatus('active');
      }
    }, HANDSHAKE_TIMEOUT);

    return () => {
      channel.close();
      clearTimeout(timeoutId);
    };
  }, []);

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