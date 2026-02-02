import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DownloadQueueMonitor from './DownloadQueueMonitor';

describe('DownloadQueueMonitor', () => {
    const mockRetryFailed = vi.fn();
    const mockOnCancelAll = vi.fn();

    const baseState = {
        queue: [],
        addToQueue: vi.fn(),
        retryFailed: mockRetryFailed,
        isProcessing: false,
        currentProgress: 0,
        currentFileName: '',
        cancelAll: vi.fn()
    };

    it('returns null when queue is empty', () => {
        const { container } = render(
            <DownloadQueueMonitor 
                downloadState={{ ...baseState, queue: [] }} 
                onCancelAll={mockOnCancelAll} 
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders progress bar when items are in queue', () => {
        const state = {
            ...baseState,
            queue: [
                { status: 'pending', id: 1 },
                { status: 'completed', id: 2 }
            ]
        };
        render(<DownloadQueueMonitor downloadState={state} onCancelAll={mockOnCancelAll} />);
        
        expect(screen.getByText(/Batch Status/i)).toBeInTheDocument();
        expect(screen.getByText(/1 done/i)).toBeInTheDocument();
        expect(screen.getByText(/1 remaining/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel All/i })).toBeInTheDocument();
    });

    it('renders active download progress', () => {
        const state = {
            ...baseState,
            queue: [{ status: 'downloading', id: 1 }],
            isProcessing: true,
            currentFileName: 'video.mp4',
            currentProgress: 45
        };
        render(<DownloadQueueMonitor downloadState={state} onCancelAll={mockOnCancelAll} />);
        
        expect(screen.getByText(/Downloading: video.mp4 \(45%\)/i)).toBeInTheDocument();
    });

    it('renders error message and retry button when errors exist', () => {
        const state = {
            ...baseState,
            queue: [{ status: 'error', id: 1, cameraName: 'Cam1', error: 'Network Error' }]
        };
        render(<DownloadQueueMonitor downloadState={state} onCancelAll={mockOnCancelAll} />);
        
        expect(screen.getByText(/1 failed downloads/i)).toBeInTheDocument();
        expect(screen.getByText(/Cam1: Network Error/i)).toBeInTheDocument();
        
        const retryBtn = screen.getByRole('button', { name: /Retry Failed/i });
        fireEvent.click(retryBtn);
        expect(mockRetryFailed).toHaveBeenCalled();
    });

    it('calls onCancelAll when Cancel All is clicked', () => {
        const state = {
            ...baseState,
            queue: [{ status: 'pending', id: 1 }]
        };
        render(<DownloadQueueMonitor downloadState={state} onCancelAll={mockOnCancelAll} />);
        
        fireEvent.click(screen.getByRole('button', { name: /Cancel All/i }));
        expect(mockOnCancelAll).toHaveBeenCalled();
    });
});
