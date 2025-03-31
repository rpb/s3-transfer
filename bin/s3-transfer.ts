#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { S3TransferMainStack } from '../lib/s3-transfer-main-stack';
import { S3TransferBatchStack } from '../lib/s3-transfer-batch-stack';
import { S3TransferDataSyncStack } from '../lib/s3-transfer-datasync-stack';

const app = new cdk.App();

const mainStack = new S3TransferMainStack(app, 'S3TransferMainStack');

new S3TransferBatchStack(app, 'S3TransferBatchStack', {
  manifestBucket: mainStack.manifestBucket,
  manifestKey: 'manifests/my-job-manifest.csv',
  destinationBucket: mainStack.destinationBuckets[0],
  accountId: app.node.tryGetContext('accountId') || process.env.CDK_DEFAULT_ACCOUNT!,
});

new S3TransferDataSyncStack(app, 'S3TransferDataSyncStack', {
  sourceBucket: mainStack.sourceBucket,
  destinationBuckets: mainStack.destinationBuckets
});
