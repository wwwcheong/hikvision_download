const DigestFetch = require('digest-fetch');
const xml2js = require('xml2js');
const crypto = require('crypto');

const parser = new xml2js.Parser({ explicitArray: false });
const builder = new xml2js.Builder();

const createClient = (user, password) => {
    return new DigestFetch(user, password);
};

const parseXml = async (xmlString) => {
    try {
        return await parser.parseStringPromise(xmlString);
    } catch (error) {
        console.error('XML Parse Error:', error);
        throw new Error('Failed to parse XML response from NVR');
    }
};

const buildSearchXml = ({ trackID, startTime, endTime }) => {
    const searchID = crypto.randomUUID();

    const obj = {
        CMSearchDescription: {
            searchID: searchID,
            trackList: {
                trackID: trackID
            },
            timeSpanList: {
                timeSpan: {
                    startTime: startTime,
                    endTime: endTime
                }
            },
            maxResults: 100,
            searchResultPostion: 0,
            metadataList: {
                metadataDescriptor: '//recordType.meta.std-cgi.com'
            }
        }
    };
    
    return builder.buildObject(obj);
};

module.exports = {
    createClient,
    parseXml,
    buildSearchXml
};
