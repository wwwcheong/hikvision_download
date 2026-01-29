const request = require('supertest');
const app = require('../server');
const isapiService = require('../services/isapiService');

// Mock isapiService to avoid real network calls
jest.mock('../services/isapiService');

describe('NVR Backend API', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/connect', () => {
        it('should return channels on successful connection', async () => {
            const mockClient = {
                fetch: jest.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    text: jest.fn().mockResolvedValue('<xml>...</xml>') // Content doesn't matter as we mock parseXml
                })
            };
            isapiService.createClient.mockReturnValue(mockClient);
            // Mock parseXml to return a channel list
            isapiService.parseXml.mockResolvedValue({
                InputProxyChannelList: {
                    InputProxyChannel: [
                        { id: '1', name: 'Camera 1' },
                        { id: '2', name: 'Camera 2' }
                    ]
                }
            });

            const res = await request(app)
                .post('/api/connect')
                .send({
                    ip: '192.168.1.100',
                    port: 80,
                    username: 'admin',
                    password: 'password'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.channels).toHaveLength(2);
            expect(res.body.channels[0].name).toBe('Camera 1');
        });

        it('should return 400 for missing credentials', async () => {
            const res = await request(app)
                .post('/api/connect')
                .send({ ip: '192.168.1.100' }); // Missing user/pass

            expect(res.statusCode).toEqual(400);
        });
    });

    describe('POST /api/search', () => {
        it('should return search results', async () => {
             const mockClient = {
                fetch: jest.fn().mockImplementation((url) => {
                    if (url.includes('channels')) {
                         return Promise.resolve({
                            ok: true,
                            text: () => Promise.resolve('<xml>channels</xml>')
                        });
                    }
                    if (url.includes('search')) {
                         return Promise.resolve({
                            ok: true,
                            text: () => Promise.resolve('<xml>matches</xml>')
                        });
                    }
                    return Promise.reject(new Error('Unknown URL'));
                })
            };
            isapiService.createClient.mockReturnValue(mockClient);

            // 1. Mock channel discovery
            isapiService.parseXml.mockResolvedValueOnce({
                InputProxyChannelList: {
                    InputProxyChannel: [{ id: '1', name: 'Camera 1' }]
                }
            })
            // 2. Mock search result
            .mockResolvedValueOnce({
                CMSearchResult: {
                    matchList: {
                        searchMatchItem: [
                            {
                                mediaSegmentDescriptor: {
                                    startTime: '2023-01-01T10:00:00Z',
                                    endTime: '2023-01-01T10:05:00Z',
                                    playbackURI: 'rtsp://...'
                                }
                            }
                        ]
                    }
                }
            });
            
            isapiService.buildSearchXml.mockReturnValue('<xml>search</xml>');

            const res = await request(app)
                .post('/api/search')
                .send({
                    ip: '192.168.1.100',
                    username: 'admin',
                    password: 'password',
                    startTime: '2023-01-01T00:00:00Z',
                    endTime: '2023-01-01T23:59:59Z'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            expect(res.body.results).toHaveLength(1);
            expect(res.body.results[0].cameraName).toBe('Camera 1');
        });

        it('should extract metadata from playbackURI if missing in descriptor', async () => {
             const mockClient = {
                fetch: jest.fn().mockImplementation((url) => {
                    if (url.includes('channels')) {
                         return Promise.resolve({
                            ok: true,
                            text: () => Promise.resolve('<xml>channels</xml>')
                        });
                    }
                    if (url.includes('search')) {
                         return Promise.resolve({
                            ok: true,
                            text: () => Promise.resolve('<xml>matches</xml>')
                        });
                    }
                    return Promise.reject(new Error('Unknown URL'));
                })
            };
            isapiService.createClient.mockReturnValue(mockClient);

            isapiService.parseXml.mockResolvedValueOnce({
                InputProxyChannelList: {
                    InputProxyChannel: [{ id: '1', name: 'Camera 1' }]
                }
            })
            .mockResolvedValueOnce({
                CMSearchResult: {
                    matchList: {
                        searchMatchItem: [
                            {
                                mediaSegmentDescriptor: {
                                    // Missing explicit startTime/endTime
                                    playbackURI: 'rtsp://10.0.0.1/Streaming/tracks/101/?starttime=20260109T100415Z&endtime=20260109T151058Z&size=123456'
                                }
                            }
                        ]
                    }
                }
            });
            
            isapiService.buildSearchXml.mockReturnValue('<xml>search</xml>');

            const res = await request(app)
                .post('/api/search')
                .send({
                    ip: '10.0.0.1',
                    username: 'admin',
                    password: 'password',
                    startTime: '2026-01-09T00:00:00Z',
                    endTime: '2026-01-09T23:59:59Z'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.success).toBe(true);
            const item = res.body.results[0];
            expect(item.startTime).toBe('20260109T100415Z');
            expect(item.endTime).toBe('20260109T151058Z');
            expect(item.size).toBe('123456');
        });
    });

    describe('GET /api/download', () => {
        it('should download successfully with complex URI', async () => {
 const { Readable } = require('stream');

// ... (inside test)

            const mockData = 'mock video data';
            const mockClient = {
                fetch: jest.fn().mockResolvedValue({
                    ok: true,
                    status: 200,
                    headers: { get: () => String(mockData.length) },
                    body: Readable.from([mockData])
                })
            };
            isapiService.createClient.mockReturnValue(mockClient);

            const complexURI = 'rtsp://10.0.0.1:554/path?s=1&e=2';
            
            // 1. Get Token
            const tokenRes = await request(app)
                .post('/api/download-token')
                .send({
                    ip: '192.168.1.100',
                    username: 'admin',
                    password: 'password',
                    playbackURI: complexURI
                });
            
            const token = tokenRes.body.token;

            // 2. Download
            const res = await request(app)
                .get(`/api/download?token=${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.headers['content-disposition']).toContain('attachment');
            
            // Verify the URL constructed passed to fetch
            const calledUrl = mockClient.fetch.mock.calls[0][0];
            // Expect: rtsp://.../path?s=1%26e=2 (partial encoding)
            // : / ? = should be raw. & should be encoded.
            expect(calledUrl).toContain('playbackURI=rtsp://10.0.0.1:554/path?s=1%26e=2');
        });
    });
});
