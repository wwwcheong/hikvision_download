import { useState, useEffect, useCallback } from 'react';

export const STORAGE_KEY = 'hik_downloaded_log';

export const constructId = (item, credentials) => {
  if (!item || !credentials) {
    return null;
  }
  return `${credentials.ip}:${credentials.port}-${item.cameraID}-${item.startTime}-${item.endTime}`;
};

const updateLocalStorage = (newSet) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newSet)));
  } catch (error) {
    console.error('Failed to save downloaded log to localStorage:', error);
  }
};

export const useDownloadedLog = () => {
  const [downloadedIdSet, setDownloadedIdSet] = useState(new Set());

  useEffect(() => {
    try {
      const storedLog = localStorage.getItem(STORAGE_KEY);
      if (storedLog) {
        setDownloadedIdSet(new Set(JSON.parse(storedLog)));
      }
    } catch (error) {
      console.error('Failed to load downloaded log from localStorage:', error);
    }
  }, []);

  const addToDownloadedLog = useCallback((item, credentials) => {
    const id = constructId(item, credentials);
    if (id) {
      setDownloadedIdSet(prevSet => {
        if (prevSet.has(id)) {
          return prevSet;
        }
        const newSet = new Set(prevSet);
        newSet.add(id);
        updateLocalStorage(newSet);
        return newSet;
      });
    }
  }, []); // constructId and updateLocalStorage are stable (external)

  const isDownloaded = useCallback((item, credentials) => {
    const id = constructId(item, credentials);
    return downloadedIdSet.has(id);
  }, [downloadedIdSet]); // constructId is stable

  return { isDownloaded, addToDownloadedLog, downloadedIdSet };
};
