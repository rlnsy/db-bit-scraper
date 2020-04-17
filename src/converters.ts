import { ParseData, ParseEpisodeData, ParseBitData } from "./data";
import { Maybe, error, result, Result, Error } from "./result";
import * as p5 from 'parse5';

function structuralNodes(n: any) {
    return n.childNodes.filter((n: any) => n.nodeName != '#text');
}

function parseBitFragment(b: any): Maybe<ParseBitData> {
    const children = b.childNodes;
    return error<ParseBitData>('Stub');
}

function isEpisodeFragment(n: any): boolean {
    try {
        if (n.tagName != 'li') {
            return false;
        }
        const children = structuralNodes(n);
        if (children.length != 2) {
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
        const bitList = children[1];
        if (bitList.tagName != 'ul') {
            return false;
        }
        return true;
    }
    catch (err) {
        return false;
    }
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
    return result<EpisodeTitle>({epNum, epName});
}

function parseEpisodeFragment(e: any): Maybe<ParseData> {
    const children = structuralNodes(e);
    const header = children[0];
    const bitList = children[1];
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
    const bitFragments: any[] = structuralNodes(bitList);
    let err: Error<ParseData> | null = null;
    bitFragments.forEach((f: any) => {
        const res = parseBitFragment(f);
        if (res.error) {
            err = error<ParseData>(`Error parsing bit fragment: ${JSON.stringify(res.error)}`);
        } else {
            bits.push(res.success as ParseBitData);
        }
    });
    if (err) {
        return err;
    } else {
        return result<ParseData> ({
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

export function parse (content: string): Maybe<ParseData> {
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
