import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class S3TransferMainStack extends Stack {
  public readonly sourceBucket: s3.IBucket;
  public readonly manifestBucket: s3.IBucket;
  public readonly destinationBuckets: s3.IBucket[];

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.sourceBucket = s3.Bucket.fromBucketName(this, 'SourceBucket', 'source-bucket-name');
    this.manifestBucket = s3.Bucket.fromBucketName(this, 'ManifestBucket', 'manifest-bucket');

    this.destinationBuckets = ['dest-bucket-1', 'dest-bucket-2'].map((name, index) =>
      s3.Bucket.fromBucketName(this, `DestBucket${index}`, name)
    );
  }
}
