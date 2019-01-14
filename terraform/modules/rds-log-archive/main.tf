// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

resource "aws_lambda_function" "log_archiver" {
  filename = "${local.log_archiver_zip_path}"
  function_name = "${local.base_name}"
  handler = "archive_rds_logs"
  // dead_letter_config
  role = "${aws_iam_role.log_archiver.arn}"
  description = "Archive logs from '${local.db_name}' to '${var.bucket_arn}' under '${local.base_name}/'"
  memory_size = 256
  runtime = "python3.6"
  timeout = 30
  source_code_hash = "${base64sha256(file("${local.log_archiver_py_path}"))}"

  # vpc_config {
  #   subnet_ids = ["${var.subnet_id}"]
  #   security_group_ids = ["${var.security_group_ids}"]
  # }

  environment {
    variables {
      REGION = "${local.region}"
      RDS_NAME = "${local.db_name}"
      S3_BUCKET = "${var.bucket_arn}"
      S3_PREFIX = "${local.base_name}/"
    }
  }

  tags {
    Name = "${local.base_name}"
  }
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
  log_archiver_py_path = "${path.module}/rds_log.py"
  log_archiver_zip_path = "${data.archive_file.rds_log_py.output_path}"
  region = "${data.aws_availability_zone.db.region}"
}
