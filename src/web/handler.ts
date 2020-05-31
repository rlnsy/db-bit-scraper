/**
 * Defines a lambda-compatible wrapper
 * for AWS CDK deployment
 */

import { parse } from '../parse/parse';
import { ParseData } from '../parse/parse-data';
import { Maybe, Result } from '../result';
import {getGlossaryContent} from '../get/get';
import {log, Levels} from '../logging/logging';
import * as AWS from 'aws-sdk';

export const parseNewWebContent = async (event: any = { }): Promise<any> => {
    if (event['invoke_type']) {
        log(Levels.INFO, `Invoked: ${event['invoke_type']}`);
    } else {
        log(Levels.WARN, "No invoke type provided");
    }
    const outputBucket = process.env.OUTPUT_BUCKET_NAME;
    const contentURL = process.env.DBBS_GLOSSARY_URL;
    if (!outputBucket) {
        throw new Error("Missing output bucket name");
    } else if (!contentURL) {
        throw new Error("Missing glossary content URL");
    }
    return getGlossaryContent()
        .then(async (content) => {
            const doParse: Maybe<ParseData> = parse(content);
            if (doParse.error) {
                throw new Error(JSON.stringify(doParse.error));
            } else {
                const output = (doParse as Result<ParseData>).success;
                log(Levels.INFO, "Parsed; Information will be saved in bucket");
                const time: string | null = output.timestamp;
                if (time == null) {
                    throw new Error("Parse output missing timestamp");
                }
                const outputName: string = `parsed-${time as string}.json`;
                const res = await new AWS.S3().putObject({
                    Bucket: outputBucket,
                    Key: outputName,
                    Body: Buffer.from(JSON.stringify(output, null, 2))
                }).promise();
                log(Levels.INFO, res.toString());
                log(Levels.INFO, "Bucket operation completed");
                return {
                    statusCode: 200,
                    message: `Information saved in bucket as ${outputName}`
                };
            }
        });
}
