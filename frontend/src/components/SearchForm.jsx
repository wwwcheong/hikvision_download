import React, { useState } from 'react';
import { Box, Button, Alert, Stack } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { isAfter, format, set } from 'date-fns';

const SearchForm = ({ 
    onSearch, 
    startDate, setStartDate, 
    startTime, setStartTime, 
    endDate, setEndDate, 
    endTime, setEndTime,
    disabled 
}) => {
    // Removed local error state

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

        // Replicate previous behavior: Format as local yyyy-MM-dd'T'HH:mm:ss + 'Z'
        const fmt = (d) => format(d, "yyyy-MM-dd'T'HH:mm:ss") + 'Z';
        
        onSearch(fmt(start), fmt(end));
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    disabled={disabled}
                />
                <TimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={(newValue) => setStartTime(newValue)}
                    ampm={false}
                    views={['hours', 'minutes']}
                    disabled={disabled}
                />
                <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    disabled={disabled}
                />
                <TimePicker
                    label="End Time"
                    value={endTime}
                    onChange={(newValue) => setEndTime(newValue)}
                    ampm={false}
                    views={['hours', 'minutes']}
                    disabled={disabled}
                />
                <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={!!error || disabled}
                    size="large"
                    sx={{ height: '56px' }}
                >
                    Search
                </Button>
            </Stack>
            {error && <Alert severity="warning">{error}</Alert>}
        </Box>
    );
};

export default SearchForm;