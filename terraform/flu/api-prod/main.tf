// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

terraform {
  backend "s3" {
    bucket = "flu-prod-terraform.auderenow.io"
    key = "api/terraform.state"
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

module "flu_api" {
  source = "../../modules/flu-api"

  api_cidr = "${module.vpc_cidr.prod_api_cidr}"
  commit = "${var.commit}"
  creds_snapshot_id = "${data.terraform_remote_state.flu_db.api_creds_snapshot_id}"
  environment = "prod"
  fludb_client_sg_id = "${data.terraform_remote_state.flu_db.fludb_client_sg_id}"
  fludev_ssh_server_sg_id = "${data.terraform_remote_state.flu_db.fludev_ssh_server_sg_id}"
  gateway_id = "${data.terraform_remote_state.flu_db.gateway_id}"
  migrate = "${var.migrate}"
  public_cidr = "${module.vpc_cidr.prod_public_cidr}"
  service = "${var.service}"
  vpc_id = "${data.terraform_remote_state.flu_db.vpc_id}"
}

module "flu_dev" {
  source = "../../modules/flu-dev"

  bastion_cidr_whitelist = "${var.bastion_cidr_whitelist}"
  devs = "${var.devs}"
  dev_cidr = "${module.vpc_cidr.prod_dev_cidr}"
  environment = "prod"
  fludb_client_sg_id = "${data.terraform_remote_state.flu_db.fludb_client_sg_id}"
  fludev_ssh_client_sg_id = "${data.terraform_remote_state.flu_db.fludev_ssh_client_sg_id}"
  gateway_id = "${data.terraform_remote_state.flu_db.gateway_id}"
  vpc_id = "${data.terraform_remote_state.flu_db.vpc_id}"
}

module "vpc_cidr" {
  source = "../../modules/vpc-cidr"
}

data "terraform_remote_state" "flu_db" {
  backend = "s3"
  config {
    bucket = "flu-prod-terraform.auderenow.io"
    key = "db/terraform.state"
    region = "us-west-2"
  }
}
