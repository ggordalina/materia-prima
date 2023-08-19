import https from 'https';
import fs from 'fs';
import 'dotenv/config'
import { parse, getChildNodesByType } from './html-parser.js';

const fileName = 'result.json';
const MAX_PAGE = 67;
const hostname = process.env.HOSTNAME;
const path = '/play/bg_l_ep/?listProgram=2018&listtype=recent&page={0}&type=radio';
const headers = {
    'User-Agent': process.env.USER_AGENT,
    'Host': hostname,
    'Cookie': process.env.COOKIE
};

function buildOptionsRequest(page) {
    return {
        hostname: hostname,
        path: path.replace('{0}', page),
        headers: headers
    }
}

function request(options) {
    return new Promise((resolve, reject) => {
        https.get(options, response => {
            const statusCode = response.statusCode;
            if (statusCode < 200 || statusCode >= 300) {
                reject(`Invalid Request: ${statusCode}`);
                return;
            }

            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(data));
        })
        .on('error', err => reject(err))
        .end()
    });
}

function getData(element) {
    let url = element.getAttribute('href');
    let date = '';
    let title = '';
    let description = '';
    let length = '';

    let podcastItems = element.childNodes[0].childNodes[0].childNodes;
    podcastItems.forEach(item => {
        // podcast info
        if (item.classList.contains('podcast-flex')) {
            let podcastDateElement = item.childNodes[0];
            date = podcastDateElement.childNodes[0]?.innerText ?? 'N/A';

            let podcastInfoElement = item.childNodes[1];
            title = podcastInfoElement.childNodes[0]?.childNodes[0]?.innerText ?? 'N/A';
            description = podcastInfoElement.childNodes[1]?.childNodes[0]?.innerText ?? 'N/A';
        }

        // podcast metadata
        if (item.classList.contains('col-sm-3') && item.classList.contains('podcast-metadata')) {
            length = item.childNodes[0]?.innerText ?? 'N/A';
        }
    });

    return {
        url: url.trim(),
        date: date.trim(),
        title: title.trim(),
        description: description.trim(),
        length: length.trim()
    };
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    var stream = fs.createWriteStream(fileName, { flags: 'a' });
    stream.write(`[\n`);

    try {
        let currentPage = 1;
        while (currentPage <= MAX_PAGE) {
            console.log('Requesting Page:', currentPage);

            let options = buildOptionsRequest(currentPage);
            let data = await request(options);
            let html = parse(data, true);

            getChildNodesByType(html, 'a').forEach(child => {
                let content = getData(child);
                stream.write(`\t${JSON.stringify(content)},\n`);
            });

            await sleep(500);
            currentPage++;
        }

    } catch (err) {
        console.error(err);
        stream.end();
        throw err;
    }

    stream.write(`]`);
    stream.end();
    console.log('Completed!');
}

main();