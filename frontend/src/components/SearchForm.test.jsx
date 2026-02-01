import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchForm from './SearchForm';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import * as dateFns from 'date-fns';

// Mock date-fns to easily trigger validation
vi.mock('date-fns', async () => {
    const actual = await vi.importActual('date-fns');
    return {
        ...actual,
        isAfter: vi.fn(),
    };
});

describe('SearchForm', () => {
    const onSearch = vi.fn();

    const renderComponent = (props = {}) => {
        const defaultProps = {
            onSearch,
            startDate: new Date(),
            setStartDate: vi.fn(),
            startTime: new Date(),
            setStartTime: vi.fn(),
            endDate: new Date(),
            setEndDate: vi.fn(),
            endTime: new Date(),
            setEndTime: vi.fn(),
            disabled: false,
            ...props
        };

        return render(
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <SearchForm {...defaultProps} />
            </LocalizationProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Default behavior for isAfter (start is NOT after end)
        vi.mocked(dateFns.isAfter).mockReturnValue(false);
    });

    it('renders all date/time inputs', () => {
        renderComponent();
        expect(screen.getAllByLabelText(/Start Date/i).length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText(/Start Time/i).length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText(/End Date/i).length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText(/End Time/i).length).toBeGreaterThan(0);
    });

    it('calls onSearch with formatted dates when Search is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /Search/i }));
        
        expect(onSearch).toHaveBeenCalled();
        const args = onSearch.mock.calls[0];
        expect(typeof args[0]).toBe('string');
        expect(typeof args[1]).toBe('string');
        expect(args[0]).toContain('Z');
    });

    it('disables Search button and shows warning if isAfter returns true', async () => {
        // Force isAfter to return true (Start > End)
        vi.mocked(dateFns.isAfter).mockReturnValue(true);
        
        renderComponent();

        // The validation runs on render, so the error should be there
        expect(screen.getByText(/Start time cannot be after end time/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Search/i })).toBeDisabled();
    });
});
