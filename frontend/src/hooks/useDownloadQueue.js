import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = ''; // Relative path for now, same as ResultsTable

const useDownloadQueue = (credentials) => {
    const [queue, setQueue] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const processingRef = useRef(false); // Ref to track processing state instantly without re-renders affecting logic loop

    const addToQueue = (items) => {
        setQueue(prev => {
            const existingIds = new Set(prev.map(i => i.playbackURI));
            const newItems = items
                .filter(item => !existingIds.has(item.playbackURI))
                .map(item => ({
                    ...item,
                    id: item.playbackURI, // Unique ID
                    status: 'pending', // pending, downloading, completed, error
                    error: null
                }));
            return [...prev, ...newItems];
        });
    };

    const processNext = async () => {
        if (processingRef.current) return;

        // Find next pending item
        // We use a functional update to get the latest queue state, 
        // but we need to identify the item *outside* the setter to perform async ops.
        // So we rely on the `queue` dependency in useEffect, which might be tricky if queue updates frequently.
        // Better approach: use a ref for the queue or just select from current state if valid.
        
        // However, standard effect pattern:
        // useEffect(() => { if (!isProcessing && hasPending) processNext(); }, [queue, isProcessing]);
    };

    useEffect(() => {
        const processQueue = async () => {
            if (processingRef.current) return;

            const pendingIndex = queue.findIndex(item => item.status === 'pending');
            if (pendingIndex === -1) return;

            processingRef.current = true;
            setIsProcessing(true);

            const item = queue[pendingIndex];

            // Update status to downloading
            setQueue(prev => prev.map((qItem, idx) => 
                idx === pendingIndex ? { ...qItem, status: 'downloading' } : qItem
            ));

            try {
                // 1. Get Token
                const { ip, port, username, password } = credentials;
                const fileName = `${item.cameraName.replace(/\s+/g, '_')}_${item.startTime}_${item.endTime}.mp4`.replace(/:/g, '-');
                
                const res = await axios.post(`${API_URL}/api/download-token`, {
                    ip, port, username, password,
                    playbackURI: item.playbackURI,
                    fileName
                });

                if (res.data.success && res.data.token) {
                    const url = `${API_URL}/api/download?token=${res.data.token}`;
                    
                    // 2. Fetch Blob via Axios to wait for download completion
                    const fileRes = await axios.get(url, { responseType: 'blob' });
                    
                    // 3. Trigger Save
                    const blobUrl = window.URL.createObjectURL(new Blob([fileRes.data]));
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.setAttribute('download', fileName);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Clean up URL object to free memory
                    window.URL.revokeObjectURL(blobUrl);

                    // Mark completed
                    setQueue(prev => prev.map((qItem, idx) => 
                        idx === pendingIndex ? { ...qItem, status: 'completed' } : qItem
                    ));
                } else {
                    throw new Error('Failed to get token');
                }
            } catch (error) {
                console.error('Download error:', error);
                setQueue(prev => prev.map((qItem, idx) => 
                    idx === pendingIndex ? { ...qItem, status: 'error', error: error.message } : qItem
                ));
            } finally {
                processingRef.current = false;
                setIsProcessing(false);
                // The effect will run again because `queue` changed (status update) and trigger the next one.
            }
        };

        processQueue();
    }, [queue, credentials]);

    return {
        queue,
        addToQueue,
        isProcessing
    };
};

export default useDownloadQueue;
