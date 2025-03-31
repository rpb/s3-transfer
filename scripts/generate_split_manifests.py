import boto3
import csv
from collections import defaultdict

# Configuration
SOURCE_BUCKET = 'your-source-bucket-name'
MANIFEST_BUCKET = 'your-manifest-bucket-name'
REGION = 'us-west-2'
PREFIXES_TO_BUCKETS = {
    'logs/': 'destination-bucket-logs',
    'images/': 'destination-bucket-images',
    'data/': 'destination-bucket-data',
    # Add more prefix to bucket mappings as needed
}
MANIFEST_OUTPUT_DIR = 'split_manifests'
S3_MANIFEST_PREFIX = 'manifests/'  # where to upload in the manifest bucket

s3 = boto3.client('s3', region_name=REGION)

def list_all_objects(bucket):
    paginator = s3.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get('Contents', []):
            yield obj['Key']

def determine_target_bucket(key):
    for prefix, bucket in PREFIXES_TO_BUCKETS.items():
        if key.startswith(prefix):
            return bucket
    return None  # Skip keys that don't match any prefix

def generate_split_manifests():
    manifest_data = defaultdict(list)
    for key in list_all_objects(SOURCE_BUCKET):
        dest_bucket = determine_target_bucket(key)
        if dest_bucket:
            manifest_data[dest_bucket].append((SOURCE_BUCKET, key))

    os.makedirs(MANIFEST_OUTPUT_DIR, exist_ok=True)

    for dest_bucket, entries in manifest_data.items():
        filename = f"{MANIFEST_OUTPUT_DIR}/manifest_{dest_bucket}.csv"
        with open(filename, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerows(entries)
        print(f"✅ Wrote manifest: {filename}")
        upload_path = f"{S3_MANIFEST_PREFIX}manifest_{dest_bucket}.csv"
        s3.upload_file(filename, MANIFEST_BUCKET, upload_path)
        etag = s3.head_object(Bucket=MANIFEST_BUCKET, Key=upload_path)['ETag'].strip('"')
        print(f"📤 Uploaded to s3://{MANIFEST_BUCKET}/{upload_path} (ETag: {etag})")

if __name__ == "__main__":
    import os
    generate_split_manifests()
