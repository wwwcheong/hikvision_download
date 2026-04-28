import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import axios from 'axios';

const API_URL = '';

const SidebarConfig = ({ credentials, onConnect, onDisconnect }) => {
    const [formData, setFormData] = useState({
        ip: '',
        port: '8000',
        username: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('hik_connection');
            if (saved) {
                const parsed = JSON.parse(saved);
                setFormData(prev => ({
                    ...prev,
                    ip: parsed.ip || '',
                    port: parsed.port || '8000',
                    username: parsed.username || '',
                }));
            }
        } catch (e) {
            console.error('Failed to load connection details', e);
        }
    }, []);

    const handleChange = (field) => (e) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_URL}/api/connect`, formData);
            if (res.data.success) {
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

    // ── Connected state: collapsed panel ──────────────────────────────────────
    if (credentials) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                    variant="caption"
                    sx={{
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        letterSpacing: '0.5px',
                        color: 'text.secondary',
                        px: 0.5,
                    }}
                >
                    NVR Configuration
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.5,
                        py: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.default',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#22c55e',
                                animation: 'pulse 2s infinite',
                                '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                },
                            }}
                        />
                        <Typography
                            sx={{
                                fontFamily: '"Fira Code", monospace',
                                fontSize: '0.75rem',
                                color: 'text.primary',
                            }}
                        >
                            {credentials.ip}
                        </Typography>
                    </Box>

                    <Button
                        size="small"
                        onClick={onDisconnect}
                        variant="outlined"
                        sx={{
                            fontSize: '0.65rem',
                            py: 0.35,
                            px: 1,
                            minWidth: 0,
                            color: 'text.secondary',
                            borderColor: 'divider',
                            '&:hover': {
                                borderColor: 'error.main',
                                color: 'error.main',
                                backgroundColor: 'rgba(220,38,38,0.06)',
                            },
                        }}
                    >
                        Disconnect
                    </Button>
                </Box>
            </Box>
        );
    }

    // ── Disconnected state: full form ──────────────────────────────────────────
    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
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
                }}
            >
                NVR Configuration
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                    { id: 'ip-input', label: 'IP Address', field: 'ip', type: 'text', placeholder: '192.168.1.64' },
                    { id: 'port-input', label: 'Port', field: 'port', type: 'text', placeholder: '8000' },
                    { id: 'username-input', label: 'Username', field: 'username', type: 'text' },
                    { id: 'password-input', label: 'Password', field: 'password', type: 'password' },
                ].map(({ id, label, field, type, placeholder }) => (
                    <Box key={id}>
                        <Typography
                            component="label"
                            htmlFor={id}
                            sx={{
                                display: 'block',
                                fontSize: '0.65rem',
                                fontWeight: 500,
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                mb: 0.5,
                            }}
                        >
                            {label}
                        </Typography>
                        <Box
                            component="input"
                            id={id}
                            type={type}
                            value={formData[field]}
                            onChange={handleChange(field)}
                            required
                            placeholder={placeholder}
                            sx={{
                                width: '100%',
                                px: 1.25,
                                py: 0.75,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                fontFamily: '"Fira Code", monospace',
                                fontSize: '0.75rem',
                                backgroundColor: 'background.default',
                                color: 'text.primary',
                                outline: 'none',
                                transition: 'border-color 150ms',
                                '&:focus': {
                                    borderColor: 'primary.main',
                                    backgroundColor: 'background.paper',
                                },
                            }}
                        />
                    </Box>
                ))}
            </Box>

            {error && (
                <Box
                    sx={{
                        px: 1,
                        py: 0.75,
                        backgroundColor: 'error.main',
                        color: 'error.contrastText',
                        borderRadius: 1,
                        fontSize: '0.7rem',
                    }}
                    role="alert"
                >
                    {error}
                </Box>
            )}

            <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                    mt: 0.5,
                    fontFamily: '"Fira Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    py: 0.75,
                }}
            >
                {loading ? 'Connecting...' : 'Connect'}
            </Button>
        </Box>
    );
};

export default SidebarConfig;
