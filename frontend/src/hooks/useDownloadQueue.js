import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Helpers
const getFileName = (item) => {
    return `${item.cameraName.replace(/\s+/g, '_')}_${item.startTime}_${item.endTime}.mp4`.replace(/:/g, '-');
};

const generateId = (item) => {
    return crypto.randomUUID ? crypto.randomUUID() : `${item.playbackURI}-${Date.now()}-${Math.random()}`;
};

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
    
    // Using a trigger to "poke" the processing loop instead of watching the entire queue
    const [processTrigger, setProcessTrigger] = useState(0);
    const poke = useCallback(() => setProcessTrigger(t => t + 1), []);

    const abortControllerRef = useRef(null);
    const isMountedRef = useRef(true);
    const processingLockRef = useRef(false);

    // Persistence
    useEffect(() => {
        try {
            localStorage.setItem('hik_download_queue', JSON.stringify(queue));
        } catch (e) {
            console.error('Failed to sync queue to localStorage', e);
        }
    }, [queue]);

    // Cleanup
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            abortControllerRef.current?.abort();
        };
    }, []);

    const downloadWithRetry = async (url, fileName, onProgress, signal, attempt = 0) => {
        let blobUrl = null;
        try {
            const response = await fetch(url, { signal });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const total = parseInt(response.headers.get('Content-Length') || '0', 10);
            let loaded = 0;
            const reader = response.body.getReader();
            const chunks = [];

            while (true) {
                const { done, value } = await reader.read();
                if (value) {
                    chunks.push(value);
                    loaded += value.length;
                    if (total) onProgress(Math.round((loaded * 100) / total));
                    if (total && loaded >= total) {
                        await reader.cancel();
                        break;
                    }
                }
                if (done) break;
            }

            blobUrl = window.URL.createObjectURL(new Blob(chunks));
            const link = document.body.appendChild(document.createElement('a'));
            link.href = blobUrl;
            link.setAttribute('download', fileName);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (error) {
            if (error.name === 'AbortError' || attempt >= MAX_RETRIES) throw error;
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            return downloadWithRetry(url, fileName, onProgress, signal, attempt + 1);
        } finally {
            if (blobUrl) window.URL.revokeObjectURL(blobUrl);
        }
    };

    // Refined Processing Loop
    useEffect(() => {
        const processNext = async () => {
            if (processingLockRef.current || !credentials) return;
            
            const nextItem = queue.find(item => item.status === 'pending');
            if (!nextItem) {
                setIsProcessing(false);
                return;
            }

            processingLockRef.current = true;
            setIsProcessing(true);
            setCurrentProgress(0);

            const controller = new AbortController();
            abortControllerRef.current = controller;
            const fileName = getFileName(nextItem);
            setCurrentFileName(fileName);

            // Update status to downloading
            setQueue(prev => prev.map(qi => qi.id === nextItem.id ? { ...qi, status: 'downloading', progress: 0 } : qi));

            try {
                const { ip, port, username, password } = credentials;
                const res = await axios.post(`${API_URL}/api/download-token`, {
                    ip, port, username, password,
                    playbackURI: nextItem.playbackURI,
                    fileName
                }, { signal: controller.signal });

                if (!res.data.success || !res.data.token) throw new Error('Failed to get download token');

                let lastSyncProgress = 0;
                await downloadWithRetry(
                    `${API_URL}/api/download?token=${res.data.token}`,
                    fileName,
                    (percent) => {
                        if (!isMountedRef.current) return;
                        setCurrentProgress(percent);
                        if (percent - lastSyncProgress >= 5 || percent === 100) {
                            lastSyncProgress = percent;
                            setQueue(prev => prev.map(qi => qi.id === nextItem.id ? { ...qi, progress: percent } : qi));
                        }
                    },
                    controller.signal
                );

                if (isMountedRef.current) {
                    setQueue(prev => prev.map(qi => qi.id === nextItem.id ? { ...qi, status: 'completed', progress: 100 } : qi));
                    if (onDownloadSuccess) onDownloadSuccess(nextItem, credentials);
                }
            } catch (error) {
                if (error.name !== 'AbortError' && isMountedRef.current) {
                    setQueue(prev => prev.map(qi => qi.id === nextItem.id ? { ...qi, status: 'error', error: error.message } : qi));
                }
            } finally {
                if (isMountedRef.current) {
                    processingLockRef.current = false;
                    setCurrentFileName('');
                    setCurrentProgress(0);
                    abortControllerRef.current = null;
                    // Trigger the next loop
                    poke();
                }
            }
        };

        processNext();
    }, [credentials, processTrigger, onDownloadSuccess]); 
    // Note: queue removed from dependencies to avoid redundant re-runs. 
    // Trigger and completion handle the loop.

    const addToQueue = useCallback((items) => {
        setQueue(prev => [
            ...prev,
            ...items.map(item => ({
                ...item,
                id: generateId(item),
                status: 'pending',
                progress: 0,
                error: null
            }))
        ]);
        poke();
    }, [poke]);

    const retryFailed = useCallback(() => {
        setQueue(prev => prev.map(item => 
            item.status === 'error' ? { ...item, status: 'pending', error: null, progress: 0 } : item
        ));
        poke();
    }, [poke]);

    const clearCompleted = useCallback(() => {
        setQueue(prev => prev.filter(item => item.status !== 'completed'));
    }, []);

    const cancelAll = useCallback(() => {
        abortControllerRef.current?.abort();
        setQueue([]);
        setIsProcessing(false);
        setCurrentProgress(0);
        setCurrentFileName('');
        processingLockRef.current = false;
    }, []);

    return {
        queue, addToQueue, retryFailed, clearCompleted, cancelAll,
        isProcessing, currentProgress, currentFileName
    };
};

export default useDownloadQueue;
