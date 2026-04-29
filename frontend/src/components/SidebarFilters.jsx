import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';

const SidebarFilters = ({
    channels,
    selectedCameras,
    onCameraToggle,
    onSelectAll,
    onSelectNone,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endDate,
    setEndDate,
    endTime,
    setEndTime,
    onSearch,
    loading,
    disabled,
}) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 1.5 }}>
            {/* Time Range */}
            <Box>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 0.75,
                        px: 0.5,
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
                        }}
                    >
                        Time Range
                    </Typography>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={onSearch}
                        disabled={disabled || loading}
                        sx={{
                            fontSize: '0.8rem',
                            py: 0.75,
                            px: 1.5,
                            minWidth: 0,
                            fontWeight: 600,
                        }}
                    >
                        {loading ? '...' : 'Search'}
                    </Button>
                </Box>

                <Stack spacing={0.75}>
                    <Box>
                        <Typography
                            component="label"
                            sx={{
                                display: 'block',
                                fontSize: '0.6rem',
                                fontWeight: 500,
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                mb: 0.25,
                            }}
                        >
                            Start Date/Time
                        </Typography>
                        <Box
                            component="input"
                            type="datetime-local"
                            value={`${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}T${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`}
                            onChange={(e) => {
                                const d = new Date(e.target.value);
                                setStartDate(d);
                                setStartTime(d);
                            }}
                            disabled={disabled}
                            sx={{
                                width: '100%',
                                px: 1,
                                py: 0.6,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                fontFamily: '"Fira Code", monospace',
                                fontSize: '0.7rem',
                                backgroundColor: 'background.default',
                                color: 'text.primary',
                                outline: 'none',
                                transition: 'border-color 150ms',
                                '&:focus': { borderColor: 'primary.main' },
                                '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
                            }}
                        />
                    </Box>
                    <Box>
                        <Typography
                            component="label"
                            sx={{
                                display: 'block',
                                fontSize: '0.6rem',
                                fontWeight: 500,
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                mb: 0.25,
                            }}
                        >
                            End Date/Time
                        </Typography>
                        <Box
                            component="input"
                            type="datetime-local"
                            value={`${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`}
                            onChange={(e) => {
                                const d = new Date(e.target.value);
                                setEndDate(d);
                                setEndTime(d);
                            }}
                            disabled={disabled}
                            sx={{
                                width: '100%',
                                px: 1,
                                py: 0.6,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                fontFamily: '"Fira Code", monospace',
                                fontSize: '0.7rem',
                                backgroundColor: 'background.default',
                                color: 'text.primary',
                                outline: 'none',
                                transition: 'border-color 150ms',
                                '&:focus': { borderColor: 'primary.main' },
                                '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
                            }}
                        />
                    </Box>
                </Stack>
            </Box>

            {/* Camera Selection */}
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 0.75,
                        px: 0.5,
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
                        }}
                    >
                        Cameras
                    </Typography>
                    <Stack direction="row" spacing={0.75}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={onSelectAll}
                            disabled={disabled}
                            sx={{ flex: 1, fontSize: '0.65rem', py: 0.5, minWidth: 0, color: 'text.secondary', borderColor: 'divider' }}
                        >
                            All
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={onSelectNone}
                            disabled={disabled}
                            sx={{ flex: 1, fontSize: '0.65rem', py: 0.5, minWidth: 0, color: 'text.secondary', borderColor: 'divider' }}
                        >
                            None
                        </Button>
                    </Stack>
                </Box>

                                <Box
                    className="scroll-shadows"
                    sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        flex: 1,
                        minHeight: 0,
                        scrollbarWidth: 'normal',
                        '&::-webkit-scrollbar': { width: 12 },
                        '&::-webkit-scrollbar-track': { background: '#E2E8F0' },
                        '&::-webkit-scrollbar-thumb': {
                            background: '#94A3B8',
                            borderRadius: 6,
                            border: '2px solid #E2E8F0',
                        },
                        '&::-webkit-scrollbar-thumb:hover': { background: '#64748B' },
                    }}
                >
                    {channels.map((ch) => {
                        const isSelected = selectedCameras.some((c) => c.id === ch.id);
                        return (
                            <Box
                                key={ch.id}
                                onClick={() => !disabled && onCameraToggle(ch)}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 1.25,
                                    py: 0.6,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    cursor: disabled ? 'not-allowed' : 'pointer',
                                    opacity: disabled ? 0.5 : 1,
                                    backgroundColor: isSelected ? 'action.selected' : 'transparent',
                                    transition: 'background-color 100ms',
                                    '&:hover': {
                                        backgroundColor: disabled
                                            ? 'transparent'
                                            : isSelected
                                            ? 'action.selected'
                                            : 'action.hover',
                                    },
                                    '&:last-child': { borderBottom: 'none' },
                                }}
                            >
                                <Box
                                    component="input"
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    tabIndex={-1}
                                    sx={{
                                        mr: 1,
                                        accentColor: 'primary.main',
                                        width: 14,
                                        height: 14,
                                        cursor: 'inherit',
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontFamily: '"Fira Code", monospace',
                                        fontSize: '0.7rem',
                                        color: 'text.primary',
                                    }}
                                >
                                    {ch.name}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Box>
    );
};

export default SidebarFilters;
