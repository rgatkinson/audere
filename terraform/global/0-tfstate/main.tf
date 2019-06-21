// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  region = "us-west-2"
}

terraform {
  backend "s3" {
    bucket = "global-terraform.auderenow.io"
    key = "tfstate/terraform.state"
    region = "us-west-2"
  }
}

resource "aws_s3_bucket" "staging_terraform" {
  bucket = "flu-staging-terraform.auderenow.io"
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
}

resource "aws_s3_bucket" "prod_terraform" {
  bucket = "flu-prod-terraform.auderenow.io"
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
}
