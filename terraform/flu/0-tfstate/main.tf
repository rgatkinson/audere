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
        kms_master_key_id = "${data.aws_kms_key.default.arn}"
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
        kms_master_key_id = "${data.aws_kms_key.default.arn}"
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
        kms_master_key_id = "${data.aws_kms_key.default.arn}"
        sse_algorithm = "aws:kms"
      }
    }
  }
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
        kms_master_key_id = "${data.aws_kms_key.default.arn}"
        sse_algorithm = "aws:kms"
      }
    }
  }
}

data "aws_kms_key" "default" {
  key_id = "arn:aws:kms:us-west-2:475613123583:key/dd2f00bc-0b07-4264-9f47-727510b3084f"
}
