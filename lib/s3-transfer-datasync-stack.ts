import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as datasync from 'aws-cdk-lib/aws-datasync';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

interface DataSyncStackProps extends StackProps {
  sourceBucket: s3.IBucket;
  destinationBuckets: s3.IBucket[];
}

export class S3TransferDataSyncStack extends Stack {
  constructor(scope: Construct, id: string, props: DataSyncStackProps) {
    super(scope, id, props);

    const role = new iam.Role(this, 'DataSyncRole', {
      assumedBy: new iam.ServicePrincipal('datasync.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')]
    });

    props.destinationBuckets.forEach((destBucket, index) => {
      const srcLoc = new datasync.CfnLocationS3(this, `SrcLoc${index}`, {
        s3BucketArn: props.sourceBucket.bucketArn,
        s3Config: { bucketAccessRoleArn: role.roleArn }
      });

      const destLoc = new datasync.CfnLocationS3(this, `DestLoc${index}`, {
        s3BucketArn: destBucket.bucketArn,
        s3Config: { bucketAccessRoleArn: role.roleArn }
      });

      const task = new datasync.CfnTask(this, `SyncTask${index}`, {
        sourceLocationArn: srcLoc.attrLocationArn,
        destinationLocationArn: destLoc.attrLocationArn,
        name: `sync-task-${index}`,
      });

      const rule = new events.Rule(this, `Rule${index}`, {
        schedule: events.Schedule.rate(Duration.hours(1))
      });

      rule.addTarget(new targets.AwsApi({
        service: 'DataSync',
        action: 'startTaskExecution',
        parameters: {
          TaskArn: task.ref
        }
      }));
    });
  }
}
