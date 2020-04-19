import * as cdk from "@aws-cdk/core";

export class BitScraperStack extends cdk.Stack {
    constructor(app: cdk.App, id: string) {
        super(app, id, {
            description: "Provides core functions for the DBBS",
            stackName: "DBBS-Scraper"
        });
    }
}
