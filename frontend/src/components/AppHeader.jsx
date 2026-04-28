import React from 'react';
import { Box, Typography } from '@mui/material';

const AppHeader = () => {
    return (
        <Box
            component="header"
            sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1.5,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: 1,
                mb: 1.5,
                flexShrink: 0,
            }}
        >
            <Typography
                sx={{
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.95)',
                    letterSpacing: '0.05em',
                }}
            >
                HIKVISION NVR DOWNLOADER
            </Typography>
        </Box>
    );
};

export default AppHeader;
