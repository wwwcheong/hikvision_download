import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResultsTable from './ResultsTable';
import { constructId } from '../hooks/useDownloadedLog';

const credentials = { ip: '192.168.1.1', port: '80' };

const mockResults = [
  { playbackURI: 'uri1', cameraName: 'Cam 1', startTime: '20260204T100000Z', endTime: '20260204T100500Z', size: '10485760', cameraID: '1' },
  { playbackURI: 'uri2', cameraName: 'Cam 2', startTime: '20260204T110000Z', endTime: '20260204T110500Z', size: '20971520', cameraID: '2' },
  { playbackURI: 'uri3', cameraName: 'Cam 3', startTime: '20260204T120000Z', endTime: '20260204T120500Z', size: '31457280', cameraID: '3' },
];

const downloadedId1 = constructId(mockResults[0], credentials);

describe('ResultsTable', () => {
  let mockAddToQueue;
  let mockIsDownloaded;

  beforeEach(() => {
    mockAddToQueue = vi.fn();
    mockIsDownloaded = vi.fn((item, creds) => constructId(item, creds) === downloadedId1);
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      results: mockResults,
      downloadState: {
        addToQueue: mockAddToQueue,
      },
      credentials,
      isDownloaded: mockIsDownloaded,
      ...props,
    };
    return render(<ResultsTable {...defaultProps} />);
  };

  it('should render rows and visually disable a downloaded item', () => {
    renderComponent();
    
    // Check for the three rows
    expect(screen.getByText('Cam 1')).toBeInTheDocument();
    expect(screen.getByText('Cam 2')).toBeInTheDocument();
    expect(screen.getByText('Cam 3')).toBeInTheDocument();

    // The first row should be disabled
    const row1 = screen.getByText('Cam 1').closest('tr');
    expect(row1).toHaveStyle('cursor: not-allowed');
    
    const checkbox1 = row1.querySelector('input[type="checkbox"]');
    expect(checkbox1).toBeDisabled();

    // The second row should be enabled
    const row2 = screen.getByText('Cam 2').closest('tr');
    expect(row2).toHaveStyle('cursor: pointer');
    const checkbox2 = row2.querySelector('input[type="checkbox"]');
    expect(checkbox2).not.toBeDisabled();
  });

  it('should not select disabled rows on "Select All" when "Skip downloaded" is checked', () => {
    renderComponent();

    // Directly target the input for the "Select All" checkbox
    const selectAllInput = screen.getByTestId('select-all-checkbox').querySelector('input');
    fireEvent.click(selectAllInput);

    // After clicking select all, only 2 should be selected
    const selectedCountText = screen.getByText(/Download Selected/);
    expect(selectedCountText).toHaveTextContent('Download Selected (2)');
    
    // uri1 should not be selected
    const row1Checkbox = screen.getByText('Cam 1').closest('tr').querySelector('input[type="checkbox"]');
    expect(row1Checkbox).not.toBeChecked();

    // uri2 and uri3 should be selected
    const row2Checkbox = screen.getByText('Cam 2').closest('tr').querySelector('input[type="checkbox"]');
    expect(row2Checkbox).toBeChecked();
    const row3Checkbox = screen.getByText('Cam 3').closest('tr').querySelector('input[type="checkbox"]');
    expect(row3Checkbox).toBeChecked();
  });

  it('should call addToQueue with the correct items when "Download Selected" is clicked', () => {
    renderComponent();
    
    // Select the second item
    const row2 = screen.getByText('Cam 2').closest('tr');
    fireEvent.click(row2);
    
    // Click download selected
    const downloadButton = screen.getByRole('button', { name: /Download Selected/ });
    fireEvent.click(downloadButton);

    expect(mockAddToQueue).toHaveBeenCalledWith([mockResults[1]]);
  });

  it('should select all rows including downloaded ones if "Skip downloaded" is unchecked', () => {
    renderComponent();
    
    // Uncheck the "Skip downloaded files" checkbox
    const skipCheckbox = screen.getByLabelText('Skip downloaded files');
    fireEvent.click(skipCheckbox);
    
    // Directly target the input for the "Select All" checkbox
    const selectAllInput = screen.getByTestId('select-all-checkbox').querySelector('input');
    fireEvent.click(selectAllInput);
    
    // All 3 should be selected
    const selectedCountText = screen.getByText(/Download Selected/);
    expect(selectedCountText).toHaveTextContent('Download Selected (3)');
  });

  it('clicking a disabled row should not select it', () => {
    renderComponent();

    const row1 = screen.getByText('Cam 1').closest('tr');
    fireEvent.click(row1);

    const selectedCountText = screen.getByText(/Download Selected/);
    expect(selectedCountText).toHaveTextContent('Download Selected (0)');
  });

  it('should allow re-downloading when "Skip downloaded" is unchecked', () => {
    renderComponent();
    
    // Initially Cam 1 is disabled
    const row1 = screen.getByText('Cam 1').closest('tr');
    const checkbox1 = row1.querySelector('input[type="checkbox"]');
    const downloadBtn1 = screen.getByRole('button', { name: 'Downloaded' });
    
    expect(checkbox1).toBeDisabled();
    expect(downloadBtn1).toBeDisabled();

    // Uncheck "Skip downloaded files"
    const skipCheckbox = screen.getByLabelText('Skip downloaded files');
    fireEvent.click(skipCheckbox);

    // Now it should be enabled
    expect(checkbox1).not.toBeDisabled();
    expect(downloadBtn1).not.toBeDisabled();

    // Should be able to click and select it
    fireEvent.click(row1);
    const selectedCountText = screen.getByText(/Download Selected/);
    expect(selectedCountText).toHaveTextContent('Download Selected (1)');
  });
});
