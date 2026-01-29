import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchForm from './SearchForm';
import { addHours, subHours, format, parseISO } from 'date-fns';

describe('SearchForm Date Auto-Selection', () => {
    const onSearch = vi.fn();

    const renderComponent = () => render(<SearchForm onSearch={onSearch} />);

    const getStartInput = () => screen.getByLabelText(/Start Time/i);
    const getEndInput = () => screen.getByLabelText(/End Time/i);

    const fmt = (date) => format(date, "yyyy-MM-dd'T'HH:mm");

    it('sets end date to 1 hour after start date when end is empty', () => {
        renderComponent();
        const startInput = getStartInput();
        const endInput = getEndInput();

        const startDate = new Date(2026, 0, 29, 10, 0); // Jan 29, 10:00
        fireEvent.change(startInput, { target: { value: fmt(startDate) } });

        expect(startInput.value).toBe(fmt(startDate));
        expect(endInput.value).toBe(fmt(addHours(startDate, 1)));
    });

    it('sets start date to 1 hour before end date when start is empty', () => {
        renderComponent();
        const startInput = getStartInput();
        const endInput = getEndInput();

        const endDate = new Date(2026, 0, 29, 12, 0); // Jan 29, 12:00
        fireEvent.change(endInput, { target: { value: fmt(endDate) } });

        expect(endInput.value).toBe(fmt(endDate));
        expect(startInput.value).toBe(fmt(subHours(endDate, 1)));
    });

    it('updates end date when start date is changed to be after end date', () => {
        renderComponent();
        const startInput = getStartInput();
        const endInput = getEndInput();

        // Initial valid state
        const initialStart = new Date(2026, 0, 29, 10, 0);
        const initialEnd = new Date(2026, 0, 29, 12, 0);
        
        fireEvent.change(startInput, { target: { value: fmt(initialStart) } });
        // Since the previous logic might auto-fill end, let's explicitly set end to what we want to test "initial state"
        fireEvent.change(endInput, { target: { value: fmt(initialEnd) } });
        
        expect(endInput.value).toBe(fmt(initialEnd));

        // Change start to after end (13:00)
        const newStart = new Date(2026, 0, 29, 13, 0);
        fireEvent.change(startInput, { target: { value: fmt(newStart) } });

        expect(startInput.value).toBe(fmt(newStart));
        expect(endInput.value).toBe(fmt(addHours(newStart, 1)));
    });

    it('updates start date when end date is changed to be before start date', () => {
        renderComponent();
        const startInput = getStartInput();
        const endInput = getEndInput();

        // Initial valid state
        const initialStart = new Date(2026, 0, 29, 10, 0);
        const initialEnd = new Date(2026, 0, 29, 12, 0);

        fireEvent.change(startInput, { target: { value: fmt(initialStart) } });
        fireEvent.change(endInput, { target: { value: fmt(initialEnd) } });

        // Change end to before start (09:00)
        const newEnd = new Date(2026, 0, 29, 9, 0);
        fireEvent.change(endInput, { target: { value: fmt(newEnd) } });

        expect(endInput.value).toBe(fmt(newEnd));
        expect(startInput.value).toBe(fmt(subHours(newEnd, 1)));
    });
});
