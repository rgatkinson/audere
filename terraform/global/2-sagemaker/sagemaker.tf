// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  version = "~> 1.50"
  region  = "us-west-2"
}

terraform {
  backend "s3" {
    bucket = "global-terraform.auderenow.io"
    key = "sagemaker/terraform.state"
    region = "us-west-2"
  }
}

// --------------------------------------------------------------------------------

resource "aws_s3_bucket" "sagemaker" {
  bucket = "sagemaker.auderenow.io"
  acl = "private"
  force_destroy = true

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
  logging {
    target_bucket = "${data.terraform_remote_state.global_policy.cloudtrail_log_bucket}"
    target_prefix = "sagemaker.auderenow.io"
  }
}

resource "aws_sagemaker_notebook_instance" "notebook" {
  name = "sagemaker-auderenow-io"
  role_arn = "${aws_iam_role.sagemaker.arn}"
  instance_type = "ml.t2.medium"

  tags = {
    Name = "sagemaker-notebook"
  }
}

resource "aws_iam_role_policy_attachment" "sagemaker_fullaccess" {
  role = "${aws_iam_role.sagemaker.name}"
  policy_arn = "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
}

resource "aws_iam_role_policy_attachment" "sagemaker_getrole" {
  role = "${aws_iam_role.sagemaker.name}"
  policy_arn = "arn:aws:iam::aws:policy/IAMReadOnlyAccess"
}

resource "aws_iam_role" "sagemaker" {
  name = "sagemaker-execution-role"
  assume_role_policy = "${data.aws_iam_policy_document.sagemaker_assume_role.json}"
}

data "aws_iam_policy_document" "sagemaker_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type = "Service"
      identifiers = ["sagemaker.amazonaws.com"]
    }
  }
}

data "terraform_remote_state" "global_policy" {
  backend = "s3"
  config {
    bucket = "global-terraform.auderenow.io"
    key = "policy/terraform.state"
    region = "us-west-2"
  }
}
