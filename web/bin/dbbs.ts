import * as cdk from '@aws-cdk/core';
import {BitScraperStack} from "../lib/bit-scraper-stack";
import {StorageStack} from "../lib/storage-stack";

/**
 * Define the stacks making up the app
 * ids here are meant to provide uniqueness
 * in the context of the project only,
 * and should be overridden to something
 * more descriptive within the actual stack
 * definition.
 */
const app = new cdk.App();
new BitScraperStack(app, 'scraper');
new StorageStack(app, "storage");
