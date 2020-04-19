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
            isLegendary: false,
            links: []
        });
    });

    it("Should distinquish history road bits with no timecode", () => {
        const result = parseFile("content/history-road.html");
        expect(result.bits.length).to.equal(5);
        const distinct = result.bits.filter((b: ParseBitData) => {
            return b.isHistoryRoad
        });
        expect(distinct.length).to.equal(3);
        distinct.forEach((b) => {
            expect(b.timeCd).to.be.null;
        });
    });

    it("Should distinquish history road bits with a timecode", () => {
        const result = parseFile("content/history-road-timecode.html");
        expect(result.bits.length).to.equal(7);
        const distinct = result.bits.filter((b: ParseBitData) => {
            return b.isHistoryRoad
        });
        expect(distinct.length).to.equal(1);
        expect(distinct[0].timeCd).to.eql({
            secs: 0,
            mins: 46,
            hrs: 0
        });
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

    it("Should parse an episode with no BitList", () => {
        const result = parseFile("content/no-bits.html");
        expect(result.episodes.length).to.equal(1);
        expect(result.episodes[0]).to.eql({
            num: 185,
            name: "Greatest Bits - 2019",
            streamLink: "https://art19.com/shows/dynamic-banter/episodes/39e15f10-9d4f-4897-9708-ad46eb17a925"
        });
    });

    it("Should parse a snapshot document and get all episodes sequentially", () => {
        const result = parseFile("content/sample-bit-glossary-4-16-20.html");
        let missing: number[] = [];
        let prev = 0;
        result.episodes.reverse().forEach((e) => {
            const num = e.num;
            if (num != prev + 1) {
                missing.push(prev + 1);
                prev = num;
            } else {
                prev++;
            }
        });
        if (missing.length > 0) {
            expect.fail(`Missing episodes [${missing}]`);
        }
    });

    it("Should parse a snapshot document and find the correct number of episodes", () => {
        const result = parseFile("content/sample-bit-glossary-4-16-20.html");
        expect(result.episodes.length).to.equal(195);
    });

    it("Should extract an attached image from a bit name", () => {
        const result = parseFile("content/image.html");
        expect(result.bits.length).to.equal(1);
        const b = result.bits[0];
        expect(b.links.length).to.equal(1);
        expect(b.links[0]).to.equal("https://i.imgur.com/EKPR66e.png");
        expect(b.name).to.eql("Victorian illustration of kidney stone removal");
    });

});
