import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';
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
    const abortControllerRef = useRef(null);
    const isMountedRef = useRef(true);
    const queueRef = useRef(queue);

    // Keep queueRef in sync
    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    // Initial sync of UI state from localStorage
    useEffect(() => {
        const latestQueueStr = localStorage.getItem('hik_download_queue');
        if (latestQueueStr) {
            try {
                const q = JSON.parse(latestQueueStr);
                const downloadingItem = q.find(item => item.status === 'downloading');
                if (downloadingItem) {
                    setIsProcessing(true);
                    if (downloadingItem.progress !== undefined) {
                        setCurrentProgress(downloadingItem.progress);
                        const fileName = `${downloadingItem.cameraName.replace(/\s+/g, '_')}_${downloadingItem.startTime}_${downloadingItem.endTime}.mp4`.replace(/:/g, '-');
                        setCurrentFileName(fileName);
                    }
                }
            } catch (e) {
                console.error('Failed to sync UI state on mount', e);
            }
        }
    }, []);

    // Cross-tab synchronization
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'hik_download_queue' && e.newValue) {
                try {
                    const newQueue = JSON.parse(e.newValue);
                    setQueue(prev => {
                        // Minimal check to avoid unnecessary state updates
                        if (JSON.stringify(prev) === e.newValue) return prev;
                        
                        // Sync UI state with downloading item from another tab
                        const downloadingItem = newQueue.find(item => item.status === 'downloading');
                        if (downloadingItem) {
                            setIsProcessing(true);
                            if (downloadingItem.progress !== undefined) {
                                setCurrentProgress(downloadingItem.progress);
                                const fileName = `${downloadingItem.cameraName.replace(/\s+/g, '_')}_${downloadingItem.startTime}_${downloadingItem.endTime}.mp4`.replace(/:/g, '-');
                                setCurrentFileName(fileName);
                            }
                        } else {
                            // If we were processing but now no item is downloading in the shared queue,
                            // reset our local UI state (unless we are the leader acquiring the lock)
                            // Use a small timeout to avoid flickering during leadership handovers
                            setTimeout(() => {
                                if (!processingRef.current && isMountedRef.current) {
                                    const latestQueue = JSON.parse(localStorage.getItem('hik_download_queue') || '[]');
                                    const stillNoDownloading = !latestQueue.find(item => item.status === 'downloading');
                                    if (stillNoDownloading) {
                                        setIsProcessing(false);
                                        setCurrentProgress(0);
                                        setCurrentFileName('');
                                    }
                                }
                            }, 100);
                        }

                        return newQueue;
                    });
                } catch (err) {
                    console.error('Failed to parse queue from storage event', err);
                }
            } else if (e.key === 'hik_queue_command' && e.newValue) {
                try {
                    const command = JSON.parse(e.newValue);
                    if (command.type === 'CANCEL_ALL') {
                        if (abortControllerRef.current) {
                            abortControllerRef.current.abort();
                        }
                    }
                } catch (err) {
                    console.error('Failed to parse command from storage event', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const addToQueue = useCallback(async (items) => {
        const update = () => {
            try {
                const latestQueueStr = localStorage.getItem('hik_download_queue');
                const latestQueue = latestQueueStr ? JSON.parse(latestQueueStr) : [];

                const newItems = items.map(item => ({
                    ...item,
                    id: crypto.randomUUID ? crypto.randomUUID() : `${item.playbackURI}-${Date.now()}-${Math.random()}`,
                    status: 'pending',
                    progress: 0,
                    error: null
                }));

                const updatedQueue = [...latestQueue, ...newItems];
                setQueue(updatedQueue);
                localStorage.setItem('hik_download_queue', JSON.stringify(updatedQueue));
            } catch (e) {
                console.error('Failed to update queue in localStorage', e);
            }
        };

        if (navigator.locks) {
            await navigator.locks.request('hik_queue_edit_lock', async () => {
                update();
            });
        } else {
            update();
        }
    }, []);

    const downloadWithRetry = async (url, fileName, setProgress, signal, attempt = 0) => {
        try {
            const response = await axios.get(url, {
                signal,
                responseType: 'blob',
                onDownloadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percent);
                    }
                }
            });

            // Create Blob and save
            const blob = new Blob([response.data]);
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
            if (axios.isCancel(error) || error.name === 'AbortError') {
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

    // Track mounted state
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            // Cancel any active download on unmount
            abortControllerRef.current?.abort();
            processingRef.current = false;
        };
    }, []);

    useEffect(() => {
        const processQueue = async () => {
            if (processingRef.current) return;
            
            const pendingIndex = queueRef.current.findIndex(item => item.status === 'pending');
            if (pendingIndex === -1 || !credentials) {
                // If not processing and no pending, ensure UI reflects idle state
                if (!processingRef.current && isProcessing) {
                    setIsProcessing(false);
                }
                return;
            }

            processingRef.current = true;

            const executeProcess = async () => {
                if (!isMountedRef.current) return;

                // Re-check latest queue from localStorage inside the lock
                let currentQueue = queueRef.current;
                try {
                    const latestQueueStr = localStorage.getItem('hik_download_queue');
                    if (latestQueueStr) {
                        currentQueue = JSON.parse(latestQueueStr);
                    }
                } catch (e) {
                    console.error('Failed to parse queue in lock', e);
                }

                const itemIndex = currentQueue.findIndex(item => item.status === 'pending');
                if (itemIndex === -1 || !isMountedRef.current) return;

                const item = currentQueue[itemIndex];
                
                setIsProcessing(true);
                setCurrentProgress(0);

                // Create controller for this operation
                const controller = new AbortController();
                abortControllerRef.current = controller;
                const signal = controller.signal;

                // Update status to downloading in local state and localStorage
                const updatingQueue = currentQueue.map(qi => 
                    qi.id === item.id ? { ...qi, status: 'downloading', progress: 0 } : qi
                );
                
                try {
                    setQueue(updatingQueue);
                    localStorage.setItem('hik_download_queue', JSON.stringify(updatingQueue));
                } catch (e) {
                    console.error('Failed to sync queue status to localStorage', e);
                }

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
                        let lastSyncProgress = 0;
                        const setProgressWithSync = (percent) => {
                            if (!isMountedRef.current) return;
                            setCurrentProgress(percent);
                            
                            // Only sync to localStorage every 5% to reduce thread blocking
                            if (percent - lastSyncProgress >= 5 || percent === 100) {
                                lastSyncProgress = percent;
                                setQueue(prev => {
                                    const nextQ = prev.map(qi => qi.id === item.id ? { ...qi, progress: percent } : qi);
                                    try {
                                        localStorage.setItem('hik_download_queue', JSON.stringify(nextQ));
                                    } catch (e) {
                                        console.error('Failed to sync progress to localStorage', e);
                                    }
                                    return nextQ;
                                });
                            }
                        };

                        await downloadWithRetry(url, fileName, setProgressWithSync, signal);

                        // Mark completed and persist FIRST
                        if (isMountedRef.current) {
                            setQueue(prev => {
                                const nextQ = prev.map(qi => 
                                    qi.id === item.id ? { ...qi, status: 'completed', progress: 100 } : qi
                                );
                                try {
                                    localStorage.setItem('hik_download_queue', JSON.stringify(nextQ));
                                } catch (e) {
                                    console.error('Failed to mark completed in localStorage', e);
                                }
                                return nextQ;
                            });

                            // Then trigger callback
                            if (onDownloadSuccess) {
                                onDownloadSuccess(item, credentials);
                            }
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
                            setQueue(prev => {
                                const nextQ = prev.map(qi => 
                                    qi.id === item.id ? { ...qi, status: 'error', error: error.message } : qi
                                );
                                try {
                                    localStorage.setItem('hik_download_queue', JSON.stringify(nextQ));
                                } catch (e) {
                                    console.error('Failed to sync error status to localStorage', e);
                                }
                                return nextQ;
                            });
                        }
                    }
                } finally {
                    if (isMountedRef.current) {
                        if (abortControllerRef.current === controller) {
                            abortControllerRef.current = null;
                        }
                        setIsProcessing(false);
                        setCurrentFileName('');
                        setCurrentProgress(0);
                    }
                }
            };

            try {
                if (navigator.locks) {
                    await navigator.locks.request('hik_download_lock', executeProcess);
                } else {
                    console.warn('Web Locks API not supported - falling back to unprotected execution');
                    await executeProcess();
                }
            } catch (err) {
                console.error('Queue processing failed or lock error:', err);
            } finally {
                if (isMountedRef.current) {
                    processingRef.current = false;
                }
            }
        };

        processQueue();
    }, [credentials, queue]);

    const retryFailed = useCallback(async () => {
        const update = () => {
            setQueue(prev => {
                const nextQ = prev.map(item => 
                    item.status === 'error' 
                        ? { ...item, status: 'pending', error: null, progress: 0 }
                        : item
                );
                try {
                    localStorage.setItem('hik_download_queue', JSON.stringify(nextQ));
                } catch (e) {
                    console.error('Failed to retry failed items in localStorage', e);
                }
                return nextQ;
            });
        };

        if (navigator.locks) {
            await navigator.locks.request('hik_queue_edit_lock', async () => {
                update();
            });
        } else {
            update();
        }
    }, []);

    /**
     * Removes all items with status 'completed' from the queue.
     * Keeps 'pending', 'downloading', and 'error' items.
     */
    const clearCompleted = useCallback(async () => {
        const update = () => {
            setQueue(prev => {
                const nextQ = prev.filter(item => item.status !== 'completed');
                try {
                    localStorage.setItem('hik_download_queue', JSON.stringify(nextQ));
                } catch (e) {
                    console.error('Failed to clear completed in localStorage', e);
                }
                return nextQ;
            });
        };

        if (navigator.locks) {
            await navigator.locks.request('hik_queue_edit_lock', async () => {
                update();
            });
        } else {
            update();
        }
    }, []);

    const cancelAll = useCallback(async () => {
        const update = () => {
            // 1. Signal other tabs to abort
            try {
                localStorage.setItem('hik_queue_command', JSON.stringify({ type: 'CANCEL_ALL', timestamp: Date.now() }));
            } catch (e) {
                console.error('Failed to send cancel command to localStorage', e);
            }

            // 2. Abort active request locally
            abortControllerRef.current?.abort();
            abortControllerRef.current = null;

            // 3. Clear state and localStorage
            const emptyQueue = [];
            setQueue(emptyQueue);
            try {
                localStorage.setItem('hik_download_queue', JSON.stringify(emptyQueue));
            } catch (e) {
                console.error('Failed to clear queue in localStorage', e);
            }
            
            setIsProcessing(false);
            setCurrentProgress(0);
            setCurrentFileName('');
            processingRef.current = false;
        };

        if (navigator.locks) {
            await navigator.locks.request('hik_queue_edit_lock', async () => {
                update();
            });
        } else {
            update();
        }
    }, []);


    return {
        queue,
        addToQueue,
        retryFailed,
        clearCompleted,
        cancelAll,
        isProcessing,
        currentProgress,
        currentFileName
    };
};

export default useDownloadQueue;
