/**
 * Logging tools
 */

export const enum Levels {
    INFO = "INFO",
    WARN = "WARN",
    CRIT = "CRIT"
}

export interface LogDate {
    month: number,
    day: number,
    year: number,
    hrs: number,
    mins: number,
    secs: number
}

export function getDate(): LogDate {
    const date = new Date();
    return {
        month: date.getMonth(),
        day: date.getDate(),
        year: date.getFullYear(),
        hrs: date.getHours(),
        mins: date.getMinutes(),
        secs: date.getSeconds()
    }
}

function pad(timeQ: number): string {
    return timeQ.toString().padStart(2, '0');
}

export function formatDate(): string {
    const d = getDate();
    return `[${d.month}-${d.day}-${d.year} ` +
            `| ${pad(d.hrs)}:${pad(d.mins)}:${pad(d.secs)}]`;
}

function formatLevel(l: Levels): string {
    return `[${l}]`;
}

export function log(level: Levels, msg: string): void {
    console.log(`${formatDate()} ${formatLevel(level)} ${msg}`);
}
