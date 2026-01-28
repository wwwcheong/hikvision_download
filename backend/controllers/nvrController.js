const isapiService = require('../services/isapiService');
const crypto = require('crypto');

// Helper to fetch channels
const fetchChannels = async (client, baseUrl) => {
    let channelsUrl = `${baseUrl}/ISAPI/ContentMgmt/InputProxy/channels`;
    let channelsRes = await client.fetch(channelsUrl);
    
    if (!channelsRes.ok) {
        channelsUrl = `${baseUrl}/ISAPI/System/Video/inputs/channels`;
        channelsRes = await client.fetch(channelsUrl);
    }
    
    if (!channelsRes.ok) {
         throw new Error(`Failed to fetch channels: ${channelsRes.status}`);
    }
    
    const xmlText = await channelsRes.text();
    const json = await isapiService.parseXml(xmlText);
    
    let channels = [];
    const normalizeArray = (obj) => Array.isArray(obj) ? obj : [obj];

    if (json.InputProxyChannelList && json.InputProxyChannelList.InputProxyChannel) {
         channels = normalizeArray(json.InputProxyChannelList.InputProxyChannel).map(ch => ({
             id: ch.id,
             name: ch.name || `Camera ${ch.id}`
         }));
    } else if (json.VideoInputChannelList && json.VideoInputChannelList.VideoInputChannel) {
         channels = normalizeArray(json.VideoInputChannelList.VideoInputChannel).map(ch => ({
             id: ch.id,
             name: ch.name || `Camera ${ch.id}`
         }));
    }
    
    return channels.filter(c => c.id && c.id !== '0');
};

const isValidIp = (ip) => {
    // Basic IPv4 regex or hostname check
    return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9.-]+$/.test(ip);
};

const isValidPort = (port) => {
    const p = parseInt(port, 10);
    return !isNaN(p) && p > 0 && p < 65536;
};

exports.connect = async (req, res) => {
    const { ip, port, username, password } = req.body;
    
    if (!ip || !username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }
    
    if (!isValidIp(ip) || (port && !isValidPort(port))) {
         return res.status(400).json({ error: 'Invalid IP or Port' });
    }
    
    const baseUrl = `http://${ip}:${port || 80}`;
    const client = isapiService.createClient(username, password);
    
    try {
        console.log(`Connecting to ${baseUrl}/ISAPI/System/deviceInfo`);
        const infoRes = await client.fetch(`${baseUrl}/ISAPI/System/deviceInfo`);
        
        if (infoRes.status === 401) {
            return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
        }
        if (!infoRes.ok) {
            throw new Error(`Connection failed: ${infoRes.status} ${infoRes.statusText}`);
        }
        
        const channels = await fetchChannels(client, baseUrl);
        res.json({ success: true, channels });
        
    } catch (error) {
        console.error('Connect Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.search = async (req, res) => {
    const { ip, port, username, password, startTime, endTime } = req.body;
    
    if (!ip || !username || !password || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    if (!isValidIp(ip) || (port && !isValidPort(port))) {
         return res.status(400).json({ error: 'Invalid IP or Port' });
    }

    const baseUrl = `http://${ip}:${port || 80}`;
    const client = isapiService.createClient(username, password);
    
    try {
        // 1. Get Channels
        const channels = await fetchChannels(client, baseUrl);
        
        // Map ID to Name
        const channelMap = {};
        channels.forEach(ch => {
            channelMap[ch.id] = ch.name;
        });
        
        const results = [];
        const normalizeArray = (obj) => Array.isArray(obj) ? obj : [obj];
        
        // 2. Sequential Search
        for (const ch of channels) {
            const trackID = ch.id;
            // Ensure trackID is proper for search. 
            // ISAPI.md states that for NVRs, the trackID typically follows the pattern: Camera_Number * 100 + 1
            // e.g. Camera 1 -> 101, Camera 2 -> 201.
            // If we receive a raw ID (like '1'), we convert it to this format.
            let searchTrackID = parseInt(trackID);
            if (searchTrackID < 100) {
                searchTrackID = searchTrackID * 100 + 1;
            }
            
            const searchXml = isapiService.buildSearchXml({
                trackID: searchTrackID, 
                startTime, 
                endTime
            });
            
            // console.log(`Searching Camera ${ch.name} (Track ${searchTrackID})...`);
            
            const searchRes = await client.fetch(`${baseUrl}/ISAPI/ContentMgmt/search`, {
                method: 'POST',
                body: searchXml,
                headers: { 'Content-Type': 'application/xml' }
            });
            
            if (!searchRes.ok) {
                // console.warn(`Search failed for ${ch.name}: ${searchRes.status}`);
                continue; 
            }
            
            const sXml = await searchRes.text();
            const sJson = await isapiService.parseXml(sXml);
            
            if (sJson.CMSearchResult && sJson.CMSearchResult.matchList && sJson.CMSearchResult.matchList.searchMatchItem) {
                const matches = normalizeArray(sJson.CMSearchResult.matchList.searchMatchItem);
                
                matches.forEach(m => {
                    const media = m.mediaSegmentDescriptor;
                    if (media) {
                        results.push({
                            cameraName: channelMap[trackID] || `Camera ${trackID}`,
                            startTime: media.startTime,
                            endTime: media.endTime,
                            playbackURI: media.playbackURI
                        });
                    }
                });
            }
        }
        
        res.json({ success: true, results });

    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Simple in-memory token store (production would use Redis)
const downloadTokens = new Map();

exports.getDownloadToken = async (req, res) => {
    const { ip, port, username, password, playbackURI, fileName } = req.body;
    
    if (!ip || !username || !password || !playbackURI) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    if (!isValidIp(ip) || (port && !isValidPort(port))) {
         return res.status(400).json({ error: 'Invalid IP or Port' });
    }

    // Sanitize filename for safe download
    const safeFileName = (fileName || 'video.mp4').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    
    const token = crypto.randomUUID();
    downloadTokens.set(token, { ip, port, username, password, playbackURI, fileName: safeFileName });
    
    // Expire token after 30 seconds
    setTimeout(() => downloadTokens.delete(token), 30000);
    
    res.json({ success: true, token });
};

exports.download = async (req, res) => {
    const { token } = req.query;
    
    if (!token || !downloadTokens.has(token)) {
        return res.status(400).send('Invalid or expired download token');
    }

    const { ip, port, username, password, playbackURI, fileName } = downloadTokens.get(token);
    // Optional: One-time use token
    downloadTokens.delete(token); 

    const baseUrl = `http://${ip}:${port || 80}`;
    const client = isapiService.createClient(username, password);
    
    try {
        // playbackURI needs to be encoded as it contains special chars like &
        const downloadUrl = `${baseUrl}/ISAPI/ContentMgmt/download?playbackURI=${encodeURIComponent(playbackURI)}`;
        
        console.log(`Proxying download: ${fileName || 'video.mp4'}`);
        
        const response = await client.fetch(downloadUrl);
        
        if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName || 'video.mp4'}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }

        response.body.pipe(res);
        
    } catch (error) {
        console.error('Download Error:', error);
        if (!res.headersSent) {
            res.status(500).send(`Download Error: ${error.message}`);
        }
    }
};