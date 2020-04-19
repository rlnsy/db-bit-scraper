import { _, match } from 'jmatch';
import {log, Levels} from '../logging/logging';
import { Maybe, error, result, Result } from '../result';
import { BitTimeCode, ParseBitData } from './parse-data';

function parseTimeCode(t: string): Maybe<BitTimeCode> {
    return match(t, [
        ["\\[,3;\\:,2;\\:,1;\\]",
            (secs, mins, hrs) => {
                try {
                    secs = Number(secs);
                    mins = Number(mins);
                    hrs = Number(hrs);
                } catch (err) {
                    return error<BitTimeCode>("Non-numeric types in timecode");
                }
                return result<BitTimeCode>({ secs, mins, hrs });
            }],
        [_, () => {
            return error<BitTimeCode>("Unrecognized timecode format");
        }]
    ]);
}

interface LinksRemoved {
    content: string,
    links: string[]
}

function extractLinks(b: string): LinksRemoved {
    // TODO modify to extract all links
    let content = b;
    const linkFmt = new RegExp("\\s*<a\\s*href=\".+\" rel=\"nofollow\">.+</a>", 's');
    let links: string[] = [];
    const linkMatch = linkFmt.exec(content);
    if (linkMatch) {
        const linkContent = linkMatch[0];
        match(linkContent, [
            ["<a href=\",1;\" rel=\"nofollow\">,2;</a>",
                (url: string, text: string) => {
                    links.push(url);
                    content = content.replace(linkFmt, text);
                }]
        ]);
    }
    return { content, links };
}

function cleanNameContent(name: string): string {
    name = match(name, [
        ["<strong>,1;</strong>",
            (text) => {
                return text;
            }],
        [_, () => { return name; }]
    ]);
    return name.trim().replace(/\s{2,}|\n/, ' ');
}

interface NameContent {
    name: string,
    altName: string | null
}

function parseName(n: string): NameContent {
    let name = n;
    let altName: string | null = null;
    name = match(name, [
        ["\s*,1;\\s+/\\s+,2;", 
            (main, alt) => {
                altName = alt;
                return main;
            }],
        [_, () => { return name; }]
    ]);
    const cleanName = cleanNameContent(name);
    const susChars = new RegExp("<|>");
    if (susChars.exec(cleanName)) {
        log(Levels.WARN, `Computed name "${cleanName}" contains suspicious characters`);
    }
    if (altName != null) {
        const cleanAltName = cleanNameContent(altName as string);
        if (susChars.exec(cleanAltName)) {
            log(Levels.WARN, `Computed alt name "${cleanAltName}" contains suspicious characters`);
        }
        altName = cleanAltName;
    }
    return { name: cleanName, altName };
}

interface PartialBitInfo {
    episode: number,
    rawName: string,
    rawTimeCd: string | null,
    isHistoryRoad: boolean,
    isLegendary: boolean,
    links: string[]
}

function parsePartialBitInfo(i: PartialBitInfo): Maybe<ParseBitData> {
    const { episode, rawName, rawTimeCd, isHistoryRoad, isLegendary, links } = i;
    let timeCd: BitTimeCode | null = null;
    if (rawTimeCd != null) {
        const getTime = parseTimeCode(rawTimeCd);
        if (getTime.error) {
            return error<ParseBitData>(JSON.stringify(getTime.error));
        } else {
            timeCd = (getTime as Result<BitTimeCode>).success;
        }
    }
    const {name, altName} = parseName(rawName);
    return result<ParseBitData>({
        name, 
        altName,
        episode, timeCd, isHistoryRoad, isLegendary, 
        links: links
    });
}

export function parseBitFragment(b: string, episode: number): Maybe<ParseBitData> {
    let {content, links} = extractLinks(b);
    return match(content, [
        // history road with timecode case
        ["<li><strong>,2;</strong>\\s*<em>HR:</em>,1;</li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName, rawTimeCd,
                    isHistoryRoad: true,
                    isLegendary: false,
                    links
                });
            }],
        // Lengendary bit format
        ["<li><strong>,2;</strong> <strong>,1;</strong>\\s*</li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName,
                    rawTimeCd,
                    isHistoryRoad: false,
                    isLegendary: true,
                    links
                });
            }],
        //case where name contains strong tags
        ["<li><strong>,1;</strong>\\s*.*<strong>.*</strong>.*</li>",
            (rawTimeCd) => {
                const noTimeCd = b.replace(
                    new RegExp(`<strong>${
                        rawTimeCd.replace('[', '\\[').replace(']', '\\]')
                    }</strong>`, 'g'), '');
                return match(noTimeCd, [
                    ["<li>,1;</li>", 
                        (rawName) => {
                            return parsePartialBitInfo({
                                episode,
                                rawName, rawTimeCd,
                                isHistoryRoad: false,
                                isLegendary: true,
                                links
                            });
                        }]
                    ]);
            }],
        // Regular bit
        ["<li><strong>,2;</strong>\\s*,1;</li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName, rawTimeCd,
                    isHistoryRoad: false,
                    isLegendary: false,
                    links
                });
            }],
        // Legendary History Road
        ["<li><em>HR:</em> <strong>,1;</strong></li>",
            (rawName) => {
                return parsePartialBitInfo({
                    episode,
                    rawName,
                    rawTimeCd: null,
                    isHistoryRoad: true,
                    isLegendary: true,
                    links
                });
            }],
        // Non-Legendary History Road
        ["<li><em>HR:</em>\\s*,1;</li>",
            (rawName) => {
                return parsePartialBitInfo({
                    episode,
                    rawName,
                    rawTimeCd: null,
                    isHistoryRoad: true,
                    isLegendary: false,
                    links
                });
            }],
        // other history road with timecode case
        ["<li><em>,2; HR:</em>,1;</li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName, rawTimeCd,
                    isHistoryRoad: true,
                    isLegendary: false,
                    links
                });
            }],
        // Basic bit "lazy" notation
        ["<li>,1;</li>",
            (rawName) => {
                return parsePartialBitInfo({
                    episode,
                    rawName,
                    rawTimeCd: null,
                    isHistoryRoad: false,
                    isLegendary: false,
                    links
                });
            }],
        // strange malformed case - TODO this could benefit from some new match features
        ["<li><strong>,2;</strong>,1;\n                                </li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName, rawTimeCd,
                    isHistoryRoad: false,
                    isLegendary: true,
                    links
                });
            }],
        // same here
        ["<li><strong>[00:00:00]</strong> Ending the podcast after \\\"groove is in the\\n                                    heart\\\"</li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName, rawTimeCd,
                    isHistoryRoad: false,
                    isLegendary: true,
                    links
                });
            }],
        // Default
        [_, () => {
            return error<ParseBitData>(`Could not match bit content '${b}'`);
        }]
    ]);
}
