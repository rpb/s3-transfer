import { S3ControlClient, CreateJobCommand } from "@aws-sdk/client-s3-control";
import { S3 } from "@aws-sdk/client-s3";

export const handler = async () => {
  const client = new S3ControlClient({ region: process.env.AWS_REGION });

  const manifestS3 = new S3({});
  const etagRes = await manifestS3.headObject({
    Bucket: process.env.MANIFEST_BUCKET!,
    Key: process.env.MANIFEST_KEY!
  });

  const etag = etagRes.ETag?.replace(/"/g, '');

  const createJobCmd = new CreateJobCommand({
    AccountId: process.env.ACCOUNT_ID!,
    ConfirmationRequired: false,
    Manifest: {
      Spec: {
        Format: 'S3BatchOperations_CSV_20180820',
        Fields: ['Bucket', 'Key']
      },
      Location: {
        ObjectArn: `arn:aws:s3:::${process.env.MANIFEST_BUCKET}/${process.env.MANIFEST_KEY}`,
        ETag: etag!
      }
    },
    Operation: {
      S3PutObjectCopy: {
        TargetResource: `arn:aws:s3:::${process.env.DEST_BUCKET}`
      }
    },
    Priority: 10,
    RoleArn: process.env.ROLE_ARN!,
    Report: {
      Enabled: true,
      Bucket: `arn:aws:s3:::${process.env.DEST_BUCKET}`,
      Prefix: 'batch-report/',
      Format: 'Report_CSV_20180820'
    }
  });

  const result = await client.send(createJobCmd);
  return { PhysicalResourceId: result.JobId };
};
