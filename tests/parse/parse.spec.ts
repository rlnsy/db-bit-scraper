import { expect } from 'chai';
import 'mocha';
import * as fs from 'fs';
import * as path from 'path';
import {parse} from '../../src/converters';
import { ParseData, ParseBitData } from '../../src/data';
import { Maybe, Result } from '../../src/result';

function readContent(file: string): string {
    const filePath = path.join(__dirname, file);
    try {
        return fs.readFileSync(
            filePath,
            {encoding: "utf-8"});
    } catch (err) {
        expect.fail("Could not load content file");
    }
}

function parseFile(file: string, allowError = false): ParseData {
    const res: Maybe<ParseData> = parse(readContent(file));
    if (res.error) {
        expect.fail(`Failed happy parse path: \n ${JSON.stringify(res.error)}`);
    } else {
        return (res as Result<ParseData>).success
    }
}

describe("Parse function", () => {

    it("Should parse basic bit entries", () => {
        const result = parseFile("content/basic.html");
        expect(result.bits.length).to.equal(3);
        expect(result.bits).to.contain({
            name: "Aerosmith is late for the show",
            episode: 1,
            timeCdSec: 0,
            timeCdMin: 5,
            timeCdHrs: 0,
            isHistoryRoad: false,
            isLegendary: false
        });
    });

    it("Should distinquish history road bits", () => {
        const result = parseFile("content/history-road.html");
        expect(result.bits.length).to.equal(5);
        const distinct = result.bits.filter((b: ParseBitData) => {
            b.isHistoryRoad
        });
        expect(distinct.length).to.equal(3);
    });

    it("Should distinquish legendary bits", () => {
        const result = parseFile("content/legendary.html");
        expect(result.bits.length).to.equal(5);
        const distinct = result.bits.filter((b: ParseBitData) => {
            b.isLegendary
        });
        expect(distinct.length).to.equal(1);
    });

    it("Should distinquish legendary history road bits", () => {
        const result = parseFile("content/legendary-history-road.html");
        expect(result.bits.length).to.equal(2);
        const distinct = result.bits.filter((b: ParseBitData) => {
            b.isLegendary && b.isHistoryRoad
        });
        expect(distinct.length).to.equal(1);
    });

    it("Should parse a single episode", () => {
        const result = parseFile("content/basic.html");
        expect(result.episodes.length).to.equal(1);
        expect(result.episodes[0]).to.equal({
            num: 1,
            name: "History Road",
            streamLink: "https://art19.com/shows/dynamic-banter/episodes/30eb876f-e279-4f95-824f-6d6a27d13217"
        });
    });

    it("Should parse multiple episodes and distinquish which bits are in each", () => {
        const result = parseFile("content/multiple-episodes.html");
        expect(result.episodes.length).to.equal(2);
        let foundEp1: boolean, foundEp2: boolean = false;
        result.bits.forEach((bit: ParseBitData) => {
            if (bit.name == "Recording the podcast in bars") {
                expect(bit.episode).to.equal(1);
                foundEp1 = true;
            } else if (bit.name == "Airplane tall person") {
                expect(bit.episode).to.equal(2);
                foundEp2 = true;
            }
        });
    });

});
