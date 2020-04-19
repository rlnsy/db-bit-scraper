import { ParseData, ParseEpisodeData, ParseBitData, BitTimeCode } from "./parse-data";
import { Maybe, error, result, Result, Error } from "../result";
import * as p5 from 'parse5';
import { _, match } from 'jmatch';
import {log, Levels} from '../logging/logging';

function structuralNodes(n: any) {
    return n.childNodes.filter((n: any) => n.nodeName != '#text');
}

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

interface NameContent {
    name: string,
    links: string[]
}

function parseName(n: string): NameContent {
    // TODO modify to extract all links
    let name = n;
    let links: string[] = [];
    const linkFmt = new RegExp("\\s*<a\\s*href=\".+\" rel=\"nofollow\">.+</a>", 's');
    const linkMatch = linkFmt.exec(n);
    if (linkMatch) {
        const linkContent = linkMatch[0];
        match(linkContent, [
            ["<a href=\",1;\" rel=\"nofollow\">,2;</a>",
                (url: string, text: string) => {
                    name = n.replace(linkFmt, text);
                    name = match(name, [
                        ["<strong>,1;</strong>",
                            (bolded) => {
                                return bolded;
                            }],
                        [_, () => { return name; }]
                    ]);
                    links.push(url);
                }]
        ]);
    }
    const cleanName = name.trim().replace(/\s{2,}|\n/, ' ');
    const susChars = new RegExp("<|>");
    if (susChars.exec(cleanName)) {
        log(Levels.WARN, `Computed name "${cleanName}" contains suspicious characters`);
    }
    return { name: cleanName, links };
}

interface PartialBitInfo {
    episode: number,
    rawName: string,
    rawAltName: string | null,
    rawTimeCd: string | null,
    isHistoryRoad: boolean,
    isLegendary: boolean
}

function parsePartialBitInfo(i: PartialBitInfo): Maybe<ParseBitData> {
    const { episode, rawName, rawAltName, rawTimeCd, isHistoryRoad, isLegendary } = i;
    let timeCd: BitTimeCode | null = null;
    if (rawTimeCd != null) {
        const getTime = parseTimeCode(rawTimeCd);
        if (getTime.error) {
            return error<ParseBitData>(JSON.stringify(getTime.error));
        } else {
            timeCd = (getTime as Result<BitTimeCode>).success;
        }
    }
    const {name, links} = parseName(rawName);
    if (rawAltName != null) {
        const altNameInfo = parseName(rawAltName);
        return result<ParseBitData>({
            name, 
            altName: altNameInfo.name,
            episode, timeCd, isHistoryRoad, isLegendary, 
            links: links.concat(altNameInfo.links)
        });
    } else {
        return result<ParseBitData>({
            name, 
            altName: null,
            episode, timeCd, isHistoryRoad, isLegendary, 
            links: links
        });
    }
}

export function parseBitFragment(b: string, episode: number): Maybe<ParseBitData> {
    return match(b, [
        // history road with timecode case
        ["<li><strong>,2;</strong>\\s*<em>HR:</em>,1;</li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName, rawTimeCd,
                    rawAltName: null, 
                    isHistoryRoad: true,
                    isLegendary: false
                });
            }],
        // Lengendary bit format
        ["<li><strong>,2;</strong> <strong>,1;</strong>\\s*</li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName,
                    rawAltName: null, 
                    rawTimeCd,
                    isHistoryRoad: false,
                    isLegendary: true
                });
            }],
        // Lengendary with alternate bit name
        ["<li><strong>,2;</strong> <strong>,1;</strong>\\s*/ ,2;</li>",
            (rawName, rawAltName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName, rawTimeCd,
                    rawAltName,
                    isHistoryRoad: false,
                    isLegendary: true
                });
            }],
        // case where name contains strong tags
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
                                rawAltName: null, 
                                isHistoryRoad: false,
                                isLegendary: true
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
                    rawAltName: null, 
                    isHistoryRoad: false,
                    isLegendary: false
                });
            }],
        // Legendary History Road
        ["<li><em>HR:</em> <strong>,1;</strong></li>",
            (rawName) => {
                return parsePartialBitInfo({
                    episode,
                    rawName,
                    rawTimeCd: null,
                    rawAltName: null, 
                    isHistoryRoad: true,
                    isLegendary: true
                });
            }],
        // Non-Legendary History Road
        ["<li><em>HR:</em> ,1;</li>",
            (rawName) => {
                return parsePartialBitInfo({
                    episode,
                    rawName,
                    rawTimeCd: null,
                    rawAltName: null, 
                    isHistoryRoad: true,
                    isLegendary: false
                });
            }],
        // other history road with timecode case
        ["<li><em>,2; HR:</em>,1;</li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName, rawTimeCd,
                    rawAltName: null, 
                    isHistoryRoad: true,
                    isLegendary: false
                });
            }],
        // Basic bit "lazy" notation
        ["<li>,1;</li>",
            (rawName) => {
                return parsePartialBitInfo({
                    episode,
                    rawName,
                    rawTimeCd: null,
                    rawAltName: null, 
                    isHistoryRoad: false,
                    isLegendary: false
                });
            }],
        // strange malformed case - TODO this could benefit from some new match features
        ["<li><strong>,2;</strong>,1;\n                                </li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName, rawTimeCd,
                    rawAltName: null, 
                    isHistoryRoad: false,
                    isLegendary: true
                });
            }],
        // same here
        ["<li><strong>[00:00:00]</strong> Ending the podcast after \\\"groove is in the\\n                                    heart\\\"</li>",
            (rawName, rawTimeCd) => {
                return parsePartialBitInfo({
                    episode,
                    rawName, rawTimeCd,
                    rawAltName: null, 
                    isHistoryRoad: false,
                    isLegendary: true
                });
            }],
        // Default
        [_, () => {
            return error<ParseBitData>(`Could not match bit content '${b}'`);
        }]
    ]);
}

function isEpisodeFragment(n: any): boolean {
    try {
        if (n.tagName != 'li') {
            return false;
        }
        const children = structuralNodes(n);
        if (children.length < 1) {
            return false;
        }
        const header = children[0];
        if (header.tagName != 'p') {
            return false;
        }
        const link = structuralNodes(header)[0];
        if (link.tagName != 'a') {
            return false;
        }
        if (!link.attrs || !(link.attrs instanceof Array)) {
            return false;
        }
        return true;
    }
    catch (err) {
        return false;
    }
}

function hasBitList(e: any): boolean {
    const children = structuralNodes(e);
    return (children.length == 2) && (children[1].tagName == 'ul');
}

interface EpisodeTitle {
    epNum: number,
    epName: string
}

function parseEpisodeTitle(t: string): Maybe<EpisodeTitle> {
    const numStrMatch = t.match(/Episode [0-9]+/);
    if (!numStrMatch) {
        return error<EpisodeTitle>(`Title '${t}' missing episode number`);
    }
    const epNum = Number((numStrMatch[0].match(/[0-9]+/) as RegExpMatchArray)[0]);
    const nameStrMatch = t.match(/: .+/);
    if (!nameStrMatch) {
        return error<EpisodeTitle>(`Title '${t}' missing episode name`);
    }
    const epName = nameStrMatch[0].substr(2);
    return result<EpisodeTitle>({ epNum, epName });
}

function parseEpisodeFragment(e: any): Maybe<ParseData> {
    const children = structuralNodes(e);
    const header = children[0];
    const bitList = hasBitList(e) ? children[1] : null;
    const link = structuralNodes(header)[0];
    let linkVal: string | null = null;
    link.attrs.forEach((a: any) => {
        if (a.name == 'href') {
            linkVal = a.value;
        }
    });
    let titleText: string | null = null;
    link.childNodes.forEach((n: any) => {
        if (n.nodeName == '#text') {
            titleText = n.value;
        }
    });
    if (titleText == null) {
        return error<ParseData>("Missing episode title");
    }
    const getTitle: Maybe<EpisodeTitle> = parseEpisodeTitle(titleText);
    if (getTitle.error) {
        return error<ParseData>(`Error parsing title: ${JSON.stringify(getTitle.error)}`);
    }
    const title: EpisodeTitle = (getTitle as Result<EpisodeTitle>).success;
    const episodes: ParseEpisodeData[] = [{
        num: title.epNum,
        name: title.epName,
        streamLink: linkVal
    }];
    let bits: ParseBitData[] = [];
    let err: Error<ParseData> | null = null;
    if (bitList) {
        const bitFragments: any[] = structuralNodes(bitList);
        bitFragments.forEach((f: any) => {
            const content = `<li>${p5.serialize(f)}</li>`;
            const res = parseBitFragment(content, title.epNum);
            if (res.error) {
                err = error<ParseData>(`Error parsing bit fragment: ${JSON.stringify(res.error)}`);
            } else {
                bits.push(res.success as ParseBitData);
            }
        });
    }
    if (err) {
        return err;
    } else {
        return result<ParseData>({
            timestamp: null,
            episodes,
            bits
        });
    }
}

function check(n: any): Maybe<ParseData> {
    if (isEpisodeFragment(n)) {
        return parseEpisodeFragment(n);
    } else {
        return result<ParseData>({
            timestamp: null,
            episodes: [],
            bits: []
        });
    }
}

export function parse(content: string): Maybe<ParseData> {
    let episodes: ParseEpisodeData[] = [];
    let bits: ParseBitData[] = [];
    const doc: p5.DefaultTreeDocument = p5.parse(content) as p5.DefaultTreeDocument;
    let nodes: any[] = [doc];
    let cur = null;
    while (nodes.length > 0) {
        cur = nodes.pop();
        const res = check(cur);
        if (res.success) {
            res.success.episodes.forEach((e: ParseEpisodeData) => {
                episodes.push(e);
            });
            res.success.bits.forEach((b: ParseBitData) => {
                bits.push(b);
            });
        } else {
            return res;
        }
        if (cur.childNodes) {
            cur.childNodes.forEach((c: any) => {
                nodes.push(c);
            });
        }
    }
    return result<ParseData>({
        timestamp: null,
        episodes, bits
    });
}
