#!/usr/bin/env node

import { parse } from '../src/parse/parse';
import { ParseData } from '../src/parse/parse-data';
import { Maybe, Result } from '../src/result';
import {getGlossaryContent} from '../src/get/get';
import {log, Levels} from '../src/logging/logging';
import {parseNewWebContent} from '../src/web/handler';

const execute = (content: string) => {
    const doParse: Maybe<ParseData> = parse(content);
    if (doParse.error) {
        throw new Error(JSON.stringify(doParse.error));
    } else {
        const output = (doParse as Result<ParseData>).success;
        log(Levels.INFO, "Parsed; Information will be sent via stdout");
        console.log(JSON.stringify(output, null, 2));
        log(Levels.INFO, "Done.");
        process.exit();
    }
}

const args = process.argv;
const flag = args[2];

process.env.DBBS_GLOSSARY_URL = "https://www.reddit.com/r/DynamicBanter/wiki/index/bitglossary";

if (flag == "--get") {
    getGlossaryContent()
        .then((content) => {
            execute(content);
        });
} else if (flag == "--test-lambda") {
    if (args.length < 4) {
        throw new Error("Missing argument for output bucket");
    } else {
        process.env.OUTPUT_BUCKET_NAME = args[3];
        parseNewWebContent()
        .then((result) => {
            console.log(result);
            process.exit();
        });
    }
}

const input = process.stdin;
const data: any[] = [];
input.resume();
input.setEncoding('utf8');
input.on('data', (d) => {
    data.push(d);
});
input.on('end', () => {
    const content = data.join();
    execute(content);
});
