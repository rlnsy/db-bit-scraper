import * as fs from 'fs';
import * as path from 'path';

export default function readContent(dir: string, file: string, onError: ((err: any) => void)): string | void {
    const filePath = path.join(dir, file);
    try {
        return fs.readFileSync(
            filePath,
            {encoding: "utf-8"});
    } catch (err) {
        onError(err);
    }
}
