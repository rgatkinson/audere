// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

# resource "aws_iam_instance_profile" "log_archiver" {
#   name = "${var.base_name}-profile"
#   role = "${aws_iam_role.log_archiver.name}"
# }

resource "aws_iam_role" "log_archiver" {
  name = "${var.base_name}"
  assume_role_policy = "${data.aws_iam_policy_document.log_archiver_role_policy.json}"
}

data "aws_iam_policy_document" "log_archiver_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "log_archiver_write_s3" {
  role = "${aws_iam_role.log_archiver.name}"
  policy_arn = "${aws_iam_policy.log_archiver_write_s3.arn}"
}

resource "aws_iam_policy" "log_archiver_write_s3" {
  name = "${var.base_name}-log-archiver-write-s3"
  policy = "${data.aws_iam_policy_document.log_archiver_write_s3.json}"
}

data "aws_iam_policy_document" "log_archiver_write_s3" {
  statement = {
    actions   = ["s3:PutObject"]
    resources = ["${var.db_logs_arn}"]
  }
}
