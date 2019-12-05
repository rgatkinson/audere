// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "bucket_name" {
  type = "string"
}

variable "partner_ids" {
  type = "list"
}

variable "logging_bucket" {
  type = "string"
}

output "bucket" {
  value = "${aws_s3_bucket.bucket.id}"
}

locals {
  mfa_condition_test     = "NumericLessThan"
  mfa_condition_variable = "aws:MultiFactorAuthAge"
  mfa_condition_value    = "${12 * 60 * 60}"
}

resource "aws_s3_bucket" "bucket" {
  bucket = "${var.bucket_name}"
  acl = "private"

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "aws:kms"
      }
    }
  }

  logging {
    target_bucket = "${var.logging_bucket}"
    target_prefix = "${var.bucket_name}"
  }
}

resource "aws_s3_bucket_policy" "s3_policy" {
  bucket = "${aws_s3_bucket.bucket.id}"
  policy = "${data.aws_iam_policy_document.s3_policy.json}"
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket"
    ]

    principals = {
      type        = "AWS"
      identifiers = "${var.partner_ids}"
    }

    resources = [
      "${aws_s3_bucket.bucket.arn}"
    ]
  }

  statement {
    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject",
      "s3:PutObjectAcl"
    ]

    principals = {
      type        = "AWS"
      identifiers = "${var.partner_ids}"
    }

    resources = [
      "${aws_s3_bucket.bucket.arn}/*"
    ]
  }
}
