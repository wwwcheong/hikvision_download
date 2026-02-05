import React, { useState } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Button, Checkbox, Box, FormControlLabel, Typography
} from '@mui/material';
import { formatDate } from '../utils/dateUtils';

const formatSize = (bytes) => {
    if (!bytes) return '-';
    const mb = Math.round(parseInt(bytes, 10) / (1024 * 1024));
    return `${mb}M`;
};

const ResultsTable = ({ results, totalCount, downloadState, credentials, isDownloaded }) => {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [skipDownloaded, setSkipDownloaded] = useState(true);
    const { addToQueue } = downloadState;

    // Selection Logic
    const handleSelectAll = (event) => {
        const newSelected = new Set(selectedIds);
        const visibleAvailableResults = results.filter(r => !(skipDownloaded && isDownloaded(r, credentials)));
        
        if (event.target.checked) {
            visibleAvailableResults.forEach(r => newSelected.add(r.playbackURI));
        } else {
            visibleAvailableResults.forEach(r => newSelected.delete(r.playbackURI));
        }
        setSelectedIds(newSelected);
    };

    const handleSelectRow = (playbackURI) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(playbackURI)) {
            newSelected.delete(playbackURI);
        } else {
            newSelected.add(playbackURI);
        }
        setSelectedIds(newSelected);
    };

    const isSelected = (playbackURI) => selectedIds.has(playbackURI);

    // Download Logic
    const handleDownloadSingle = (item) => {
        addToQueue([item]);
    };

    const handleDownloadSelected = () => {
        const itemsToDownload = results.filter(r => selectedIds.has(r.playbackURI));
        addToQueue(itemsToDownload);
        
        // Only clear the ones we actually queued
        const newSelected = new Set(selectedIds);
        itemsToDownload.forEach(item => newSelected.delete(item.playbackURI));
        setSelectedIds(newSelected);
    };
    
    const numSelected = Array.from(selectedIds).filter(id => results.some(r => r.playbackURI === id)).length;
    const availableResults = results.filter(r => !(skipDownloaded && isDownloaded(r, credentials)));
    const rowCount = availableResults.length;
    const isSelectAllChecked = rowCount > 0 && availableResults.every(r => selectedIds.has(r.playbackURI));
    const isSelectAllIndeterminate = !isSelectAllChecked && availableResults.some(r => selectedIds.has(r.playbackURI));


    return (
        <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
            {/* Batch Actions */}
            <Box sx={{ flexShrink: 0, mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    disabled={numSelected === 0}
                    onClick={handleDownloadSelected}
                    size="small"
                >
                    Download Selected ({numSelected})
                </Button>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={skipDownloaded}
                            onChange={(e) => setSkipDownloaded(e.target.checked)}
                            size="small"
                        />
                    }
                    label={<Typography variant="body2">Skip downloaded files</Typography>}
                />
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="caption" color="text.secondary">
                    Found {totalCount} recordings, filtered to {results.length}
                </Typography>
            </Box>

            <TableContainer component={Paper} sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    data-testid="select-all-checkbox"
                                    indeterminate={isSelectAllIndeterminate}
                                    checked={isSelectAllChecked}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell sx={{ py: 0.5 }}>Camera</TableCell>
                            <TableCell sx={{ py: 0.5 }}>Start Time</TableCell>
                            <TableCell sx={{ py: 0.5 }}>End Time</TableCell>
                            <TableCell sx={{ py: 0.5 }}>Size</TableCell>
                            <TableCell sx={{ py: 0.5 }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {results.map((row) => {
                            const isRowSelected = isSelected(row.playbackURI);
                            const isRowDownloaded = isDownloaded(row, credentials);
                            return (
                                <TableRow 
                                    key={row.playbackURI} 
                                    hover
                                    onClick={() => (!isRowDownloaded || !skipDownloaded) && handleSelectRow(row.playbackURI)}
                                    selected={isRowSelected}
                                    sx={{ 
                                        cursor: (isRowDownloaded && skipDownloaded) ? 'not-allowed' : 'pointer',
                                        ...(isRowDownloaded && skipDownloaded && {
                                            backgroundColor: (theme) => theme.palette.action.disabledBackground,
                                            color: (theme) => theme.palette.text.disabled,
                                        }),
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={isRowSelected}
                                            disabled={isRowDownloaded && skipDownloaded}
                                            onClick={(e) => e.stopPropagation()} 
                                            onChange={() => handleSelectRow(row.playbackURI)}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{row.cameraName}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{formatDate(row.startTime)}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{formatDate(row.endTime)}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>{formatSize(row.size)}</TableCell>
                                    <TableCell sx={{ py: 0.5 }}>
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            disabled={isRowDownloaded && skipDownloaded}
                                            sx={{ py: 0, minHeight: '30px' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadSingle(row);
                                            }}
                                        >
                                            {isRowDownloaded ? 'Downloaded' : 'Download'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {results.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No recordings found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ResultsTable;
