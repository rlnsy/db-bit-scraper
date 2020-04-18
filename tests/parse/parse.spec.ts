import { expect } from 'chai';
import 'mocha';
import {parse} from '../../src/parse/parse';
import { ParseData, ParseBitData } from '../../src/parse/parse-data';
import { Maybe, Result } from '../../src/result';
import readContent from '../util/../../util/read';

function parseFile(file: string, allowError = false): ParseData {
    const content: string = (readContent(__dirname, file, () => {
        expect.fail("Could not load content file");
    }) as string);
    const res: Maybe<ParseData> = parse(content);
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
        expect(result.bits[1]).to.eql({
            name: "Aerosmith is late for the show",
            episode: 1,
            timeCd: {
                secs: 30,
                mins: 50,
                hrs: 0,
            },
            isHistoryRoad: false,
            isLegendary: false
        });
    });

    it("Should distinquish history road bits", () => {
        const result = parseFile("content/history-road.html");
        expect(result.bits.length).to.equal(5);
        const distinct = result.bits.filter((b: ParseBitData) => {
            return b.isHistoryRoad
        });
        expect(distinct.length).to.equal(3);
    });

    it("Should distinquish legendary bits", () => {
        const result = parseFile("content/legendary.html");
        expect(result.bits.length).to.equal(5);
        const distinct = result.bits.filter((b: ParseBitData) => {
            return b.isLegendary
        });
        expect(distinct.length).to.equal(1);
    });

    it("Should distinquish legendary history road bits", () => {
        const result = parseFile("content/legendary-history-road.html");
        expect(result.bits.length).to.equal(2);
        const distinct = result.bits.filter((b: ParseBitData) => {
            return b.isLegendary && b.isHistoryRoad
        });
        expect(distinct.length).to.equal(1);
    });

    it("Should parse a single episode", () => {
        const result = parseFile("content/basic.html");
        expect(result.episodes.length).to.equal(1);
        expect(result.episodes[0]).to.eql({
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

    it("Should parse a snapshot document and find the correct number of episodes", () => {
        const result = parseFile("content/sample-bit-glossary-4-16-20.html");
        expect(result.episodes.length).to.equal(195);
    });

});
