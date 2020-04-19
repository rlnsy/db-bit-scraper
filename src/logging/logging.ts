/**
 * Logging tools
 */

 import * as chalk from 'chalk';

export const enum Levels {
    INFO = "Info",
    WARN = "Warning",
    CRIT = "Error"
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
    const date = `${d.month}-${d.day}-${d.year}`;
    const time = `${pad(d.hrs)}:${pad(d.mins)}:${pad(d.secs)}`
    return `[${chalk.stderr.blueBright(date)} | ${chalk.stderr.blueBright(time)}]`;
}

function formatLevel(l: Levels): string {
    let color = null;
    switch (l) {
        case Levels.INFO:
            color = chalk.stderr.blueBright;
            break;
        case Levels.WARN:
            color = chalk.stderr.yellowBright;
            break;
        case Levels.INFO:
            color = chalk.stderr.redBright;
            break;
        default:
            color = chalk.stderr.whiteBright;
    }
    return `[${`${color(l)}`}]`;
}

export function log(level: Levels, msg: string): void {
    process.stderr.write(`${formatDate()} ${formatLevel(level)} ${msg}\n`);
}
