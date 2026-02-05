import React, { useState, useEffect } from 'react';
import { Box, Button, Alert, Stack, Snackbar } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { isAfter, format, set, differenceInDays, parseISO } from 'date-fns';

const SearchForm = ({ 
    onSearch, 
    startDate, setStartDate, 
    startTime, setStartTime, 
    endDate, setEndDate, 
    endTime, setEndTime,
    disabled 
}) => {
    // Removed local error state

    const [showResetMsg, setShowResetMsg] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('hik_search_params');
            if (saved) {
                const parsed = JSON.parse(saved);
                const savedTime = parseISO(parsed.timestamp);
                
                if (differenceInDays(new Date(), savedTime) > 7) {
                    // Stale - show notification (state is already default)
                    setShowResetMsg(true);
                    localStorage.removeItem('hik_search_params');
                } else {
                    // Load
                    setStartDate(parseISO(parsed.startDate));
                    setStartTime(parseISO(parsed.startTime));
                    setEndDate(parseISO(parsed.endDate));
                    setEndTime(parseISO(parsed.endTime));
                }
            }
        } catch (e) {
            console.error('Failed to load search params', e);
        }
    }, []); // Run once on mount

    const getCombinedDate = (dateVal, timeVal) => {
        if (!dateVal || !timeVal) return null;
        return set(dateVal, {
            hours: timeVal.getHours(),
            minutes: timeVal.getMinutes(),
            seconds: 0,
            milliseconds: 0
        });
    };

    const validate = () => {
        const start = getCombinedDate(startDate, startTime);
        const end = getCombinedDate(endDate, endTime);
        
        if (start && end && isAfter(start, end)) {
            return 'Start time cannot be after end time';
        }
        return '';
    };

    // Derived state
    const error = validate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const start = getCombinedDate(startDate, startTime);
        const end = getCombinedDate(endDate, endTime);
        
        if (error) return; // Use derived error

        // Persist
        try {
            const toSave = {
                startDate: startDate.toISOString(),
                startTime: startTime.toISOString(),
                endDate: endDate.toISOString(),
                endTime: endTime.toISOString(),
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('hik_search_params', JSON.stringify(toSave));
        } catch (e) {
            console.error('Failed to save search params', e);
        }

        // Replicate previous behavior: Format as local yyyy-MM-dd'T'HH:mm:ss + 'Z'
        const fmt = (d) => format(d, "yyyy-MM-dd'T'HH:mm:ss") + 'Z';
        
        onSearch(fmt(start), fmt(end));
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1, 
            my: 1,
            p: 1, 
            border: '1px solid #f0f0f0', 
            borderRadius: 1, 
            backgroundColor: '#fafafa' 
        }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    disabled={disabled}
                    slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                />
                <TimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={(newValue) => setStartTime(newValue)}
                    ampm={false}
                    views={['hours', 'minutes']}
                    disabled={disabled}
                    slotProps={{ textField: { size: 'small', sx: { width: 120 } } }}
                />
                <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    disabled={disabled}
                    slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                />
                <TimePicker
                    label="End Time"
                    value={endTime}
                    onChange={(newValue) => setEndTime(newValue)}
                    ampm={false}
                    views={['hours', 'minutes']}
                    disabled={disabled}
                    slotProps={{ textField: { size: 'small', sx: { width: 120 } } }}
                />
                <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={!!error || disabled}
                    size="small"
                    sx={{ height: '40px' }}
                >
                    Search
                </Button>
            </Stack>
            {error && <Alert severity="warning" sx={{ py: 0 }}>{error}</Alert>}
            <Snackbar
                open={showResetMsg}
                autoHideDuration={6000}
                onClose={() => setShowResetMsg(false)}
                message="Search filters expired and reset to default"
            />
        </Box>
    );
};

export default SearchForm;