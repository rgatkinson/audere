// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  archive_path = "${path.module}/../../../FluLambda/build/FluLambda.zip"
}

resource "aws_lambda_function" "cron" {
  function_name = "${var.name}"
  filename = "${local.archive_path}"
  handler = "handler.cronGet"
  runtime = "nodejs8.10"
  source_code_hash = "${local.archive_path}"
  role = "${var.role_arn}"
  timeout = "10"

  environment {
    variables = {
      TARGET_URL = "${var.url}"
    }
  }

  vpc_config {
    subnet_ids = ["${var.subnet_id}"]
    security_group_ids = ["${var.security_group_ids}"]
  }
}

resource "aws_cloudwatch_event_rule" "cron" {
  name = "${var.name}-cron-events"
  description = "Fires at ${frequency}"
  schedule_expression = "${frequency}"
}

resource "aws_cloudwatch_event_target" "cron" {
  rule = "${aws_cloudwatch_event_rule.cron.name}"
  arn = "${aws_lambda_function.cron.arn}"
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_cron" {
  action = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.cron.function_name}"
  principal = "events.amazonaws.com"
  source_arn = "${aws_cloudwatch_event_rule.cron.arn}"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access_managed_policy" {
  role = "${var.role_arn}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
