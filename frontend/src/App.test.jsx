import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import App from './App';

vi.mock('axios');

describe('App Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderApp = () => {
    return render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <App />
      </LocalizationProvider>
    );
  };

  it('displays result count after successful search', async () => {
    // Mock connect response
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        channels: [{ id: '1', name: 'Camera 1' }]
      }
    });

    // Mock search response with 2 results
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        results: [
          { cameraName: 'Cam1', startTime: '20230101T120000Z', endTime: '20230101T130000Z', size: 1024, playbackURI: 'uri1' },
          { cameraName: 'Cam2', startTime: '20230101T120000Z', endTime: '20230101T130000Z', size: 1024, playbackURI: 'uri2' }
        ]
      }
    });

    renderApp();

    // 1. Connect
    fireEvent.change(screen.getByLabelText(/IP Address/i), { target: { value: '192.168.1.100' } });
    fireEvent.change(screen.getByLabelText(/Port/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Connect/i }));

    await waitFor(() => {
      expect(screen.getByText(/Connected to 192.168.1.100/i)).toBeInTheDocument();
    });

    // 2. Search
    // SearchForm has default values (Today).
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    // 3. Verify Count
    await waitFor(() => {
      expect(screen.getByText(/Found 2 recordings/i)).toBeInTheDocument();
    });
  });

  it('displays "Found 0 recordings" when no results found', async () => {
    // Mock connect response
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        channels: [{ id: '1', name: 'Camera 1' }]
      }
    });

    // Mock search response with 0 results
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        results: []
      }
    });

    renderApp();

    // Connect (Simplify by skipping re-typing since it's a fresh render but same flow)
    fireEvent.change(screen.getByLabelText(/IP Address/i), { target: { value: '192.168.1.100' } });
    fireEvent.change(screen.getByLabelText(/Port/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Connect/i }));

    await waitFor(() => {
      expect(screen.getByText(/Connected to 192.168.1.100/i)).toBeInTheDocument();
    });

    // Search
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    // Verify Count 0
    await waitFor(() => {
      expect(screen.getByText(/Found 0 recordings/i)).toBeInTheDocument();
    });
  });
});
