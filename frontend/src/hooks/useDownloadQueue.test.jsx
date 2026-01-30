import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import useDownloadQueue from './useDownloadQueue';

// Mock axios
vi.mock('axios');

describe('useDownloadQueue', () => {
    const credentials = {
        ip: '192.168.1.100',
        port: '80',
        username: 'admin',
        password: 'password'
    };

    const mockItem1 = {
        cameraName: 'Cam 1',
        startTime: '20230101T120000Z',
        endTime: '20230101T120500Z',
        playbackURI: 'rtsp://test/1'
    };

    // Capture original once
    const originalCreateElement = document.createElement.bind(document);
    
    let createElementSpy;
    let appendChildSpy;
    let removeChildSpy;

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock default axios response
        axios.post.mockResolvedValue({ data: { success: true, token: 'default-token' } });

        createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
            if (tagName === 'a') {
                const element = originalCreateElement('a');
                element.click = vi.fn();
                return element;
            }
            return originalCreateElement(tagName);
        });

        appendChildSpy = vi.spyOn(document.body, 'appendChild'); 
        removeChildSpy = vi.spyOn(document.body, 'removeChild');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize with empty queue', () => {
        const { result } = renderHook(() => useDownloadQueue(credentials));
        expect(result.current.queue).toEqual([]);
        expect(result.current.isProcessing).toBe(false);
    });

    it('should add items to queue', async () => {
        const { result } = renderHook(() => useDownloadQueue(credentials));
        
        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        expect(result.current.queue).toHaveLength(1);
        expect(result.current.queue[0].playbackURI).toBe(mockItem1.playbackURI);
        expect(['pending', 'downloading']).toContain(result.current.queue[0].status);
    });

    it('should prevent duplicate items in queue', async () => {
        const { result } = renderHook(() => useDownloadQueue(credentials));
        
        act(() => {
            result.current.addToQueue([mockItem1]);
        });
        
        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        expect(result.current.queue).toHaveLength(1);
    });

    it('should process queue sequentially', async () => {
        axios.post.mockResolvedValue({ data: { success: true, token: 'test-token' } });

        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
            expect(result.current.isProcessing).toBe(true);
        });

        expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/download-token'), expect.objectContaining({
            playbackURI: mockItem1.playbackURI
        }));

        await waitFor(() => {
             expect(createElementSpy).toHaveBeenCalledWith('a');
        });
        
        await waitFor(() => {
             expect(result.current.queue[0].status).toBe('downloading');
        });
    });

    it('should handle download errors', async () => {
        axios.post.mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
             const item = result.current.queue.find(i => i.playbackURI === mockItem1.playbackURI);
             expect(item).toBeDefined();
             expect(item.status).toBe('error');
        });

        expect(result.current.queue[0].error).toBe('Network Error');
        expect(result.current.isProcessing).toBe(false);
    });
});