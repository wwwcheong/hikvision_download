import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, Checkbox, Stack } from '@mui/material';

const PAGE_SIZE = 50;

const formatDate = (raw) => {
    if (!raw || typeof raw !== 'string') return raw || '';
    if (raw.length < 15) return raw;
    const y = raw.substring(0, 4);
    const m = raw.substring(4, 6);
    const d = raw.substring(6, 8);
    let timeStart = 8;
    if (isNaN(parseInt(raw.charAt(8), 10))) {
        timeStart = 9;
    }
    const h = raw.substring(timeStart, timeStart + 2);
    const min = raw.substring(timeStart + 2, timeStart + 4);
    const s = raw.substring(timeStart + 4, timeStart + 6);
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
};

const formatSize = (bytes) => {
    if (!bytes) return '-';
    const mb = Math.round(parseInt(bytes, 10) / (1024 * 1024));
    return `${mb} MB`;
};

const PageBtn = ({ children, onClick, active, disabled }) => (
    <Box
        component="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        sx={{
            px: 0.75,
            py: 0.35,
            border: '1px solid',
            borderColor: active ? 'primary.main' : 'divider',
            borderRadius: 0.5,
            backgroundColor: active ? 'primary.main' : 'background.paper',
            color: active ? 'primary.contrastText' : 'text.secondary',
            fontFamily: '"Fira Sans", sans-serif',
            fontSize: '0.65rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'all 100ms',
            '&:hover': !disabled && !active
                ? { borderColor: 'primary.main', color: 'primary.main' }
                : {},
        }}
    >
        {children}
    </Box>
);

const thStyle = {
    backgroundColor: 'background.default',
    fontWeight: 600,
    color: 'text.primary',
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    px: 1,
    py: 0.75,
    borderBottom: '2px solid',
    borderColor: 'divider',
    textAlign: 'left',
    whiteSpace: 'nowrap',
};

const tdStyle = {
    px: 1,
    py: 0.75,
    borderBottom: '1px solid',
    borderColor: 'divider',
    color: 'text.secondary',
};

const cellText = {
    fontFamily: '"Fira Code", monospace',
    fontSize: '0.7rem',
    color: 'text.primary',
};

const tableScrollSx = {
    flexGrow: 1,
    minHeight: 0,
    overflowY: 'scroll',
    // Force always-visible scrollbar (overrides OS overlay behavior)
    scrollbarWidth: 'normal',
    '&::-webkit-scrollbar': { width: 12 },
    '&::-webkit-scrollbar-track': { background: '#E2E8F0' },
    '&::-webkit-scrollbar-thumb': {
        background: '#94A3B8',
        borderRadius: 6,
        border: '2px solid #E2E8F0',
    },
    '&::-webkit-scrollbar-thumb:hover': { background: '#64748B' },
    '&::-webkit-scrollbar-corner': { background: '#E2E8F0' },
};

const ResultsTable = ({ results, totalCount, credentials, downloadState, isDownloaded, loading }) => {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [skipDownloaded, setSkipDownloaded] = useState(true);
    const [page, setPage] = useState(0);
    const { addToQueue } = downloadState;

    const availableResults = useMemo(() => {
        if (!results) return [];
        return results.filter((r) => !(skipDownloaded && isDownloaded(r, credentials)));
    }, [results, skipDownloaded, isDownloaded, credentials]);

    const totalPages = Math.ceil(availableResults.length / PAGE_SIZE);
    const paginatedResults = useMemo(() => {
        const start = page * PAGE_SIZE;
        return availableResults.slice(start, start + PAGE_SIZE);
    }, [availableResults, page]);

    const pageNumbers = useMemo(() => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
        if (page < 4) return [0, 1, 2, 3, 4, '...', totalPages - 1];
        if (page > totalPages - 5) return [0, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        return [0, '...', page - 1, page, page + 1, '...', totalPages - 1];
    }, [page, totalPages]);

const handleSelectAll = (event) => {
        const newSelected = new Set(selectedIds);
        if (event.target.checked) {
            availableResults.forEach((r) => newSelected.add(r.playbackURI));
        } else {
            availableResults.forEach((r) => newSelected.delete(r.playbackURI));
        }
        setSelectedIds(newSelected);
    };

    const handleSelectRow = (playbackURI) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(playbackURI)) {
            newSelected.delete(playbackURI);
        } else {
            newSelected.add(playbackURI);
        }
        setSelectedIds(newSelected);
    };

    const handleDownloadSelected = () => {
        const itemsToDownload = results.filter((r) => selectedIds.has(r.playbackURI));
        addToQueue(itemsToDownload);
        const newSelected = new Set(selectedIds);
        itemsToDownload.forEach((item) => newSelected.delete(item.playbackURI));
        setSelectedIds(newSelected);
    };

    const numSelected = Array.from(selectedIds).filter((id) =>
        results?.some((r) => r.playbackURI === id)
    ).length;

    const isSelectAllChecked =
        paginatedResults.length > 0 &&
        paginatedResults.every((r) => selectedIds.has(r.playbackURI));
    const isSelectAllIndeterminate =
        !isSelectAllChecked && paginatedResults.some((r) => selectedIds.has(r.playbackURI));

    if (!results) return null;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* ── Top bar: results count + pagination ── */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 1.5,
                    py: 0.75,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    flexShrink: 0,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, availableResults.length)} of{' '}
                        {availableResults.length}
                        {totalCount !== availableResults.length && ` (${totalCount} total)`}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography
                        component="label"
                        variant="caption"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: 'text.secondary' }}
                    >
                        <input
                            type="checkbox"
                            checked={!skipDownloaded}
                            onChange={(e) => { setSkipDownloaded(!e.target.checked); setPage(0); }}
                            style={{ accentColor: 'var(--mui-palette-primary-main, #1976d2)', cursor: 'pointer' }}
                        />
                        Show downloaded
                    </Typography>
                    {numSelected > 0 && (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleDownloadSelected}
                            sx={{ fontSize: '0.8rem', py: 0.75, px: 1.5, fontWeight: 600 }}
                        >
                            Export Selected ({numSelected})
                        </Button>
                    )}

                    <Stack direction="row" spacing={0.5}>
                        <PageBtn onClick={() => setPage(0)} disabled={page === 0}>&laquo;</PageBtn>
                        <PageBtn onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>&lsaquo;</PageBtn>
                        {pageNumbers.map((n, i) =>
                            n === '...' ? (
                                <Box key={`ellipsis-${i}`} sx={{ px: 0.5, fontSize: '0.65rem', color: 'text.secondary' }}>...</Box>
                            ) : (
                                <PageBtn key={n} onClick={() => setPage(n)} active={page === n}>{n + 1}</PageBtn>
                            )
                        )}
                        <PageBtn onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>&rsaquo;</PageBtn>
                        <PageBtn onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>&raquo;</PageBtn>
                    </Stack>
                </Stack>
            </Box>

            {/* ── Table header (sticky, outside scroll) ── */}
            <Box sx={{ flexShrink: 0, overflow: 'hidden', minWidth: 700 }}>
                <Box
                    component="table"
                    sx={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.7rem',
                    }}
                >
                    <Box component="thead">
                        <Box component="tr">
                            <Box component="th" sx={{ ...thStyle, width: 40 }}>
                                <Checkbox
                                    data-testid="select-all-checkbox"
                                    size="small"
                                    indeterminate={isSelectAllIndeterminate}
                                    checked={isSelectAllChecked}
                                    onChange={handleSelectAll}
                                    sx={{ p: 0.25 }}
                                />
                            </Box>
                            <Box component="th" sx={{ ...thStyle, width: 150 }}>Camera</Box>
                            <Box component="th" sx={{ ...thStyle, width: 160 }}>Start (UTC)</Box>
                            <Box component="th" sx={{ ...thStyle, width: 160 }}>End (UTC)</Box>
                            <Box component="th" sx={{ ...thStyle, width: 80, textAlign: 'right' }}>Size</Box>
                            <Box component="th" sx={{ ...thStyle, width: 90, textAlign: 'center' }}>Status</Box>
                            <Box component="th" sx={{ ...thStyle, width: 70 }}>Action</Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* ── Scrollable table body ── */}
            <Box sx={tableScrollSx} className="scroll-shadows">
                <Box sx={{ minWidth: 700 }}>
                    <Box
                        component="table"
                        sx={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontFamily: '"Fira Code", monospace',
                            fontSize: '0.7rem',
                        }}
                    >
                        <Box component="tbody">
                            {paginatedResults.map((row) => {
                                const isRowSelected = selectedIds.has(row.playbackURI);
                                const isRowDownloaded = isDownloaded(row, credentials);
                                const available = !(isRowDownloaded && skipDownloaded);

                                return (
                                    <Box
                                        component="tr"
                                        key={row.playbackURI}
                                        onClick={() => available && handleSelectRow(row.playbackURI)}
                                        sx={{
                                            cursor: available ? 'pointer' : 'not-allowed',
                                            backgroundColor: isRowSelected ? 'action.selected' : 'transparent',
                                            opacity: available ? 1 : 0.5,
                                            transition: 'background-color 100ms',
                                            '&:hover': {
                                                backgroundColor: available
                                                    ? isRowSelected ? 'action.selected' : 'action.hover'
                                                    : 'transparent',
                                            },
                                        }}
                                    >
                                        <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>
                                            <Checkbox
                                                size="small"
                                                checked={isRowSelected}
                                                disabled={!available}
                                                onChange={() => handleSelectRow(row.playbackURI)}
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{ p: 0.25 }}
                                            />
                                        </Box>
                                        <Box component="td" sx={tdStyle}>
                                            <Typography sx={cellText}>{row.cameraName}</Typography>
                                        </Box>
                                        <Box component="td" sx={tdStyle}>
                                            <Typography sx={cellText}>{formatDate(row.startTime)}</Typography>
                                        </Box>
                                        <Box component="td" sx={tdStyle}>
                                            <Typography sx={cellText}>{formatDate(row.endTime)}</Typography>
                                        </Box>
                                        <Box component="td" sx={{ ...tdStyle, textAlign: 'right' }}>
                                            <Typography sx={{ ...cellText, fontVariantNumeric: 'tabular-nums' }}>
                                                {formatSize(row.size)}
                                            </Typography>
                                        </Box>
                                        <Box component="td" sx={{ ...tdStyle, textAlign: 'center' }}>
                                            <Box
                                                sx={{
                                                    display: 'inline-block',
                                                    px: 0.75,
                                                    py: 0.25,
                                                    borderRadius: 0.5,
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    backgroundColor: isRowDownloaded ? '#dcfce7' : '#fef3c7',
                                                    color: isRowDownloaded ? '#166534' : '#92400e',
                                                }}
                                            >
                                                {isRowDownloaded ? 'DONE' : 'READY'}
                                            </Box>
                                        </Box>
                                        <Box component="td" sx={tdStyle}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                disabled={!available}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addToQueue([row]);
                                                }}
                                                sx={{
                                                    fontSize: '0.8rem',
                                                    py: 0.75,
                                                    px: 1.25,
                                                    minWidth: 0,
                                                    borderColor: 'divider',
                                                    color: 'primary.main',
                                                    '&:hover': {
                                                        borderColor: 'primary.main',
                                                        backgroundColor: 'action.hover',
                                                    },
                                                }}
                                            >
                                                Export
                                            </Button>
                                        </Box>
                                    </Box>
                                );
                            })}
                            {paginatedResults.length === 0 && (
                                <Box component="tr">
                                    <Box component="td" colSpan={7} sx={{ ...tdStyle, textAlign: 'center', py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">No recordings found</Typography>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ResultsTable;
