import { Stack, StackProps, CustomResource, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';

interface BatchStackProps extends StackProps {
  manifestBucket: s3.IBucket;
  manifestKey: string;
  destinationBucket: s3.IBucket;
  accountId: string;
}

export class S3TransferBatchStack extends Stack {
  constructor(scope: Construct, id: string, props: BatchStackProps) {
    super(scope, id, props);

    const batchRole = new iam.Role(this, 'BatchRole', {
      assumedBy: new iam.ServicePrincipal('batchoperations.s3.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
      ]
    });

    const triggerFunc = new lambda.Function(this, 'TriggerBatchLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      handler: 'trigger-batch.handler',
      timeout: Duration.minutes(5),
      environment: {
        ROLE_ARN: batchRole.roleArn,
        MANIFEST_BUCKET: props.manifestBucket.bucketName,
        MANIFEST_KEY: props.manifestKey,
        DEST_BUCKET: props.destinationBucket.bucketName,
        ACCOUNT_ID: props.accountId
      }
    });

    props.manifestBucket.grantRead(triggerFunc);
    props.destinationBucket.grantReadWrite(triggerFunc);
    batchRole.grantPassRole(triggerFunc);

    new CustomResource(this, 'TriggerBatchJob', {
      serviceToken: triggerFunc.functionArn
    });
  }
}
