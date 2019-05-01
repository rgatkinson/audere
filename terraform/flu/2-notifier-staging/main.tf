// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

module "flu_notifier" {
  source = "../../modules/notifier"

  environment = "staging"
  ssm_parameters_key_arn = "${data.terraform_remote_state.global.ssm_parameters_key_arn}"
}

data "terraform_remote_state" "global" {
  backend = "local"
  config {
    path = "../../global/terraform.tfstate"
  }
}

provider "aws" {
  version = "~> 1.50"
  region = "us-west-2"
}

terraform {
  backend "s3" {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "notifier/terraform.state"
    region = "us-west-2"
  }
}
