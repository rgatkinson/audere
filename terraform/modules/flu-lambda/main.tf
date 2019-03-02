// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  base_name = "flu-${var.environment}-lambda"
  archive_path = "../../../FluLambda/build/FluLambda.zip"
}

resource "aws_iam_role" "flu_lambda" {
  name = "${local.base_name}"
  assume_role_policy = "${data.aws_iam_policy_document.flu_lambda_role_policy.json}"
}

data "aws_iam_policy_document" "flu_lambda_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_lambda_function" "hutch_upload_function" {
  name = "${local.base_name}-hutch-upload"
  filename = "${local.archive_path}"
  function_name = "hutch_upload"
  handler = "handler.hutchUpload"
  runtime = "nodejs8.10"
  source_code_hash = "${local.archive_path}"
  role = "${aws_iam_role.flu_lambda.arn}"
  timeout = "10"

  environment {
    variables = {
      FLU_API_UPLOAD_PATH = "https://${var.fluapi_fqdn}:3200/api/export/sendEncounters"
    }
  }

  vpc_config {
    subnet_ids = ["${var.lambda_subnet_id}"]
    security_group_ids = "${var.lambda_sg_ids}"
  }
}

resource "aws_cloudwatch_event_rule" "every_hour" {
  name = "every-hour"
  description = "Fires every hour"
  schedule_expression = "rate(1 hours)"
}

resource "aws_cloudwatch_event_target" "hutch_upload_every_hour" {
  rule = "${aws_cloudwatch_event_rule.every_hour.name}"
  arn = "${aws_lambda_function.hutch_upload.arn}"
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_hutch_upload" {
  action = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.hutch_upload.function_name}"
  principal = "events.amazonaws.com"
  source_arn = "${aws_cloudwatch_event_rule.every_hour.arn}"
}
