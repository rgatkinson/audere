// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  base_name = "${var.task_alias}-${var.environment}"
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

resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${local.base_name}-ecs-task"
  assume_role_policy = "${data.aws_iam_policy_document.ecs_assume_role_policy.json}"
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role = "${aws_iam_role.ecs_task_execution_role.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Secrets
data "aws_iam_policy_document" "ecs_kms_policy" {
  statement {
    actions = ["ssm:DescribeParameters"]
    resources = ["*"]
    effect = "Allow"
  }

  statement {
    actions = ["ssm:GetParameters","ssm:GetParameter"]
    resources = ["${format("arn:aws:ssm:%s:%s:parameter/%s-%s.*", var.region, var.account, var.task_alias, var.environment)}"]
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

# Cloudwatch
data "aws_iam_policy_document" "ecs_cloudwatch_policy" {
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

resource "aws_iam_policy" "ecs_task_cloudwatch" {
  name = "${local.base_name}-ecs-task-cloudwatch"
  policy = "${data.aws_iam_policy_document.ecs_cloudwatch_policy.json}"
}

resource "aws_iam_role_policy_attachment" "ecs_task_cloudwatch_attachment" {
  role = "${aws_iam_role.ecs_task_execution_role.name}"
  policy_arn = "${aws_iam_policy.ecs_task_cloudwatch.arn}"
}

# Custom policies
resource "aws_iam_role_policy_attachment" "ecs_task_policy_attachment" {
  count = "${var.policy_count}"
  role = "${aws_iam_role.ecs_task_execution_role.name}"
  policy_arn = "${var.policies[count.index]}"
}
