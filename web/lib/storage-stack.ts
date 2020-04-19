import * as cdk from "@aws-cdk/core";
import * as s3 from '@aws-cdk/aws-s3';
import {genUUID} from "../util/uuid";

export class StorageStack extends cdk.Stack {
    constructor(app: cdk.App, id: string) {

        super(app, id, {
            description: "Storage infrastructure for DBBS",
            stackName: "DBBS-Storage"
        });

        const prependAppName = (name: string): string => {
            return `${this.stackName.toLowerCase()}-${name}`;
        }

        /*
         * A bucket to store JSON scraper output
         */
        const outputBucket: s3.Bucket = new s3.Bucket(this, 'scraper-output', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            bucketName: `${prependAppName(genUUID())}`,
        });
        const outputBucketARNKey = 'outputBucketArn';
        new cdk.CfnOutput(this, outputBucketARNKey, {
            value: outputBucket.bucketArn,
            exportName: outputBucketARNKey
        });
        const outputBucketNameKey = 'outputBucketName';
        new cdk.CfnOutput(this, outputBucketNameKey, {
          value: outputBucket.bucketName,
          exportName: outputBucketNameKey
        });

    }
}
