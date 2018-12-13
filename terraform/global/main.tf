// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  version = "~> 1.50"
  region  = "us-west-2"
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
// Initial Network Configs with flow logs

// TODO: This has to be imported for now. Add the configurations for future separate VPCs here
resource "aws_vpc" "default" {
  cidr_block           = "172.31.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_flow_log" "default_vpc_flow_log" {
  iam_role_arn    = "${aws_iam_role.vpc_flow_log_role.arn}"
  log_destination = "${aws_cloudwatch_log_group.vpc_flow_log.arn}"
  traffic_type    = "ALL"
  vpc_id          = "${aws_vpc.default.id}"
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
// Policies

// ----------------
// infrastructurers

resource "aws_iam_group" "infrastructurers" {
  name = "infrastructurers"
}

resource "aws_iam_group_membership" "infrastructurers" {
  name = "infrastructurers"
  group = "${aws_iam_group.infrastructurers.name}"
  users = [
    "${data.aws_iam_user.mmarucheck.name}",
    "${data.aws_iam_user.ram.name}",
  ]
}

resource "aws_iam_group_policy_attachment" "eks_full_access" {
  group = "${aws_iam_group.infrastructurers.name}"
  policy_arn = "${aws_iam_policy.eks_full_access.arn}"
}

resource "aws_iam_group_policy_attachment" "ses_send_email" {
  group = "${aws_iam_group.infrastructurers.name}"
  policy_arn = "${aws_iam_policy.ses_send_email.arn}"
}

// --------
// securers

resource "aws_iam_group" "securers" {
  name = "securers"
}

resource "aws_iam_group_membership" "securers" {
  name = "securers"
  group = "${aws_iam_group.securers.name}"
  users = [
    "${data.aws_iam_user.mpomarole.name}",
  ]
}

// ----------------
// Policy documents

// ses_send_email
resource "aws_iam_policy" "ses_send_email" {
  name = "SESSendEmail"
  description = "Grant ses:SendEmail and related"
  policy = "${data.aws_iam_policy_document.ses_send_email.json}"
}
data "aws_iam_policy_document" "ses_send_email" {
  statement {
    actions = [
      "ses:SendEmail",
      "ses:VerifyEmailIdentity"
    ]
    resources = ["*"]
    condition = {
      test = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values = ["${local.mfa_condition_value}"]
    }
  }
}

// eks_full_access
resource "aws_iam_policy" "eks_full_access" {
  name = "EKSFullAccess"
  policy = "${data.aws_iam_policy_document.eks_full_access.json}"
}
data "aws_iam_policy_document" "eks_full_access" {
  statement {
    actions = [
      "eks:*",
      "iam:PassRole"
    ]
    resources = ["*"]
    condition = {
      test = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values = ["${local.mfa_condition_value}"]
    }
  }
}

// ec2_full_access (copied from AmazonEC2FullAccess managed policy)
resource "aws_iam_policy" "ec2_full_access" {
  name = "EC2FullAccess"
  policy = "${data.aws_iam_policy_document.ec2_full_access.json}"
}
data "aws_iam_policy_document" "ec2_full_access" {
  statement {
    actions = [
      "ec2:*",
      "elasticloadbalancing:*",
      "cloudwatch:*",
      "autoscaling:*",
    ]
    resources = ["*"]
    condition = {
      test = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values = ["${local.mfa_condition_value}"]
    }
  }

  statement {
    actions = [
      "iam:CreateServiceLinkedRole"
    ]
    resources = ["*"]

    condition {
      test = "StringEquals"
      variable = "iam:AWSServiceName"
      values = [
        "autoscaling.amazonaws.com",
        "ec2scheduled.amazonaws.com",
        "elasticloadbalancing.amazonaws.com",
        "spot.amazonaws.com",
        "spotfleet.amazonaws.com",
        "transitgateway.amazonaws.com"
      ]
    }
    condition = {
      test = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values = ["${local.mfa_condition_value}"]
    }
  }
}

// --------------------------------------------------------------------------------
// Users with managed AWS privileges

data "aws_iam_user" "mmarucheck" {
  user_name = "mmarucheck"
}

data "aws_iam_user" "mpomarole" {
  user_name = "mpomarole"
}

data "aws_iam_user" "ram" {
  user_name = "ram"
}

// --------------------------------------------------------------------------------
// Locals

locals {
  mfa_condition = {
      test = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values = ["${local.mfa_condition_value}"]
  }
  mfa_condition_test = "NumericLessThan"
  mfa_condition_variable = "aws:MultiFactorAuthAge"
  mfa_condition_value = "${6 * 60 * 60}"
}
