// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  region = "us-west-2"
}

output "db_arn" {
  value = "${aws_s3_bucket.db_state.arn}"
}
resource "aws_s3_bucket" "db_state" {
  bucket = "flu-db-state"
  versioning {
    enabled = true
  }
  lifecycle {
    prevent_destroy = true
  }
}

output "api_staging_arn" {
  value = "${aws_s3_bucket.api_staging_state.arn}"
}
resource "aws_s3_bucket" "api_staging_state" {
  bucket = "flu-api-state"
  versioning {
    enabled = true
  }
  lifecycle {
    prevent_destroy = true
  }
}
