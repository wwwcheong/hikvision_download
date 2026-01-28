import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}/api/connect`, formData);
            if (res.data.success) {
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
        </Box>
    );
};

export default ConnectionForm;
