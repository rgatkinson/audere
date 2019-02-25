// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  region = "us-west-2"
}

resource "aws_s3_bucket" "staging_terraform" {
  bucket = "flu-staging-terraform.auderenow.io"
  acl = "private"

  versioning {
    enabled = true
  }

  logging {
    target_bucket = "${aws_s3_bucket.staging_log.bucket}"
    target_prefix = "flu-staging-terraform-s3-bucket"
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
}

resource "aws_s3_bucket" "prod_terraform" {
  bucket = "flu-prod-terraform.auderenow.io"
  acl = "private"

  versioning {
    enabled = true
  }

  logging {
    target_bucket = "${aws_s3_bucket.prod_log.bucket}"
    target_prefix = "flu-prod-terraform-s3-bucket"
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
}

resource "aws_s3_bucket" "staging_log" {
  bucket = "flu-staging-log.auderenow.io"
  acl = "log-delivery-write"

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
}

resource "aws_iam_policy" "staging_log_restricted_access" {
  name   = "StagingLogRestrictedAccesss"
  policy = "${data.aws_iam_policy_document.staging_log_restricted_access.json}"
}

data "aws_iam_policy_document" "staging_log_restricted_access" {
  statement {
    effect = "Deny"

    actions = [
      "s3:Delete*",
      "s3:Put*"
    ]

    resources = ["${aws_s3_bucket.staging_log.arn}"]
  }
}

resource "aws_iam_group_policy_attachment" "staging_log_restricted_access" {
  group      = "${data.terraform_remote_state.global.infrastructurers_group_name}"
  policy_arn = "${aws_iam_policy.staging_log_restricted_access.arn}"
}

resource "aws_s3_bucket" "prod_log" {
  bucket = "flu-prod-log.auderenow.io"
  acl = "log-delivery-write"

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
}

resource "aws_iam_policy" "prod_log_restricted_access" {
  name   = "ProdLogRestrictedAccesss"
  policy = "${data.aws_iam_policy_document.prod_log_restricted_access.json}"
}

data "aws_iam_policy_document" "prod_log_restricted_access" {
  statement {
    effect = "Deny"

    actions = [
      "s3:Delete*",
      "s3:Put*"
    ]

    resources = ["${aws_s3_bucket.prod_log.arn}"]
  }
}

resource "aws_iam_group_policy_attachment" "prod_log_restricted_access" {
  group      = "${data.terraform_remote_state.global.infrastructurers_group_name}"
  policy_arn = "${aws_iam_policy.prod_log_restricted_access.arn}"
}

data "terraform_remote_state" "global" {
  backend = "local"
  config {
    path = "../../global/terraform.tfstate"
  }
}
