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

  ami_id = "${module.ami.ubuntu}"
  commit = "${var.commit}"
  creds_snapshot_id = "${data.terraform_remote_state.flu_db.api_creds_snapshot_id}"
  environment = "prod"
  fludb_client_sg_id = "${data.terraform_remote_state.flu_db.fludb_client_sg_id}"
  gateway_id = "${data.terraform_remote_state.flu_db.gateway_id}"
  migrate = "${var.migrate}"
  service = "${var.service}"
  subnet_api_cidr = "${data.terraform_remote_state.global.prod_api_cidr}"
  subnet_public_cidr = "${data.terraform_remote_state.global.prod_public_cidr}"
  vpc_id = "${data.terraform_remote_state.flu_db.vpc_id}"
}

data "terraform_remote_state" "global" {
  backend = "local"
  config {
    path = "../../global/terraform.tfstate"
  }
}

data "terraform_remote_state" "flu_db" {
  backend = "s3"
  config {
    bucket = "flu-prod-terraform.auderenow.io"
    key = "db/terraform.state"
    region = "us-west-2"
  }
}

module "ami" {
  source = "../../modules/ami"
}
