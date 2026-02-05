import React, { useMemo } from 'react';
import { Box, Stack, Button, Typography, LinearProgress } from '@mui/material';

const UI_STRINGS = {
    BATCH_STATUS: 'Batch Status:',
    DOWNLOADING: 'Downloading:',
    CANCEL_ALL: 'Cancel All',
    CLEAR_COMPLETED: 'Clear Completed',
    RETRY_FAILED: 'Retry Failed',
    FAILED_DOWNLOADS: 'failed downloads',
    UNKNOWN_ERROR: 'Unknown error',
    DONE: 'done',
    FAILED: 'failed',
    REMAINING: 'remaining'
};

const DownloadQueueMonitor = ({ downloadState, onCancelAll }) => {
    const { queue, retryFailed, clearCompleted, isProcessing, currentProgress, currentFileName } = downloadState;

    // F1: Use useMemo for stats calculation to prevent redundant array iterations
    const stats = useMemo(() => {
        const pending = queue.filter(i => i.status === 'pending').length;
        const downloading = queue.filter(i => i.status === 'downloading').length;
        const completed = queue.filter(i => i.status === 'completed').length;
        const failedItems = queue.filter(i => i.status === 'error');
        const errorCount = failedItems.length;
        const total = queue.length;
        const progress = total > 0 ? ((completed + errorCount) / total) * 100 : 0;

        return {
            pending,
            downloading,
            completed,
            failedItems,
            errorCount,
            total,
            progress,
            remaining: pending + downloading
        };
    }, [queue]);

    if (stats.total === 0) {
        return null;
    }

    return (
        <Box sx={{ flexShrink: 0, mb: 2, width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Stack spacing={1}>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={onCancelAll}
                    >
                        {UI_STRINGS.CANCEL_ALL}
                    </Button>
                    {stats.completed > 0 && (
                        <Button
                            variant="outlined"
                            color="success"
                            onClick={clearCompleted}
                        >
                            {UI_STRINGS.CLEAR_COMPLETED}
                        </Button>
                    )}
                </Stack>
                
                <Stack spacing={1} sx={{ flexGrow: 1 }}>
                    <Box>
                        <Typography variant="body2" color="textSecondary">
                            {UI_STRINGS.BATCH_STATUS} {stats.completed} {UI_STRINGS.DONE}, {stats.errorCount} {UI_STRINGS.FAILED}, {stats.remaining} {UI_STRINGS.REMAINING}
                        </Typography>
                        {/* F2: Add aria-label for accessibility */}
                        <LinearProgress 
                            variant="determinate" 
                            value={stats.progress} 
                            aria-label="Overall batch progress"
                        />
                    </Box>
                    {isProcessing && currentFileName && (
                        <Box>
                            <Typography variant="caption" color="primary">
                                {UI_STRINGS.DOWNLOADING} {currentFileName} ({currentProgress}%)
                            </Typography>
                            {/* F2: Add aria-label for accessibility */}
                            <LinearProgress 
                                variant="determinate" 
                                value={currentProgress} 
                                color="secondary" 
                                aria-label={`Progress for ${currentFileName}`}
                            />
                        </Box>
                    )}
                    
                    {stats.errorCount > 0 && (
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1, p: 1, bgcolor: '#fff0f0', borderRadius: 1 }}>
                            <Typography variant="body2" color="error">
                                {stats.errorCount} {UI_STRINGS.FAILED_DOWNLOADS}
                            </Typography>
                            <Button size="small" variant="outlined" color="error" onClick={retryFailed}>
                                {UI_STRINGS.RETRY_FAILED}
                            </Button>
                            <Box sx={{ maxHeight: 60, overflowY: 'auto', width: '100%' }}>
                                {stats.failedItems.map((item, idx) => (
                                    <Typography key={idx} variant="caption" display="block" color="error">
                                        {item.cameraName}: {item.error || UI_STRINGS.UNKNOWN_ERROR}
                                    </Typography>
                                ))}
                            </Box>
                        </Stack>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
};

export default DownloadQueueMonitor;