import boto3
import csv

SOURCE_BUCKET = 'your-source-bucket-name'
MANIFEST_BUCKET = 'your-manifest-bucket-name'
MANIFEST_KEY = 'manifests/my-job-manifest.csv'
REGION = 'us-west-2'  # Change as needed
PREFIX = ''  # Optional: limit to a prefix like 'archive/2023/'

s3 = boto3.client('s3', region_name=REGION)

def list_all_objects(bucket, prefix=''):
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get('Contents', []):
            yield obj['Key']

def generate_manifest_file(local_filename):
    with open(local_filename, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        for key in list_all_objects(SOURCE_BUCKET, PREFIX):
            writer.writerow([SOURCE_BUCKET, key])
    print(f"✅ Manifest file written to: {local_filename}")

def upload_and_get_etag(local_filename):
    s3.upload_file(local_filename, MANIFEST_BUCKET, MANIFEST_KEY)
    response = s3.head_object(Bucket=MANIFEST_BUCKET, Key=MANIFEST_KEY)
    etag = response['ETag'].strip('"')
    print(f"✅ Manifest uploaded to s3://{MANIFEST_BUCKET}/{MANIFEST_KEY}")
    print(f"📎 Manifest ETag: {etag}")
    return etag

if __name__ == "__main__":
    manifest_file = 'manifest.csv'
    generate_manifest_file(manifest_file)
    etag = upload_and_get_etag(manifest_file)
