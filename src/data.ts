/**
 * Information schema
 */

export interface ParseBitData {
    name: string,
    episode: number,
    timeCdSec: number,
    timeCdMin: number,
    timeCdHrs: number,
    isHistoryRoad: boolean,
    isLegendary: boolean
};

export interface ParseEpisodeData {
    num: number,
    name: string,
    streamLink: string
};

export interface ParseData {
    timestamp: string,
    episodes: ParseEpisodeData[],
    bits: ParseBitData[]
};
