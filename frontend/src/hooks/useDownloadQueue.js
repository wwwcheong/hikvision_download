import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API_URL = ''; // Relative path for now
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

const useDownloadQueue = (credentials, onDownloadSuccess) => {
    const [queue, setQueue] = useState(() => {
        try {
            const saved = localStorage.getItem('hik_download_queue');
            if (saved) {
                const parsed = JSON.parse(saved);
                return parsed.map(item => 
                    item.status === 'downloading' ? { ...item, status: 'pending' } : item
                );
            }
        } catch (e) {
            console.error('Failed to load queue from localStorage', e);
        }
        return [];
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [currentFileName, setCurrentFileName] = useState('');
    const processingRef = useRef(false);

    // Persist queue to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('hik_download_queue', JSON.stringify(queue));
        } catch (e) {
            console.error('Failed to save queue to localStorage', e);
        }
    }, [queue]);

    const addToQueue = (items) => {
        setQueue(prev => {
            const newItems = items.map(item => ({
                ...item,
                id: crypto.randomUUID ? crypto.randomUUID() : `${item.playbackURI}-${Date.now()}-${Math.random()}`,
                status: 'pending',
                error: null
            }));
            return [...prev, ...newItems];
        });
    };

    const downloadWithRetry = async (url, fileName, setProgress, signal, attempt = 0) => {
        try {
            const response = await fetch(url, { signal });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentLength = response.headers.get('Content-Length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            let loaded = 0;

            const reader = response.body.getReader();
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();

                if (value) {
                    chunks.push(value);
                    loaded += value.length;

                    if (total) {
                        const percent = Math.round((loaded * 100) / total);
                        setProgress(percent);
                        
                        // Force close if we have received enough data
                        if (loaded >= total) {
                            await reader.cancel();
                            break;
                        }
                    }
                }
                
                if (done) break;
            }

            // Create Blob and save
            const blob = new Blob(chunks);
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            return true;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw error; // Don't retry if aborted
            }

            console.warn(`Download attempt ${attempt + 1} failed:`, error);
            
            if (attempt < MAX_RETRIES) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                return downloadWithRetry(url, fileName, setProgress, signal, attempt + 1);
            }
            throw error;
        }
    };

    const abortControllerRef = useRef(null);
    const isMountedRef = useRef(true);

    // Track mounted state
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            // Cancel any active download on unmount
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            processingRef.current = false;
        };
    }, []);

    useEffect(() => {
        const processQueue = async () => {
            if (processingRef.current) return;
            if (!credentials) return;

            const pendingIndex = queue.findIndex(item => item.status === 'pending');
            if (pendingIndex === -1) return;

            processingRef.current = true;
            setIsProcessing(true);
            setCurrentProgress(0);

            // Create controller for this operation
            const controller = new AbortController();
            abortControllerRef.current = controller;
            const signal = controller.signal;

            const item = queue[pendingIndex];

            // Update status to downloading
            setQueue(prev => prev.map((qItem, idx) => 
                idx === pendingIndex ? { ...qItem, status: 'downloading' } : qItem
            ));

            try {
                const { ip, port, username, password } = credentials;
                const fileName = `${item.cameraName.replace(/\s+/g, '_')}_${item.startTime}_${item.endTime}.mp4`.replace(/:/g, '-');
                setCurrentFileName(fileName);

                // 1. Get Token
                const res = await axios.post(`${API_URL}/api/download-token`, {
                    ip, port, username, password,
                    playbackURI: item.playbackURI,
                    fileName
                }, { signal });

                if (res.data.success && res.data.token) {
                    const url = `${API_URL}/api/download?token=${res.data.token}`;
                    
                    // 2. Fetch with Retry and Streaming
                    await downloadWithRetry(url, fileName, setCurrentProgress, signal);

                    // Mark as downloaded
                    if (onDownloadSuccess) {
                        onDownloadSuccess(item, credentials);
                    }

                    // Mark completed
                    if (isMountedRef.current) {
                        setQueue(prev => prev.map((qItem, idx) => 
                            idx === pendingIndex ? { ...qItem, status: 'completed' } : qItem
                        ));
                    }
                } else {
                    throw new Error('Failed to get token');
                }
            } catch (error) {
                if (error.name === 'CanceledError' || error.name === 'AbortError') {
                    console.log('Download aborted');
                } else {
                    console.error('Download error:', error);
                    if (isMountedRef.current) {
                        setQueue(prev => prev.map((qItem, idx) => 
                            idx === pendingIndex ? { ...qItem, status: 'error', error: error.message } : qItem
                        ));
                    }
                }
            } finally {
                // Only clean up if we are still mounted and this is still the active controller
                if (isMountedRef.current) {
                    if (abortControllerRef.current === controller) {
                        abortControllerRef.current = null;
                    }
                    processingRef.current = false;
                    setIsProcessing(false);
                    setCurrentFileName('');
                    setCurrentProgress(0);
                }
            }
        };

        processQueue();
    }, [queue, credentials]);

    const retryFailed = useCallback(() => {
        setQueue(prev => prev.map(item => 
            item.status === 'error' 
                ? { ...item, status: 'pending', error: null }
                : item
        ));
    }, []);

    const cancelAll = useCallback(() => {
        // 1. Abort active request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // 2. Clear state
        setQueue([]);
        setIsProcessing(false);
        setCurrentProgress(0);
        setCurrentFileName('');
        processingRef.current = false;
    }, []);

    return {
        queue,
        addToQueue,
        retryFailed,
        cancelAll,
        isProcessing,
        currentProgress,
        currentFileName
    };
};

export default useDownloadQueue;
