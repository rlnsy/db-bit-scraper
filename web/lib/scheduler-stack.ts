import {Stack, App, Fn, Duration} from '@aws-cdk/core';
import {Rule, Schedule} from '@aws-cdk/aws-events';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import * as lambda from '@aws-cdk/aws-lambda';

export class SchedulerStack extends Stack {
    constructor(app: App, id: string) {
        super(app, id, {
            description: "Scheduling for the DBBS stack",
            stackName: "DBBS-Scheduler"
        });
        const scraperFunction = lambda.Function.fromFunctionArn(this,
            'scraperFunction',
            Fn.importValue('scraperFunctionArn'));
        const invoke = new LambdaFunction(scraperFunction);
        const scheduler = new Rule(this, 'DBBS-Scraper-Schedule', {
            description: "Runs DBBS scraper function on a constant interval",
            enabled: true,
            schedule: Schedule.rate(Duration.hours(12)),
            targets: [invoke]
        });
    }
}