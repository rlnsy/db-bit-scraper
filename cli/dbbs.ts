#!/usr/bin/env node

import { parse } from '../src/parse/parse';
import { ParseData } from '../src/parse/parse-data';
import { Maybe, Result } from '../src/result';

const input = process.stdin;
const data: any[] = [];
input.resume();
input.setEncoding('utf8');
input.on('data', (d) => {
    data.push(d);
});
input.on('end', () => {
    const content = data.join();
    const doParse: Maybe<ParseData> = parse(content);
    if (doParse.error) {
        throw new Error(JSON.stringify(doParse.error));
    } else {
        const output = (doParse as Result<ParseData>).success;
        console.log(JSON.stringify(output, null, 2));
    }
});
