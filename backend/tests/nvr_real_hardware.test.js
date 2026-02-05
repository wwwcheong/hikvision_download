const request = require('supertest');
const app = require('../server');

// This test hits the REAL hardware NVR at 192.168.99.73
// It verifies that the pagination fix actually works against the device
// that was exhibiting the issue.
describe('NVR Integration Test (Real Hardware)', () => {
    // Increase timeout because real NVR search over network takes time
    // especially with sequential searching of all channels
    jest.setTimeout(60000); 

    const config = {
        ip: '192.168.99.73',
        port: 84,
        username: 'admin',
        password: 'mcin@3012',
        startTime: '2026-01-29T00:05:00Z',
        endTime: '2026-01-29T23:55:00Z'
    };

    it('should retrieve all recordings including late ones for Shop_Front28', async () => {
        const res = await request(app)
            .post('/api/search')
            .send(config);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.results)).toBe(true);

        // Filter results for the specific camera in question
        const shopFrontResults = res.body.results.filter(r => r.cameraName === 'Shop_Front28');

        // Based on debug-nvr.js output, we expect 71 unique recordings
        expect(shopFrontResults.length).toBe(71);

        // Verify some specific timestamps to ensure coverage across the day
        const timestamps = shopFrontResults.map(r => r.startTime);
        
        // Early morning
        expect(timestamps).toContain('20260129T004712Z');
        
        // Mid-day (which was previously missing)
        expect(timestamps).toContain('20260129T092519Z'); // 09:25 AM
        expect(timestamps).toContain('20260129T150416Z'); // 03:04 PM
        
        // Late evening
        expect(timestamps).toContain('20260129T200849Z'); // 08:08 PM
    });
});
