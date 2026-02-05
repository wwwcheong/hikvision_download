import React, { useState } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Button, Checkbox, Box, FormControlLabel
} from '@mui/material';
import { formatDate } from '../utils/dateUtils';

const formatSize = (bytes) => {
    if (!bytes) return '-';
    const mb = Math.round(parseInt(bytes, 10) / (1024 * 1024));
    return `${mb}M`;
};

const ResultsTable = ({ results, downloadState, credentials, isDownloaded }) => {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [skipDownloaded, setSkipDownloaded] = useState(true);
    const { addToQueue } = downloadState;

    // Selection Logic
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const allIds = new Set(
                results
                    .filter(r => !(skipDownloaded && isDownloaded(r, credentials)))
                    .map(r => r.playbackURI)
            );
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
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
        setSelectedIds(new Set()); // Optional: clear selection after queuing
    };
    
    const numSelected = selectedIds.size;
    const availableResults = results.filter(r => !(skipDownloaded && isDownloaded(r, credentials)));
    const rowCount = availableResults.length;
    const isSelectAllChecked = rowCount > 0 && numSelected === rowCount;
    const isSelectAllIndeterminate = numSelected > 0 && numSelected < rowCount;


    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
            {/* Batch Actions */}
            <Box sx={{ flexShrink: 0, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    disabled={selectedIds.size === 0}
                    onClick={handleDownloadSelected}
                >
                    Download Selected ({selectedIds.size})
                </Button>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={skipDownloaded}
                            onChange={(e) => setSkipDownloaded(e.target.checked)}
                        />
                    }
                    label="Skip downloaded files"
                />
            </Box>

            <TableContainer component={Paper} sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Table stickyHeader>
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
                            <TableCell>Camera</TableCell>
                            <TableCell>Start Time</TableCell>
                            <TableCell>End Time</TableCell>
                            <TableCell>Size</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {results.map((row, index) => {
                            const isRowSelected = isSelected(row.playbackURI);
                            const isRowDownloaded = isDownloaded(row, credentials);
                            return (
                                <TableRow 
                                    key={index} 
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
                                    <TableCell>{row.cameraName}</TableCell>
                                    <TableCell>{formatDate(row.startTime)}</TableCell>
                                    <TableCell>{formatDate(row.endTime)}</TableCell>
                                    <TableCell>{formatSize(row.size)}</TableCell>
                                    <TableCell>
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            disabled={isRowDownloaded && skipDownloaded}
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
