// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.


// --------------------------------------------------------------------------------
// CloudTrail S3 events logging

resource "aws_cloudtrail" "cloudtrail-s3-events" {
  name = "cloudtrail-s3-events"
  s3_bucket_name = "${aws_s3_bucket.cloudtrail-s3-events.id}"
  include_global_service_events = true
  enable_logging = true
  enable_log_file_validation = true

  event_selector {
    read_write_type = "All"
    include_management_events = true

    data_resource {
      type = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]
    }
  }
}

resource "aws_s3_bucket" "cloudtrail-s3-events" {
  bucket = "cloudtrail-s3-events"
  force_destroy = true

  policy = "${aws_iam_policy.cloudtrail-s3-events-policy.id}"
}

data "aws_iam_policy_document" "cloudtrail-s3-events-policy" {

  statement {
    sid = "AWSCloudTrailAclCheck"
    effect = "Allow"
    principals {
      type = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = [
      "s3:GetBucketAcl",
    ]
    resources = [
      "arn:aws:s3:::cloudtrail-s3-events",
    ]
  }

  statement {
    sid = "AWSCloudTrailWrite"
    effect = "Allow"
    principals {
      type = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = [
      "s3:PutObject",
    ]
    resources = [
      "arn:aws:s3:::cloudtrail-s3-events/*",
    ]
    condition {
      test = "StringEquals"
      variable = "s3:x-amz-acl"
      values = [
        "bucket-owner-full-control",
      ]
    }
  }
}

resource "aws_iam_policy" "cloudtrail-s3-events-policy" {
  name   = "cloudtrail-s3-events-policy"
  path   = "/"
  policy = "${data.aws_iam_policy_document.cloudtrail-s3-events-policy.json}"
}
