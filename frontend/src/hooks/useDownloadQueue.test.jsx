import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import useDownloadQueue from './useDownloadQueue';

// Mock axios
vi.mock('axios', async () => {
    const actual = await vi.importActual('axios');
    return {
        default: {
            ...actual.default,
            get: vi.fn(),
            post: vi.fn(),
            isCancel: vi.fn((err) => err && err.name === 'AbortError'),
        },
        isCancel: vi.fn((err) => err && err.name === 'AbortError'),
    };
});

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
        localStorage.clear();
        
        // Mock default axios response for token
        axios.post.mockResolvedValue({ data: { success: true, token: 'default-token' } });

        // Mock default axios.get for download
        axios.get.mockImplementation(async (url, config) => {
            if (config.onDownloadProgress) {
                config.onDownloadProgress({ loaded: 50, total: 100 });
                config.onDownloadProgress({ loaded: 100, total: 100 });
            }
            return { data: new Blob(['test content']) };
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

        await waitFor(() => {
            expect(result.current.queue).toHaveLength(1);
            expect(result.current.queue[0].playbackURI).toBe(mockItem1.playbackURI);
        });
        
        expect(['pending', 'downloading']).toContain(result.current.queue[0].status);
    });

    it('should allow duplicate items in queue', async () => {
        const { result } = renderHook(() => useDownloadQueue(credentials));
        
        act(() => {
            result.current.addToQueue([mockItem1]);
        });
        
        await waitFor(() => {
            expect(result.current.queue).toHaveLength(1);
        });

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        expect(result.current.queue).toHaveLength(2);
        expect(result.current.queue[0].id).not.toBe(result.current.queue[1].id);
    });

    it('should process queue sequentially using axios', async () => {
        axios.post.mockResolvedValue({ data: { success: true, token: 'test-token' } });

        const onDownloadSuccess = vi.fn();
        const { result } = renderHook(() => useDownloadQueue(credentials, onDownloadSuccess));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
            expect(result.current.isProcessing).toBe(true);
        });

        expect(axios.post).toHaveBeenCalled();
        
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/api/download?token=test-token'),
                expect.objectContaining({ 
                    signal: expect.any(AbortSignal),
                    responseType: 'blob'
                })
            );
        });

        await waitFor(() => {
             expect(createElementSpy).toHaveBeenCalledWith('a');
        });
        
        await waitFor(() => {
             expect(result.current.queue[0].status).toBe('completed');
             expect(result.current.isProcessing).toBe(false);
        }, { timeout: 3000 });

        expect(onDownloadSuccess).toHaveBeenCalledWith(
            expect.objectContaining({ playbackURI: mockItem1.playbackURI }),
            credentials
        );
    });

    it('should handle download errors (axios failure)', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
             const item = result.current.queue.find(i => i.playbackURI === mockItem1.playbackURI);
             expect(item.status).toBe('error');
        }, { timeout: 5000 });

        expect(result.current.queue[0].error).toBeDefined();
        // Expect 3 calls: initial + 2 retries
        expect(axios.get).toHaveBeenCalledTimes(3);
    });
    
    it('should retry download on error', async () => {
         axios.get
            .mockRejectedValueOnce(new Error('Fail 1'))
            .mockRejectedValueOnce(new Error('Fail 2'))
            .mockResolvedValue({ data: new Blob(['success']) });

        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
            expect(result.current.queue[0].status).toBe('completed');
        }, { timeout: 5000 });

        expect(axios.get).toHaveBeenCalledTimes(3);
    });

    it('should update progress via onDownloadProgress', async () => {
        let progressCallback;
        axios.get.mockImplementation(async (url, config) => {
            progressCallback = config.onDownloadProgress;
            return new Promise((resolve) => {
                // Wait a bit to simulate download
                setTimeout(() => resolve({ data: new Blob(['done']) }), 100);
            });
        });

        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
            expect(progressCallback).toBeDefined();
        });

        act(() => {
            progressCallback({ loaded: 40, total: 100 });
        });

        await waitFor(() => {
            expect(result.current.currentProgress).toBe(40);
        });

        act(() => {
            progressCallback({ loaded: 80, total: 100 });
        });

        await waitFor(() => {
            expect(result.current.currentProgress).toBe(80);
        });
    });

    it('should manually retry failed items', async () => {
        axios.get.mockRejectedValue(new Error('Network Error'));
        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
             expect(result.current.queue[0].status).toBe('error');
        }, { timeout: 4000 });

        // Fix axios.get for the manual retry
        axios.get.mockResolvedValue({ data: new Blob(['ok']) });

        act(() => {
            result.current.retryFailed();
        });

        await waitFor(() => {
            expect(result.current.queue[0].status).toBe('completed');
        });
    });

    it('should clear completed items from queue', async () => {
        const { result } = renderHook(() => useDownloadQueue(credentials));

        act(() => {
            result.current.addToQueue([mockItem1]);
        });

        await waitFor(() => {
            expect(result.current.queue[0].status).toBe('completed');
        });

        axios.get.mockRejectedValue(new Error('Network Error'));

        const mockItem2 = { ...mockItem1, playbackURI: 'rtsp://test/2' };
        
        act(() => {
            result.current.addToQueue([mockItem2]);
        });
        
        await waitFor(() => {
             const item2 = result.current.queue.find(i => i.playbackURI === mockItem2.playbackURI);
             expect(item2?.status).toBe('error');
        }, { timeout: 8000 });

        expect(result.current.queue).toHaveLength(2);
        expect(result.current.queue.find(i => i.status === 'completed')).toBeDefined();
        expect(result.current.queue.find(i => i.status === 'error')).toBeDefined();

        act(() => {
            result.current.clearCompleted();
        });

        expect(result.current.queue).toHaveLength(1);
        expect(result.current.queue[0].playbackURI).toBe(mockItem2.playbackURI);
        expect(result.current.queue[0].status).toBe('error');
    }, 10000);
});
