/**
 * Information schema
 */

export interface BitTimeCode {
    secs: number,
    mins: number,
    hrs: number
}

export interface ParseBitData {
    name: string,
    episode: number,
    timeCd: BitTimeCode | null,
    isHistoryRoad: boolean,
    isLegendary: boolean
};

export interface ParseEpisodeData {
    num: number,
    name: string,
    streamLink: string | null;
};

export interface ParseData {
    timestamp: string | null,
    episodes: ParseEpisodeData[],
    bits: ParseBitData[]
};
