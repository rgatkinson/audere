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
  assume_role_policy = "${data.aws_iam_policy_document.flu_api_role_policy.json}"
}

data "aws_iam_policy_document" "flu_api_role_policy" {
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

resource "aws_iam_role_policy" "flu_api_s3_policy" {
  name = "${local.base_name}-s3-policy"
  role = "${aws_iam_role.flu_api_role.id}"
  policy = "${data.aws_iam_policy_document.flu_api_s3_policy.json}"
}

data "aws_iam_policy_document" "flu_api_s3_policy" {
  statement {
    actions = [
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:GetObject"
    ]

    resources = ["${aws_s3_bucket.flu_api_reports_bucket.arn}/*"]
  }

  statement {
    actions = [
      "s3:ListBucket"
    ]

    resources = ["${aws_s3_bucket.flu_api_reports_bucket.arn}"]
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

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.environment}-ecs"
  assume_role_policy = "${data.aws_iam_policy_document.ecs_assume_role_policy.json}"
}

data "aws_iam_policy_document" "ecs_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role = "${aws_iam_role.ecs_task_execution_role.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

data "aws_iam_policy_document" "ecs_kms_policy" {
  statement {
    actions = ["ssm:DescribeParameters"]
    resources = ["*"]
    effect = "Allow"
  }

  statement {
    actions = ["ssm:GetParameters"]
    resources = ["${format("arn:aws:ssm:%s:%s:parameeter/metabase-%s.*", var.region, var.account, var.environment)}"]
    effect = "Allow"
  }

  statement {
    actions = ["kms:Decrypt"]
    resources = ["${var.ssm_parameters_key_arn}"]
    effect = "Allow"
  }
}

resource "aws_iam_policy" "ecs_kms_policy" {
  name = "${local.base_name}-ecs-kms"
  policy = "${data.aws_iam_policy_document.ecs_kms_policy.json}"
}

resource "aws_iam_role_policy_attachment" "ecs_kms_policy" {
  role = "${aws_iam_role.ecs_task_execution_role.name}"
  policy_arn = "${aws_iam_policy.ecs_kms_policy.arn}"
}
