import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DownloadQueueMonitor from './DownloadQueueMonitor';

describe('DownloadQueueMonitor', () => {
    const mockOnCancelAll = vi.fn();

    const baseState = {
        queue: [],
        addToQueue: vi.fn(),
        clearCompleted: vi.fn(),
        isProcessing: false,
        currentProgress: 0,
        currentFileName: '',
        cancelAll: vi.fn()
    };

    it('renders when queue is empty', () => {
        render(
            <DownloadQueueMonitor
                downloadState={{ ...baseState, queue: [] }}
                onCancelAll={mockOnCancelAll}
            />
        );
        expect(screen.getByText('0/0')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Clear Done/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Cancel All/i })).toBeDisabled();
        expect(screen.getByText('No active download')).toBeInTheDocument();
    });

    it('renders batch status with mixed queue', () => {
        const state = {
            ...baseState,
            queue: [
                { status: 'completed', id: 1 },
                { status: 'completed', id: 2 },
                { status: 'error', id: 3, cameraName: 'Cam1', error: 'Network Error' },
                { status: 'pending', id: 4 }
            ]
        };
        render(<DownloadQueueMonitor downloadState={state} onCancelAll={mockOnCancelAll} />);

        expect(screen.getByText('2/4, 1 failed')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Clear Done/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: /Cancel All/i })).toBeDisabled();
    });

    it('renders active download progress with circular progress', () => {
        const state = {
            ...baseState,
            queue: [{ status: 'downloading', id: 1 }],
            isProcessing: true,
            currentFileName: 'video.mp4',
            currentProgress: 45
        };
        render(<DownloadQueueMonitor downloadState={state} onCancelAll={mockOnCancelAll} />);

        expect(screen.getByText('video.mp4')).toBeInTheDocument();
        expect(screen.getByText('45%')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel All/i })).toBeEnabled();
    });

    it('renders 9/10, 1 failed batch status', () => {
        const state = {
            ...baseState,
            queue: [
                ...Array.from({ length: 9 }, (_, i) => ({ status: 'completed', id: i })),
                { status: 'error', id: 9, cameraName: 'Cam1', error: 'Failed' }
            ]
        };

        render(<DownloadQueueMonitor downloadState={state} onCancelAll={mockOnCancelAll} />);

        expect(screen.getByText('9/10, 1 failed')).toBeInTheDocument();
    });

    it('calls onCancelAll when Cancel All is clicked during processing', () => {
        const state = {
            ...baseState,
            queue: [{ status: 'downloading', id: 1 }],
            isProcessing: true,
            currentFileName: 'video.mp4',
            currentProgress: 45
        };
        render(<DownloadQueueMonitor downloadState={state} onCancelAll={mockOnCancelAll} />);

        fireEvent.click(screen.getByRole('button', { name: /Cancel All/i }));
        expect(mockOnCancelAll).toHaveBeenCalled();
    });

    it('calls clearCompleted when Clear Done is clicked', () => {
        const clearCompleted = vi.fn();
        const state = {
            ...baseState,
            queue: [{ status: 'completed', id: 1 }],
            clearCompleted
        };
        render(<DownloadQueueMonitor downloadState={state} onCancelAll={mockOnCancelAll} />);

        fireEvent.click(screen.getByRole('button', { name: /Clear Done/i }));
        expect(clearCompleted).toHaveBeenCalled();
    });
});
