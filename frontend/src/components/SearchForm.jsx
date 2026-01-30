import React, { useState, useEffect } from 'react';
import { Box, Button, Alert, Stack } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { startOfDay, endOfDay, isAfter, format, set } from 'date-fns';

const SearchForm = ({ onSearch }) => {
    // Defaults
    const [startDate, setStartDate] = useState(new Date());
    const [startTime, setStartTime] = useState(startOfDay(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [endTime, setEndTime] = useState(endOfDay(new Date()));
    
    const [error, setError] = useState('');

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

    useEffect(() => {
        setError(validate());
    }, [startDate, startTime, endDate, endTime]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const start = getCombinedDate(startDate, startTime);
        const end = getCombinedDate(endDate, endTime);
        
        if (validate()) return;

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
                />
                <TimePicker
                    label="Start Time"
                    value={startTime}
                    onChange={(newValue) => setStartTime(newValue)}
                    ampm={false}
                    views={['hours', 'minutes']}
                />
                <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                />
                <TimePicker
                    label="End Time"
                    value={endTime}
                    onChange={(newValue) => setEndTime(newValue)}
                    ampm={false}
                    views={['hours', 'minutes']}
                />
                <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={!!error}
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