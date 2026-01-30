import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = ''; // Relative path for now, same as ResultsTable

const useDownloadQueue = (credentials) => {
    const [queue, setQueue] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentProgress, setCurrentProgress] = useState(0);
    const [currentFileName, setCurrentFileName] = useState('');
    const processingRef = useRef(false);

    const addToQueue = (items) => {
        setQueue(prev => {
            const existingIds = new Set(prev.map(i => i.playbackURI));
            const newItems = items
                .filter(item => !existingIds.has(item.playbackURI))
                .map(item => ({
                    ...item,
                    id: item.playbackURI,
                    status: 'pending',
                    error: null
                }));
            return [...prev, ...newItems];
        });
    };

    useEffect(() => {
        const processQueue = async () => {
            if (processingRef.current) return;

            const pendingIndex = queue.findIndex(item => item.status === 'pending');
            if (pendingIndex === -1) return;

            processingRef.current = true;
            setIsProcessing(true);
            setCurrentProgress(0);

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
                });

                if (res.data.success && res.data.token) {
                    const url = `${API_URL}/api/download?token=${res.data.token}`;
                    
                    // 2. Fetch Blob with Progress
                    const fileRes = await axios.get(url, { 
                        responseType: 'blob',
                        onDownloadProgress: (progressEvent) => {
                            if (progressEvent.total) {
                                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                                setCurrentProgress(percent);
                            }
                        }
                    });
                    
                    // 3. Trigger Save
                    const blobUrl = window.URL.createObjectURL(new Blob([fileRes.data]));
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.setAttribute('download', fileName);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
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
                setCurrentFileName('');
                setCurrentProgress(0);
            }
        };

        processQueue();
    }, [queue, credentials]);

    return {
        queue,
        addToQueue,
        isProcessing,
        currentProgress,
        currentFileName
    };
};

export default useDownloadQueue;