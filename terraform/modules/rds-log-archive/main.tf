// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

resource "aws_lambda_function" "log_archiver" {
  filename = "${local.log_archiver_zip_path}"
  function_name = "${local.base_name}"
  handler = "rds_logs_archiver.update_archive"
  // dead_letter_config
  role = "${aws_iam_role.log_archiver.arn}"
  description = "Archive logs from '${local.db_name}' to '${var.bucket_name}' under '${local.base_name}/'"
  memory_size = 256
  runtime = "python3.6"
  timeout = 600
  source_code_hash = "${base64sha256(file("${local.log_archiver_py_path}"))}"

  environment {
    variables {
      REGION = "${local.region}"
      RDS_NAME = "${local.db_name}"
      S3_BUCKET = "${var.bucket_name}"
      S3_PREFIX = "${local.db_name}-log-archive/"
    }
  }

  tags {
    Name = "${local.base_name}"
  }
}

resource "aws_cloudwatch_event_rule" "log_archiver_trigger" {
  name = "${local.base_name}-log-archiver-trigger"
  description = "Fires on interval to run log archiver lambda"
  schedule_expression = "rate(8 hours)"
}

resource "aws_cloudwatch_event_target" "log_archiver" {
  rule = "${aws_cloudwatch_event_rule.log_archiver_trigger.name}"
  target_id = "${local.base_name}-log-archiver"
  arn = "${aws_lambda_function.log_archiver.arn}"
}

resource "aws_lambda_permission" "log_archiver_trigger" {
  statement_id = "${local.base_name}-allow-log-archiver-trigger"
  action = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.log_archiver.function_name}"
  principal = "events.amazonaws.com"
  source_arn = "${aws_cloudwatch_event_rule.log_archiver_trigger.arn}"
}

data "aws_availability_zone" "db" {
  name = "${data.aws_db_instance.db.availability_zone}"
}

data "aws_db_instance" "db" {
  db_instance_identifier = "${local.db_name}"
}

data "archive_file" "rds_log_py" {
  type = "zip"
  source_file = "${local.log_archiver_py_path}"
  output_path = "${path.module}/rds_log_py.zip"
}

locals {
  db_name = "${var.db_name}"
  base_name = "${local.db_name}-log-archiver"
  log_archiver_py_path = "${path.module}/rds_logs_archiver.py"
  log_archiver_zip_path = "${data.archive_file.rds_log_py.output_path}"
  region = "${data.aws_availability_zone.db.region}"
}
