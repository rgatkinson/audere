// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  version                 = "~> 1.50"
  region                  = "us-west-2"
}

// --------------------------------------------------------------------------------
// CloudTrail S3 events logging

resource "aws_cloudtrail" "cloudtrail-s3-events" {
  name                          = "cloudtrail-s3-events"
  s3_bucket_name                = "${aws_s3_bucket.audere-cloudtrail-s3-logs.id}"
  include_global_service_events = true
  enable_logging                = true
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]
    }
  }

  depends_on = ["aws_s3_bucket_policy.cloudtrail-s3"]
}

resource "aws_s3_bucket" "audere-cloudtrail-s3-logs" {
  bucket        = "audere-cloudtrail-s3-logs"
  force_destroy = true
}

data "aws_iam_policy_document" "allow-cloudtrail-s3" {
  statement {
    sid       = "AWSCloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = ["arn:aws:s3:::audere-cloudtrail-s3-logs"]

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }

  statement {
    sid       = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::audere-cloudtrail-s3-logs/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail-s3" {
  bucket = "${aws_s3_bucket.audere-cloudtrail-s3-logs.id}"
  policy = "${data.aws_iam_policy_document.allow-cloudtrail-s3.json}"
}
