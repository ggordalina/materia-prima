const https = require('https');
const parse = require('node-html-parser');
const fs = require('fs');
const filename = './result.json';
import 'dotenv/config'
const result_file = require(filename);

const FILENAME = 'materia_prima.json';
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

function request(item) {
    const options = buildOptionsRequest(item.url);

    return new Promise((resolve, reject) => {
        https.get(options, response => {
            const statusCode = response.statusCode;
            if (statusCode > 300) {
                reject(statusCode);
                return;
            }

            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(data));
        })
        .on('error', (err) => reject(err))
        .end();
    })
}

function getAudioUrlFromHtml(data) {
    function findScriptSectionInnerText () {
        return parse.parse(data)
            .childNodes[1]
            .childNodes
            .find(node => node.rawTagName == 'body')
            .childNodes.filter(node => node.rawTagName == 'script')
            .find(script => script.innerText.includes('.mp3'))
            .innerText;
    }

    return findScriptSectionInnerText()
        .split('\n')
        .find(line => line.includes('.mp3'))
        .split('"')[1];
}

function getFormatedLength(lengthStr) {
    const timeframe = lengthStr.split(' ');
    let time = 0;
    if (timeframe.length == 1) {
        let unit = timeframe[0].includes('h') ? 'h' : 'min';
        time = Number(timeframe[0].split(unit)[0])
        if (unit == 'h') time *= 60;
    }

    if (timeframe.length == 2) {
        let hour = Number(timeframe[0].split('h')[0]);
        let minute = Number(timeframe[1].split('min')[0]);
        time = (hour * 60) + minute;
    }

    return time;
}

async function main() {
    const stream = fs.createWriteStream(FILENAME, { flags: 'a' });
    stream.write(`[\n`);

    try {
        const length = result_file.length; 
        for (let idx = 0; idx < length; idx++) {
            const item = result_file[idx];
            const data = await request(item);
            const url = getAudioUrlFromHtml(data);
            
            const episode = {
                page_url: item.url,
                audio_url: url,
                date: item.date,
                length: getFormatedLength(item.length),
                title: item.title,
                description: item.description
            }
            stream.write(`\t${JSON.stringify(episode)},\n`);

            const progress = Number((idx / length) * 100).toFixed(2);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(progress + '%');
        }
        
        console.log('\n');
    } catch (err) {
        stream.end();
        throw err;
    }

    stream.write(`]`);
    stream.end();
    console.log('Completed!');
}

main();