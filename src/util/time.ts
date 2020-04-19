import {getDate, pad} from '../logging/logging';

export function createTimeStamp(): string {
    const d = getDate();
    return `${d.month}-${d.day}-${d.year}-${pad(d.hrs)}:${pad(d.mins)}:${pad(d.secs)}`;
}
