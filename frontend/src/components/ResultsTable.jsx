import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import axios from 'axios';

const API_URL = ''; // import.meta.env.VITE_API_URL || '';

const ResultsTable = ({ results, credentials }) => {
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

    const handleDownload = async (item) => {
        const { ip, port, username, password } = credentials;
        const fileName = `${item.cameraName.replace(/\s+/g, '_')}_${item.startTime}_${item.endTime}.mp4`.replace(/:/g, '-');
        
        try {
            const res = await axios.post(`${API_URL}/api/download-token`, {
                ip, port, username, password,
                playbackURI: item.playbackURI,
                fileName
            });
            
            if (res.data.success && res.data.token) {
                 const url = `${API_URL}/api/download?token=${res.data.token}`;
                 window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Failed to get download token:', error);
            alert('Failed to initiate download');
        }
    };

    return (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Camera</TableCell>
                        <TableCell>Start Time</TableCell>
                        <TableCell>End Time</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {results.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell>{row.cameraName}</TableCell>
                            <TableCell>{formatDate(row.startTime)}</TableCell>
                            <TableCell>{formatDate(row.endTime)}</TableCell>
                            <TableCell>{formatSize(row.size)}</TableCell>
                            <TableCell>
                                <Button variant="contained" size="small" onClick={() => handleDownload(row)}>
                                    Download
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {results.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} align="center">No recordings found</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ResultsTable;
