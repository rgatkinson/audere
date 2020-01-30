// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  base_name = "notifier-${var.environment}"
  slack_archive_path = "../../../local/notifier/release.zip"
}

resource "aws_sns_topic" "infra_alerts" {
  name = "${local.base_name}-infra-alerts"
}

resource "aws_iam_role" "slack_notifier" {
  name = "${local.base_name}-slack-notifier"
  assume_role_policy = "${data.aws_iam_policy_document.slack_notifier_role_policy.json}"
}

data "aws_iam_policy_document" "slack_notifier_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

// Both for network access and for granting ability to log in cloudwatch.
resource "aws_iam_role_policy_attachment" "vpc_access_managed_policy" {
  role = "${aws_iam_role.slack_notifier.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_sns_topic_subscription" "slack_forwarder" {
  topic_arn = "${aws_sns_topic.infra_alerts.arn}"
  protocol = "lambda"
  endpoint = "${aws_lambda_function.slack_forwarder.arn}"
}

resource "aws_lambda_permission" "sns_slack_lambda_permission" {
  statement_id = "AllowExecutionFromSNS"
  action = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.slack_forwarder.arn}"
  principal = "sns.amazonaws.com"
  source_arn = "${aws_sns_topic.infra_alerts.arn}"
}

resource "aws_lambda_function" "slack_forwarder" {
  function_name = "${local.base_name}-slack-forwarder"
  filename = "${local.slack_archive_path}"
  handler = "src/index.handler"
  runtime = "nodejs10.x"
  source_code_hash = "${base64sha256(file("${local.slack_archive_path}"))}"
  role = "${aws_iam_role.slack_notifier.arn}"

  environment {
    variables = {
      SLACK_HOOK_URL = "${data.aws_ssm_parameter.slack_hook_url.value}"
    }
  }
}

resource "aws_iam_role_policy" "slack_hook_decrypt_policy" {
  name = "${local.base_name}-slack-hook-decrypt-policy"
  role = "${aws_iam_role.slack_notifier.id}"
  policy = "${data.aws_iam_policy_document.slack_hook_decrypt_policy.json}"
}

data "aws_iam_policy_document" "slack_hook_decrypt_policy" {
  statement {
    actions = ["kms:Decrypt"]
    resources = ["${var.ssm_parameters_key_arn}"]
  }
}

data "aws_ssm_parameter" "slack_hook_url" {
  name = "slack-hook-url"
}
