import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDownloadedLog, STORAGE_KEY } from './useDownloadedLog';

// Mock data
const credentials = {
  ip: '192.168.1.100',
  port: '80',
};

const item1 = {
  cameraID: '1',
  startTime: '20260204T100000Z',
  endTime: '20260204T100500Z',
};

const item2 = {
  cameraID: '2',
  startTime: '20260204T110000Z',
  endTime: '20260204T110500Z',
};

const expectedId1 = '192.168.1.100:80-1-20260204T100000Z-20260204T100500Z';

describe('useDownloadedLog', () => {
  let localStorageMock;
  let consoleErrorSpy;

  beforeEach(() => {
    // Mock localStorage
    let store = {};
    localStorageMock = {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value.toString();
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with an empty log', () => {
    const { result } = renderHook(() => useDownloadedLog());
    expect(result.current.downloadedIdSet.size).toBe(0);
    expect(localStorageMock.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('should load existing log from localStorage on initialization', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([expectedId1]));
    const { result } = renderHook(() => useDownloadedLog());
    expect(result.current.downloadedIdSet.size).toBe(1);
    expect(result.current.downloadedIdSet.has(expectedId1)).toBe(true);
  });

  it('should handle JSON parse error gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');
    const { result } = renderHook(() => useDownloadedLog());
    expect(result.current.downloadedIdSet.size).toBe(0);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should add a new item to the log and persist to localStorage', () => {
    const { result } = renderHook(() => useDownloadedLog());

    act(() => {
      result.current.addToDownloadedLog(item1, credentials);
    });

    expect(result.current.downloadedIdSet.size).toBe(1);
    expect(result.current.downloadedIdSet.has(expectedId1)).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify([expectedId1])
    );
  });

  it('should handle storage quota exceeded error', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    const { result } = renderHook(() => useDownloadedLog());

    act(() => {
      result.current.addToDownloadedLog(item1, credentials);
    });

    // It should still update state even if storage fails? 
    // The current implementation updates state THEN tries to save.
    // Wait, let's check implementation.
    // setDownloadedIdSet(prevSet => { ... updateLocalStorage(newSet); return newSet; });
    // So state IS updated.
    
    expect(result.current.downloadedIdSet.size).toBe(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should not add a duplicate item to the log', () => {
    const { result } = renderHook(() => useDownloadedLog());

    act(() => {
      result.current.addToDownloadedLog(item1, credentials);
    });
    
    // Call setItem once
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.addToDownloadedLog(item1, credentials);
    });

    expect(result.current.downloadedIdSet.size).toBe(1);
    // Should not call setItem again since the set hasn't changed
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
  });

  it('should correctly check if an item is downloaded', () => {
    const { result } = renderHook(() => useDownloadedLog());

    act(() => {
      result.current.addToDownloadedLog(item1, credentials);
    });

    expect(result.current.isDownloaded(item1, credentials)).toBe(true);
    expect(result.current.isDownloaded(item2, credentials)).toBe(false);
  });
  
  it('should handle null item or credentials gracefully', () => {
    const { result } = renderHook(() => useDownloadedLog());
    
    act(() => {
        result.current.addToDownloadedLog(null, credentials);
    });
    expect(result.current.downloadedIdSet.size).toBe(0);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    act(() => {
        result.current.addToDownloadedLog(item1, null);
    });
    expect(result.current.downloadedIdSet.size).toBe(0);
    expect(localStorageMock.setItem).not.toHaveBeenCalled();

    expect(result.current.isDownloaded(null, credentials)).toBe(false);
    expect(result.current.isDownloaded(item1, null)).toBe(false);
  });
});