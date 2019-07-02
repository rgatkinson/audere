// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  base_name = "${var.client_role}-sftp-${var.environment}"
}

resource "aws_s3_bucket" "sftp_destination" {
  bucket = "${var.client_role}.${var.sftp_host}"
  acl = "private"
  force_destroy = true

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "aws:kms"
      }
    }
  }
}

data "aws_iam_policy_document" "assume_transfer_service_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["transfer.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "sftp_role" {
  name = "${local.base_name}"
  assume_role_policy = "${data.aws_iam_policy_document.assume_transfer_service_role_policy.json}"
}

data "aws_iam_policy_document" "sftp_s3_policy" {
  statement {
    actions = [
      "s3:PutObject",
      "s3:GetObject"
    ]

    resources = ["${aws_s3_bucket.sftp_destination.arn}/*"]
  }

  statement {
    actions = [
      "s3:ListBucket"
    ]

    resources = ["${aws_s3_bucket.sftp_destination.arn}"]
  }
}

resource "aws_iam_role_policy" "sftp_s3_policy" {
  name = "${local.base_name}-s3"
  role = "${aws_iam_role.sftp_role.id}"
  policy = "${data.aws_iam_policy_document.sftp_s3_policy.json}"
}

resource "aws_transfer_user" "sftp_user" {
  server_id = "${var.transfer_server_id}"
  user_name = "${var.client_role}"
  role = "${aws_iam_role.sftp_role.arn}"
  home_directory = "/${aws_s3_bucket.sftp_destination.id}"
}

resource "aws_transfer_ssh_key" "sftp_user_key" {
  server_id = "${var.transfer_server_id}"
  user_name = "${aws_transfer_user.sftp_user.user_name}"
  body = "${var.user_public_key}"
}
