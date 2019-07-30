// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

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

// --------------------------------------------------------------------------------
// Audere file-share

// To share non-confidential data publicly:
//   aws s3 cp "$LOCAL_PATH" "s3://fileshare.auderenow.io/public/$REMOTE_NAME"
// This makes the data available at:
//   https://s3-us-west-2.amazonaws.com/fileshare.auderenow.io/public/$REMOTE_NAME
// NOTE: anyone who knows the URL can download the data.
//
// To share data with someone for a specific time period:
//   aws s3 cp "$LOCAL_PATH" "s3://fileshare.auderenow.io/presign/$REMOTE_NAME"
//   aws s3 presign "s3://fileshare.auderenow.io/presign/$REMOTE_NAME" --expires-in $(($DAYS * 24 * 3600))
// This will generate a link that is valid for $DAYS days.

resource "aws_s3_bucket" "audere_share" {
  bucket = "fileshare.auderenow.io"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "audere_share" {
  bucket = "${aws_s3_bucket.audere_share.id}"
  policy = "${data.aws_iam_policy_document.audere_share.json}"
}

data "aws_iam_policy_document" "audere_share" {
  statement {
    sid = "ReadOnlyObjectAccessUnderPublic"
    actions = ["s3:GetObject"]
    resources = ["arn:aws:s3:::fileshare.auderenow.io/public/*"]
    principals {
      type = "*"
      identifiers = ["*"]
    }
  }
}

// --------------------------------------------------------------------------------
// Database logs for RDS instances

resource "aws_s3_bucket" "database_log_archive" {
  bucket        = "audere-database-log-archive"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "database_log_archive" {
  bucket = "${aws_s3_bucket.database_log_archive.id}"
  policy = "${data.aws_iam_policy_document.allow_lambda_database_log_archiver.json}"
}

data "aws_iam_policy_document" "allow_lambda_database_log_archiver" {
  statement {
    actions   = [
      "s3:ListBucket",
      "s3:GetBucketAcl",
    ]
    resources = [
      "${aws_s3_bucket.database_log_archive.arn}",
      "${aws_s3_bucket.database_log_archive.arn}/*",
    ]

    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }

  statement {
    actions = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.database_log_archive.arn}/*"]

    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"

      values = [
        "bucket-owner-full-control",
      ]
    }
  }
}
