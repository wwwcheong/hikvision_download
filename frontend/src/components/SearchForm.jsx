import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { addHours, subHours, format, parseISO, isAfter, isBefore } from 'date-fns';

const SearchForm = ({ onSearch }) => {
    const [times, setTimes] = useState({
        start: '',
        end: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (!value) {
            setTimes(prev => ({ ...prev, [name]: value }));
            return;
        }

        const dateValue = parseISO(value);
        const fmt = (d) => format(d, "yyyy-MM-dd'T'HH:mm");
        
        let newTimes = { ...times, [name]: value };

        if (name === 'start') {
            if (!times.end) {
                newTimes.end = fmt(addHours(dateValue, 1));
            } else {
                const endDate = parseISO(times.end);
                if (isAfter(dateValue, endDate)) {
                    newTimes.end = fmt(addHours(dateValue, 1));
                }
            }
        } else if (name === 'end') {
            if (!times.start) {
                newTimes.start = fmt(subHours(dateValue, 1));
            } else {
                const startDate = parseISO(times.start);
                if (isBefore(dateValue, startDate)) {
                    newTimes.start = fmt(subHours(dateValue, 1));
                }
            }
        }

        setTimes(newTimes);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const fmt = (t) => t ? `${t}:00Z` : ''; 
        onSearch(fmt(times.start), fmt(times.end));
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', my: 2 }}>
            <TextField
                label="Start Time"
                type="datetime-local"
                name="start"
                value={times.start}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
            />
            <TextField
                label="End Time"
                type="datetime-local"
                name="end"
                value={times.end}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
            />
            <Button type="submit" variant="contained">Search</Button>
        </Box>
    );
};

export default SearchForm;
