#!/usr/bin/env python3
# Copyright (c) 2018 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

import os
import boto3
import json
from botocore.exceptions import ClientError
from os.path import join as pjoin

def update_archive(event, context):
  region = os.environ['REGION']
  rds_name = os.environ['RDS_NAME']
  s3_bucket = os.environ['S3_BUCKET']
  s3_prefix = os.environ['S3_PREFIX']
  rds = boto3.client('rds', region_name=region)
  s3 = boto3.client('s3', region_name=region)

  print(f"head_bucket '{s3_bucket}'")
  s3.head_bucket(Bucket=s3_bucket)

  def has_changes(log, s3_path):
    data = s3.list_objects_v2(Bucket=s3_bucket, Prefix=s3_path)
    if 'Contents' in data:
      for s3_item in data['Contents']:
        print(f"  found '{s3_item['Key']}")
        if s3_item['Key'] == s3_path:
          s3_timestamp_raw = s3_item['LastModified']
          s3_timestamp = s3_timestamp_raw.timestamp()
          db_timestamp = log['LastWritten'] / 1000
          print(f"    dblog size: {log['Size']} time: {db_timestamp}")
          print(f"    s3log size: {s3_item['Size']} time: {s3_timestamp} (raw: {s3_timestamp_raw})")
          result = log['Size'] != s3_item['Size'] or db_timestamp > s3_timestamp
          print(f"  returning {result}")
          return result
    print(f"  did not find key, returning True")
    return True

  log_files = rds.describe_db_log_files(DBInstanceIdentifier=rds_name)
  for log_desc in log_files['DescribeDBLogFiles']:
    print('===')
    log_name = log_desc['LogFileName']
    print(f"log file name: '{log_name}'")
    s3_path = pjoin(s3_prefix, log_name)
    print(f"s3 path: '{s3_path}'")

    if not has_changes(log_desc, s3_path):
      continue

    def get_portion(marker):
      print(f"get_portion reading chunk '{marker}'")
      return rds.download_db_log_file_portion(
        DBInstanceIdentifier=rds_name,
        LogFileName=log_name,
        Marker=marker
      )

    portion = get_portion('0')
    data = portion['LogFileData']
    while portion['AdditionalDataPending']:
      print('  ..not done yet')
      portion = get_portion(portion['Marker'])
      print('  ..appending')
      data += portion['LogFileData']
    data_bytes = str.encode(data)

    print(f"writing {len(data_bytes)} bytes")

    s3.put_object(
      Bucket=s3_bucket,
      Key=s3_path,
      ServerSideEncryption='aws:kms',
      Body=data_bytes,
      ACL='bucket-owner-full-control'
    )
    print("Done")
