import {Stack, App, Fn, Duration} from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';

export class BitScraperStack extends Stack {
    constructor(app: App, id: string) {
        super(app, id, {
            description: "Provides core functions for the DBBS",
            stackName: "DBBS-Scraper"
        });
        const externalDependencies = new lambda.LayerVersion(this, 'externDepLayer', {
            code: lambda.Code.fromAsset('layers/extern'),
            compatibleRuntimes: [lambda.Runtime.NODEJS_10_X],
            license: 'Apache-2.0',
            description: 'External dependency layer for DBBS',
        });
        const outputBucket = Fn.importValue('outputBucketName');
        const outputBucketArn = Fn.importValue('outputBucketArn');
        const scraper = new lambda.Function(this, 'bitScraper', {
            code: new lambda.AssetCode('../src'),
            handler: 'web/handler.parseNewWebContent',
            runtime: lambda.Runtime.NODEJS_10_X,
            environment: {
                OUTPUT_BUCKET_NAME: outputBucket,
                DBBS_GLOSSARY_URL: "https://www.reddit.com/r/DynamicBanter/wiki/index/bitglossary"
            },
            layers: [externalDependencies],
            timeout: Duration.seconds(10)
        });
        scraper.role?.addToPolicy(
            new iam.PolicyStatement({
                actions: ['s3:*'],
                resources: [outputBucketArn]
            }));
    }
}
