import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, Snackbar } from '@mui/material';
import axios from 'axios';

const ConnectionForm = ({ onConnect }) => {
    const [formData, setFormData] = useState({
        ip: '',
        port: '80',
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showRestoredMsg, setShowRestoredMsg] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('hik_connection');
            if (saved) {
                const parsed = JSON.parse(saved);
                setFormData(prev => ({
                    ...prev,
                    ip: parsed.ip || '',
                    port: parsed.port || '80',
                    username: parsed.username || ''
                }));
                setShowRestoredMsg(true);
            }
        } catch (e) {
            console.error('Failed to load connection details', e);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

const API_URL = ''; // import.meta.env.VITE_API_URL || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}/api/connect`, formData);
            if (res.data.success) {
                // Save connection details (excluding password)
                try {
                    const { password, ...toSave } = formData;
                    localStorage.setItem('hik_connection', JSON.stringify(toSave));
                } catch (e) {
                    console.error('Failed to save connection details', e);
                }

                onConnect(formData, res.data.channels);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, mx: 'auto', mt: 4, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
            <Typography variant="h6">Connect to NVR</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="IP Address" name="ip" value={formData.ip} onChange={handleChange} required fullWidth />
            <TextField label="Port" name="port" value={formData.port} onChange={handleChange} required fullWidth />
            <TextField label="Username" name="username" value={formData.username} onChange={handleChange} required fullWidth />
            <TextField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required fullWidth />
            <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Connecting...' : 'Connect'}
            </Button>
            <Snackbar
                open={showRestoredMsg}
                autoHideDuration={4000}
                onClose={() => setShowRestoredMsg(false)}
                message="Connection details restored"
            />
        </Box>
    );
};

export default ConnectionForm;
