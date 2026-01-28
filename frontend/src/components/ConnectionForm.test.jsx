import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConnectionForm from '../components/ConnectionForm';
import React from 'react';

// Mock axios
vi.mock('axios', () => ({
    default: {
        post: vi.fn()
    }
}));

describe('ConnectionForm', () => {
    it('renders all fields', () => {
        render(<ConnectionForm onConnect={() => {}} />);
        
        expect(screen.getByLabelText(/IP Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Port/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Connect/i })).toBeInTheDocument();
    });
});
