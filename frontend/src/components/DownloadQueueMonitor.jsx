import React, { useMemo } from 'react';
import { Box, Button, Typography } from '@mui/material';

const UI_STRINGS = {
    DOWNLOAD: 'Download',
    CLEAR_DONE: 'Clear Done',
    CANCEL_ALL: 'Cancel All',
    NO_DOWNLOAD: 'No active download'
};

const DustBloomIcon = ({ size = 18 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <polyline points="9 13 11 15 15 11" />
    </svg>
);

const CircularProgress = ({ value = 0, size = 48, strokeWidth = 4 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - value / 100);
    const center = size / 2;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth={strokeWidth}
            />
            <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#1976d2"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${center} ${center})`}
                strokeLinecap="round"
            />
            <text
                x={center}
                y={center}
                textAnchor="middle"
                dy="0.35em"
                fontSize={size * 0.25}
                fontWeight="bold"
                fill="#333"
            >
                {Math.round(value)}%
            </text>
        </svg>
    );
};

const CancelButton = ({ onClick, disabled }) => {
    const buttonSize = 40;

    return (
        <Button
            variant="outlined"
            onClick={onClick}
            disabled={disabled}
            sx={{
                minWidth: `${buttonSize}px`,
                width: `${buttonSize}px`,
                height: `${buttonSize}px`,
                padding: 0,
                borderColor: 'grey.400',
                color: 'grey.600',
                '&:hover': {
                    borderColor: 'error.main',
                    color: 'error.main',
                    backgroundColor: 'rgba(244, 67, 54, 0.08)'
                },
                '&.Mui-disabled': {
                    borderColor: 'grey.300',
                    color: 'grey.300'
                }
            }}
        >
            <svg width="18" height="18" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
        </Button>
    );
};

const DownloadQueueMonitor = ({ downloadState, onCancelAll }) => {
    const {
        queue,
        clearCompleted,
        cancelCurrent,
        isProcessing,
        currentProgress,
        currentFileName
    } = downloadState;

    const stats = useMemo(() => {
        const pending = queue.filter(i => i.status === 'pending').length;
        const downloading = queue.filter(i => i.status === 'downloading').length;
        const completed = queue.filter(i => i.status === 'completed').length;
        const failedItems = queue.filter(i => i.status === 'error');
        const errorCount = failedItems.length;
        const total = queue.length;

        return {
            pending,
            downloading,
            completed,
            failedItems,
            errorCount,
            total,
            remaining: pending + downloading
        };
    }, [queue]);

    const batchStatusText = stats.errorCount > 0
        ? `Done: ${stats.completed}/${stats.total}, Fail: ${stats.errorCount}`
        : `Done: ${stats.completed}/${stats.total}`;

    return (
        <Box
            sx={{
                flexShrink: 0,
                width: '100%',
                overflow: 'hidden'
            }}
        >
            <Typography
                variant="caption"
                sx={{
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    letterSpacing: '0.5px',
                    color: 'text.secondary',
                    px: 0.5,
                    mb: 0.5
                }}
            >
                {UI_STRINGS.DOWNLOAD}
            </Typography>

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap'
                }}
            >
                {/* LEFT: Clear Done */}
                <Button
                    variant="outlined"
                    color="success"
                    onClick={clearCompleted}
                    disabled={stats.completed === 0}
                    sx={{
                        minWidth: '40px',
                        width: '40px',
                        height: '40px',
                        padding: 0,
                        borderColor: 'success.main',
                        color: 'success.main',
                        '&:hover': {
                            borderColor: 'success.dark',
                            color: 'success.dark',
                            backgroundColor: 'rgba(76, 175, 80, 0.08)'
                        },
                        '&.Mui-disabled': {
                            borderColor: 'grey.300',
                            color: 'grey.300'
                        }
                    }}
                >
                    <DustBloomIcon size={20} />
                </Button>

                {/* Batch status */}
                <Typography
                    variant="body2"
                    color="textPrimary"
                    sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}
                >
                    {batchStatusText}
                </Typography>

                {/* CENTER: Current download filename (takes remaining space) */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {isProcessing && currentFileName ? (
                        <Typography
                            variant="body2"
                            color="primary"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: 500
                            }}
                        >
                            {currentFileName}
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="textSecondary">
                            {UI_STRINGS.NO_DOWNLOAD}
                        </Typography>
                    )}
                </Box>

                {/* RIGHT: Progress and actions */}
                {isProcessing && currentFileName && (
                    <>
                        <CircularProgress value={currentProgress} />
                        <CancelButton onClick={cancelCurrent} disabled={!isProcessing} />
                    </>
                )}
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={onCancelAll}
                    disabled={!isProcessing}
                    sx={{
                        height: '40px',
                        minWidth: '40px',
                        padding: '0 12px'
                    }}
                >
                    {UI_STRINGS.CANCEL_ALL}
                </Button>
            </Box>
        </Box>
    );
};

export default DownloadQueueMonitor;
