#!/usr/bin/env python3
# Copyright (c) 2018 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

import boto3
import json
from botocore.exceptions import ClientError
from os.path import join as pjoin

def lambda_handler(event, context):
  region = '${availability_zone}'
  rds_name = '${db_name}'
  s3_bucket = '${s3_bucket}'
  s3_prefix = '${s3_prefix}'

  rds = boto3.client('rds', region_name=region)
  s3 = boto3.client('s3', region_name=region)
  print(f"Checking access on s3 bucket '{s3_bucket}'")
  s3.head_bucket(Bucket=s3_bucket)

  def has_changes(log, s3_path):
    print('has_changes')
    data = s3.list_objects_v2(Bucket=s3_bucket, Prefix=s3_path)
    for s3_item in data['Contents']:
      print(f"  listed s3 key '{s3_item['Key']}")
      if s3_item['Key'] == s3_path:
        print(f"    log size: {log['Size']}")
        print(f"    log timestamp: {log['LastWritten']}")
        print(f"    s3 size: {s3_item['Size']}")
        print(f"    s3 modified: {s3_item['LastModified']} (timestamp: {s3_item['LastModified'].timestamp()})")
        result = (
          log['Size'] != s3_item['Size']
          or log['LastWritten'] > s3_item['LastModified'].timestamp()
        )
        print(f"  returning {result}")
        return result
    print(f"  did not find entry, returning True")
    return True

  log_files = rds.describe_db_log_files(DBInstanceIdentifier=rds_name)
  for log_desc in log_files['DescribeDBLogFiles']:
    print('==== Checking log file ====')
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

    print(f"writing data")
    print(f"  bucket: '{s3_bucket}'")
    print(f"  path: '{s3_path}'")
    print(f"  size: {len(data_bytes)}")

    s3.put_object(
      Bucket=s3_bucket,
      Key=s3_path,
      ServerSideEncryption='aws:kms',
      Body=data_bytes
    )
    print("Done")


# def is404(response):
#   return http_code(response) == 404

# def http_code(response):
#   return int(response['ResponseMetadata']['HTTPStatusCode'])

# def error_message(e, desc):
#   return f"Error: {desc}: '{e.response['Error']['Message']}'"


  # try:
  #   response = s3.head_bucket(Bucket=s3_bucket)
  # except ClientError as e:
  #   if is404(e.response):
  #     return error_message(e, f"bucket '{s3_bucket}' not found")
  #   else:
  #     return error_message(e, f"cannot access bucket '{s3_bucket}'")

  # try:
  #   response = s3.get_object(Bucket=s3_bucket)
  # except ClientError as e:
  #   if not is404(e.response):
  #     return error_message(e, f"s3.get_object('{s3_bucket}') failed")

  # try:
  #   response = s3.put_object(Bucket=s3_bucket, Key=s3_path, Body=str.encode(data))
  # except ClientError as e:
  #   return error_message(e, f"cannot write to bucket '{s3_bucket}'")
