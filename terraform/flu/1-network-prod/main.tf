// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  region = "us-west-2"
}

module "env_network" {
  source = "../../modules/network"

  app_cidr = "${module.vpc_cidr.prod_app_cidr}"
  bastion_cidr_whitelist = "${var.bastion_cidr_whitelist}"
  db_cidr = "${module.vpc_cidr.prod_db_cidr}"
  dev_cidr = "${module.vpc_cidr.prod_dev_cidr}"
  environment = "prod"
  vpc_cidr = "${module.vpc_cidr.vpc_prod_cidr}"
  vpc_flow_log_arn = "${data.terraform_remote_state.global.vpc_flow_log_arn}"
  vpc_flow_log_role_arn = "${data.terraform_remote_state.global.vpc_flow_log_role_arn}"
}

module "vpc_cidr" {
  source = "../../modules/vpc-cidr"
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
    key = "network/terraform.state"
    region = "us-west-2"
  }
}
