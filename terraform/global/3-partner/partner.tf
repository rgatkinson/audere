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
    key = "partner/terraform.state"
    region = "us-west-2"
  }
}

// --------------------------------------------------------------------------------

module "uw_photoset" {
  source = "../../modules/partner-s3-bucket"
  partner_ids = ["arn:aws:iam::475613123583:user/jack-henry"]
  bucket_name = "uw-photoset.auderenow.io"
  logging_bucket = "${data.terraform_remote_state.global_policy.cloudtrail_log_bucket}"
}

data "terraform_remote_state" "global_policy" {
  backend = "s3"
  config {
    bucket = "global-terraform.auderenow.io"
    key = "policy/terraform.state"
    region = "us-west-2"
  }
}
