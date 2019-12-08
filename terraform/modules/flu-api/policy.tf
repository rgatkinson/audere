// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

resource "aws_iam_instance_profile" "flu_api" {
  name = "${local.base_name}-profile"
  role = "${aws_iam_role.flu_api_role.name}"
}

resource "aws_iam_role_policy_attachment" "flu_api_send_email" {
  role = "${aws_iam_role.flu_api_role.name}"
  policy_arn = "${aws_iam_policy.ses_send_email.arn}"
}

resource "aws_iam_role" "flu_api_role" {
  name = "${local.base_name}-role"
  assume_role_policy = "${data.aws_iam_policy_document.flu_ec2_role_policy.json}"
}

data "aws_iam_policy_document" "flu_ec2_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "flu_api_cloudwatch_policy" {
  name = "${local.base_name}-cloudwatch-policy"
  role = "${aws_iam_role.flu_api_role.id}"
  policy = "${data.aws_iam_policy_document.flu_api_cloudwatch_policy.json}"
}

data "aws_iam_policy_document" "flu_api_cloudwatch_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]

    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
    actions = [
      "cloudwatch:ListMetrics",
      "cloudwatch:PutMetricData",
      "cloudwatch:PutEvents",
      "ec2:DescribeTags"
    ]

    resources = ["*"]
  }
}

resource "aws_s3_bucket_policy" "evidation_s3_policy" {
  bucket = "${aws_s3_bucket.evidation_reports_bucket.id}"
  policy = "${data.aws_iam_policy_document.evidation_s3_policy.json}"
}

data "aws_iam_policy_document" "evidation_s3_policy" {
  statement {
    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket"
    ]

    principals = {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.evidation_account}:root"]
    }

    resources = [
      "${aws_s3_bucket.evidation_reports_bucket.arn}"
    ]
  }

  statement {
    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject",
      "s3:PutObjectAcl"
    ]

    principals = {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.evidation_account}:root"]
    }

    resources = [
      "${aws_s3_bucket.evidation_reports_bucket.arn}/*"
    ]
  }
}

data "aws_iam_policy_document" "evidation_s3_kms_policy" {
  statement {
    actions = ["kms:*"]

    principals = {
      type        = "AWS"
      identifiers = ["arn:aws:iam::475613123583:root"]
    }

    resources = ["*"]
  }

  statement {
    actions = [
      "kms:Encrypt",
      "kms:Decrypt",
      "kms:ReEncrypt*",
      "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]

    principals = {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.evidation_account}:root"]
    }

    resources = ["*"]
  }
}

resource "aws_iam_policy" "flu_api_s3_policy" {
  name = "${local.base_name}-s3-policy"
  policy = "${data.aws_iam_policy_document.flu_api_s3_policy.json}"
}

data "aws_iam_policy_document" "flu_api_s3_policy" {
  statement {
    actions = [
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:GetObject"
    ]

    resources = [
      "${aws_s3_bucket.flu_api_reports_bucket.arn}/*",
      "${var.audere_share_bucket}/*",
      "${var.chills_virena_bucket}/*",
      "${var.cough_aspren_bucket}/*",
      "${var.cough_qualtrics_bucket}/*"
    ]
  }

  statement {
    actions = [
      "s3:ListBucket"
    ]

    resources = [
      "${aws_s3_bucket.flu_api_reports_bucket.arn}",
      "${var.audere_share_bucket}",
      "${var.chills_virena_bucket}",
      "${var.cough_aspren_bucket}",
      "${var.cough_qualtrics_bucket}"
    ]
  }
}

resource "aws_iam_policy" "ses_send_email" {
  name = "${local.base_name}-ses-send-email"
  policy = "${data.aws_iam_policy_document.ses_send_email.json}"
}

data "aws_iam_policy_document" "ses_send_email" {
  statement = {
    actions = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]
  }
}

module "task_role" {
  source = "../ecs-task-role"

  account = "${var.account}"
  environment = "${var.environment}"
  policies = [
    "${aws_iam_policy.flu_api_s3_policy.arn}",
    "${aws_iam_policy.ses_send_email.arn}"
  ]
  policy_count = 2
  region = "${var.region}"
  task_alias = "fluapi"
  ssm_parameters_key_arn = "${var.ssm_parameters_key_arn}"
}
