export const formatDate = (raw) => {
    if (!raw || typeof raw !== 'string') return raw || '';
    if (raw.length < 15) return raw;
    
    // ISAPI format: YYYYMMDDTHHMMSS
    // Robustly handle cases where 'T' might be missing or different
    const y = raw.substring(0, 4);
    const m = raw.substring(4, 6);
    const d = raw.substring(6, 8);
    
    // Check if index 8 is a separator (like 'T') or part of the time
    // Standard ISAPI: 20210101T120000 (index 8 is 'T')
    let timeStart = 8;
    if (isNaN(parseInt(raw.charAt(8), 10))) {
        timeStart = 9; // Skip separator
    }

    const h = raw.substring(timeStart, timeStart + 2);
    const min = raw.substring(timeStart + 2, timeStart + 4);
    const s = raw.substring(timeStart + 4, timeStart + 6);

    return `${y}-${m}-${d} ${h}:${min}:${s}`;
};
