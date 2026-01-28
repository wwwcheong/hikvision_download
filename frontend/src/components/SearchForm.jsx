import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

const SearchForm = ({ onSearch }) => {
    const [times, setTimes] = useState({
        start: '',
        end: ''
    });

    const handleChange = (e) => {
        setTimes({ ...times, [e.target.name]: e.target.value });
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
