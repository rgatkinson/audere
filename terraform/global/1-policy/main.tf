// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  version = "~> 1.50"
  region  = "us-west-2"
}

terraform {
  backend "s3" {
    bucket = "global-terraform.auderenow.io"
    key = "policy/terraform.state"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "tfstate" {
  backend = "s3"
  config {
    bucket = "global-terraform.auderenow.io"
    key = "tfstate/terraform.state"
    region = "us-west-2"
  }
}

// --------------------------------------------------------------------------------
// General config

module "config" {
  source = "../../modules/vpc-config"
}

// --------------------------------------------------------------------------------
// Group policies

module "groups" {
  source = "../../modules/group-policy"
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

// --------------------------------------------------------------------------------
// Initial Network Configs with flow logs

resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}

resource "aws_flow_log" "default_vpc_flow_log" {
  iam_role_arn    = "${aws_iam_role.vpc_flow_log_role.arn}"
  log_destination = "${aws_cloudwatch_log_group.vpc_flow_log.arn}"
  traffic_type    = "ALL"
  vpc_id          = "${aws_default_vpc.default.id}"
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name = "VPCFlowLogs"
}

data "aws_iam_policy_document" "vpc_flow_log_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "vpc_flow_log_role" {
  name = "VPCFlowLogRole"

  assume_role_policy = "${data.aws_iam_policy_document.vpc_flow_log_role_policy.json}"
}

data "aws_iam_policy_document" "logs_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "logs_role_policy" {
  name = "LogsRolePolicy"
  role = "${aws_iam_role.vpc_flow_log_role.id}"

  policy = "${data.aws_iam_policy_document.logs_policy.json}"
}

// --------------------------------------------------------------------------------
// ECS service role

resource "aws_iam_service_linked_role" "ecs_service_linked_role" {
  aws_service_name = "ecs.amazonaws.com"
  description = "Role to enable Amazon ECS service."
}

// --------------------------------------------------------------------------------
// To set an encrypted parameter in SSM:
//
// 1) Put the parameter value in a file (e.g. slack-hook-url.txt)
// 2) Generate encrypted blob via `aws`:
//      aws kms encrypt --key-id alias/ssm-parameters --plaintext fileb://./slack-hook-url.txt --output text --query CiphertextBlob
// 3) Add the value as a parameter in AWS Systems Manager
//      E.g. at https://us-west-2.console.aws.amazon.com/systems-manager/parameters?region=us-west-2
//      create parameter `slack-hook-url` with the value from step 2.
//
// Well-known parameters (these should be added after applying global and before
// applying anything else):
// * slack-hook-url: create a Slack app and generate an incoming webhook url
//
// This supports round-tripping the encrypted data to code that expects to decrypt an environment variable.
// For code that supports SecureString directly, you can just create a SecureString in SSM.

resource "aws_kms_key" "ssm_parameters" {
  description = "Key for encrypting secrets stored as SSM parameters."
}

resource "aws_kms_alias" "ssm_parameters" {
  name = "alias/ssm-parameters"
  target_key_id = "${aws_kms_key.ssm_parameters.key_id}"
}
