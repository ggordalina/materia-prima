const https = require('https');
const fs = require('fs');
const filename = './materia_prima.json';
import 'dotenv/config'
const audio_files_location = './audio';
const materia_prima = require(filename);

const hostname = process.env.HOSTNAME;
const headers = {
    'User-Agent': process.env.USER_AGENT,
    'Host': hostname,
    'Cookie': process.env.COOKIE
};

function buildOptionsRequest(path) {
    return {
        hostname: hostname,
        path: path,
        headers: headers
    }
}

function getFileName(item) {
    return item.audio_url
        .split('/').at(-1)
        .split('-').at(-1);
}

function request(item) {
    const options = buildOptionsRequest(item.audio_url);
    const audioFilename = getFileName(item);

    return new Promise((resolve, reject) => {
        const audioFileStream = fs.createWriteStream(`${audio_files_location}/${audioFilename}`, { flags : 'a' });
        https.get(options, response => {
            const statusCode = response.statusCode;
            const contentLength = response.headers['content-length'];

            if (statusCode > 300) {
                audioFileStream.end();
                reject(statusCode);
                return;
            }
    
            response.pipe(audioFileStream)
            response.on('end', () => {
                audioFileStream.end();
                resolve({ audioFilename, contentLength });
            });
        })
        .on('error', err => {
            audioFileStream.end();
            reject(err);
        })
        .end();
    });
}

async function main() {
    try {
        const fileLength = materia_prima.length;
        let downloadedContentLength = 0;
        for (let idx = 0; idx < fileLength; idx++) {
            const { _, contentLength }= await request(materia_prima[idx]);
            downloadedContentLength += Number(contentLength);

            const sizeDownloaded = (((downloadedContentLength / 1024) / 1024) / 1024).toFixed(2);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(`${idx + 1} / ${fileLength} items downloaded (${sizeDownloaded} GB)`);
        }
    } catch (err) {
        console.log('Fuck fuck', err);
    }
}

main()