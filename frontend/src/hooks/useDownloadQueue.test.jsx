import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import useDownloadQueue from './useDownloadQueue';

// Mock axios for token generation
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
    let fetchSpy;

    // Helper to create a stream that yields specific chunks
    const createMockStream = (chunks, contentLength = null, errorAtChunkIndex = -1) => {
        const encoder = new TextEncoder();
        let index = 0;
        
        return new ReadableStream({
            start(controller) {
                // optional
            },
            async pull(controller) {
                if (errorAtChunkIndex !== -1 && index === errorAtChunkIndex) {
                    controller.error(new Error('Stream Error'));
                    return;
                }
                
                if (index >= chunks.length) {
                    controller.close();
                    return;
                }
                
                const chunk = chunks[index];
                controller.enqueue(encoder.encode(chunk));
                index++;
            },
            cancel() {
                // cleanup
            }
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear(); // CRITICAL: Clear persisted state between tests
        // Mock default axios response for token
        axios.post.mockResolvedValue({ data: { success: true, token: 'default-token' } });

        // Mock fetch
        fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url) => {
             // Return a simple stream by default
             const stream = createMockStream(['test', ' ', 'content']);
             return {
                 ok: true,
                 headers: {
                     get: (key) => key === 'Content-Length' ? '12' : null // 'test content' length is 12
                 },
                 body: stream
             };
        });

        // Mock URL.createObjectURL and revokeObjectURL
        global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test-blob');
        global.URL.revokeObjectURL = vi.fn();

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
        expect(result.current.currentProgress).toBe(0);
        expect(result.current.currentFileName).toBe('');
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

    it('should process queue sequentially using fetch', async () => {
        axios.post.mockResolvedValue({ data: { success: true, token: 'test-token' } });

        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
            expect(result.current.isProcessing).toBe(true);
        });

        expect(axios.post).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(
                expect.stringContaining('/api/download?token=test-token'),
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
        });

        await waitFor(() => {
             expect(createElementSpy).toHaveBeenCalledWith('a');
        });
        
        await waitFor(() => {
             expect(result.current.queue[0].status).toBe('completed');
             expect(result.current.isProcessing).toBe(false);
        }, { timeout: 3000 });
    });

    it('should handle download errors (fetch failure)', async () => {
        // Mock fetch failure
        fetchSpy.mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
             const item = result.current.queue.find(i => i.playbackURI === mockItem1.playbackURI);
             expect(item.status).toBe('error');
        }, { timeout: 5000 }); // Increase timeout for retries (1s + 1s + processing)

        expect(result.current.queue[0].error).toBeDefined();
        // Expect 3 calls: initial + 2 retries
        expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
    
    it('should retry download on stream error', async () => {
         // 1st call fails, 2nd call fails, 3rd call succeeds.
         fetchSpy
            .mockRejectedValueOnce(new Error('Fail 1'))
            .mockRejectedValueOnce(new Error('Fail 2'))
            .mockResolvedValue({
                 ok: true,
                 headers: { get: () => '12' },
                 body: createMockStream(['success']) // 'success' is 7 chars, but logic should handle it
            });

        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
            expect(result.current.queue[0].status).toBe('completed');
        }, { timeout: 5000 });

        expect(fetchSpy).toHaveBeenCalledTimes(3);
    });

    it('should force close stream when content-length is reached', async () => {
        // Mock a stream that keeps sending data BUT we only want 5 bytes
        let cancelled = false;
        const encoder = new TextEncoder();
        
        const infiniteStream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode('12345'));
            },
            pull(controller) {
                if (cancelled) return;
                 // Keep sending data if not cancelled
                 controller.enqueue(encoder.encode('67890'));
            },
            cancel() {
                cancelled = true;
            }
        });
        
        fetchSpy.mockResolvedValue({
            ok: true,
            headers: { get: () => '5' }, // Only expect 5 bytes
            body: infiniteStream
        });

        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });
        
        await waitFor(() => {
            expect(result.current.queue[0].status).toBe('completed');
        });
        
        expect(cancelled).toBe(true);
    });

    it('should manually retry failed items', async () => {
        // 1. Fail first
        fetchSpy.mockRejectedValue(new Error('Network Error'));
        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
             expect(result.current.queue[0].status).toBe('error');
        }, { timeout: 4000 });

        // 2. Retry
        act(() => {
            result.current.retryFailed();
        });

        // It might be pending or immediately picked up as downloading
        expect(['pending', 'downloading']).toContain(result.current.queue[0].status);
        expect(result.current.queue[0].error).toBeNull();
    });
});