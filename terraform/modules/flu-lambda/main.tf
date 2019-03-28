// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  base_name = "flu-${var.environment}-lambda"
  archive_path = "../../../FluLambda/build/FluLambda.zip"

  // This is 8:30 AM and 1:30 PM local in PST
  // See: https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html
  cron_weekdays_before_9AM_and_1PM_PST = "cron(30 15,19 ? * MON-FRI *)"
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

resource "aws_iam_role_policy_attachment" "lambda_vpc_access_managed_policy" {
  role = "${aws_iam_role.flu_lambda.name}"
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_sns_topic" "flu_lambda_notifications" {
  name = "${local.base_name}-notifications"
}

module "hutch_upload_cron" {
  source = "../lambda-cron"
  name = "${local.base_name}-hutch-upload"
  role_arn = "${aws_iam_role.flu_lambda.arn}"
  frequency = "rate(1 hour)"
  url = "http://${var.fluapi_fqdn}:444/api/export/sendEncounters"
  subnet_id = "${var.lambda_subnet_id}"
  security_group_ids = ["${var.lambda_sg_ids}"]
  notification_topic = "${aws_sns_topic.flu_lambda_notifications.arn}"
}

module "fever_consent_emailer_cron" {
  source = "../lambda-cron"
  name = "${local.base_name}-fever-consent-emailer"
  role_arn = "${aws_iam_role.flu_lambda.arn}"
  frequency = "rate(1 hour)"
  url = "http://${var.fluapi_fqdn}:444/api/sendFeverConsentEmails"
  subnet_id = "${var.lambda_subnet_id}"
  security_group_ids = ["${var.lambda_sg_ids}"]
  notification_topic = "${aws_sns_topic.flu_lambda_notifications.arn}"
}

module "sniffles_consent_emailer_cron" {
  source = "../lambda-cron"
  name = "${local.base_name}-sniffles-consent-emailer"
  role_arn = "${aws_iam_role.flu_lambda.arn}"
  frequency = "rate(1 hour)"
  url = "http://${var.fluapi_fqdn}:444/api/sendSnifflesConsentEmails"
  subnet_id = "${var.lambda_subnet_id}"
  security_group_ids = ["${var.lambda_sg_ids}"]
  notification_topic = "${aws_sns_topic.flu_lambda_notifications.arn}"
}

module "fever_kits_report_cron" {
  source = "../lambda-cron"
  name = "${local.base_name}-fever-kits-report"
  role_arn = "${aws_iam_role.flu_lambda.arn}"
  frequency = "${local.cron_weekdays_before_9AM_and_1PM_PST}"
  url = "http://${var.fluapi_fqdn}:444/api/export/sendKitOrders"
  subnet_id = "${var.lambda_subnet_id}"
  security_group_ids = ["${var.lambda_sg_ids}"]
  timeout = 300
  notification_topic = "${aws_sns_topic.flu_lambda_notifications.arn}"
}
