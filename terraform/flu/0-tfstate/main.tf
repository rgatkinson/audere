// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  region = "us-west-2"
}

resource "aws_s3_bucket" "staging_terraform" {
  bucket = "flu-staging-terraform.auderenow.io"

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket" "prod_terraform" {
  bucket = "flu-prod-terraform.auderenow.io"

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}
