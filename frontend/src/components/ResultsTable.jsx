import React, { useState } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Paper, Button, Checkbox, Box
} from '@mui/material';

const formatDate = (raw) => {
    if (!raw || raw.length < 15) return raw;
    const y = raw.substring(0, 4);
    const m = raw.substring(4, 6);
    const d = raw.substring(6, 8);
    const h = raw.substring(9, 11);
    const min = raw.substring(11, 13);
    const s = raw.substring(13, 15);
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

const formatSize = (bytes) => {
    if (!bytes) return '-';
    const mb = Math.round(parseInt(bytes, 10) / (1024 * 1024));
    return `${mb}M`;
};

const ResultsTable = ({ results, downloadState }) => {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const { addToQueue } = downloadState;

    // Selection Logic
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const allIds = new Set(results.map(r => r.playbackURI));
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

    return (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>
            {/* Batch Actions */}
            <Box sx={{ flexShrink: 0, mb: 2 }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    // Fix F1: Don't disable while processing, allow queuing more
                    disabled={selectedIds.size === 0}
                    onClick={handleDownloadSelected}
                >
                    Download Selected ({selectedIds.size})
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={selectedIds.size > 0 && selectedIds.size < results.length}
                                    checked={results.length > 0 && selectedIds.size === results.length}
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
                            return (
                                <TableRow 
                                    key={index} 
                                    hover 
                                    onClick={() => handleSelectRow(row.playbackURI)}
                                    selected={isRowSelected}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={isRowSelected}
                                            onClick={(e) => e.stopPropagation()} // Handle via row click, but safeguard
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownloadSingle(row);
                                            }}
                                        >
                                            Download
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
