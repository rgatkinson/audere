// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

module "flu_db" {
  source = "../../modules/flu-db"

  admins = "${var.admins}"
  ami_id = "${module.ami.ubuntu}"
  db_cidr = "${data.terraform_remote_state.global.prod_db_cidr}"
  dev_debug_target_sg = "${data.terraform_remote_state.global.dev_debug_target_sg}"
  environment = "prod"
  mode = "${var.mode}"
  vpc_cidr = "${data.terraform_remote_state.global.vpc_prod_cidr}"
  vpc_flow_log_arn = "${data.terraform_remote_state.global.vpc_flow_log_arn}"
  vpc_flow_log_role_arn = "${data.terraform_remote_state.global.vpc_flow_log_role_arn}"
}

module "ami" {
  source = "../../modules/ami"
}

provider "aws" {
  version = "~> 1.50"
  region = "us-west-2"
}

provider "template" {
  version = "~> 1.0"
}

data "terraform_remote_state" "global" {
  backend = "local"
  config {
    path = "../../global/terraform.tfstate"
  }
}

terraform {
  backend "s3" {
    bucket = "flu-prod-terraform.auderenow.io"
    key = "db/terraform.state"
    region = "us-west-2"
  }
}
