// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

terraform {
  backend "s3" {
    bucket = "flu-prod-terraform.auderenow.io"
    key = "lambda/terraform.state"
    region = "us-west-2"
  }
}

provider "aws" {
  version = "~> 1.50"
  region = "us-west-2"
}

provider "template" {
  version = "~> 1.0"
}

module "flu_lambda" {
  source = "../../modules/flu-lambda"

  environment = "prod"

  fluapi_fqdn = "${data.terraform_remote_state.flu_api.fluapi_internal_fqdn}"
  lambda_subnet_id = "${data.terraform_remote_state.flu_api.transient_subnet_id}"
  internal_elb_access_sg = "${data.terraform_remote_state.flu_api.elbinternal_sg_client_id}"
  internet_egress_sg = "${data.terraform_remote_state.flu_api.internet_egress_sg_id}"
}

data "terraform_remote_state" "flu_api" {
  backend = "s3"
  config {
    bucket = "flu-prod-terraform.auderenow.io"
    key = "api/terraform.state"
    region = "us-west-2"
  }
}
