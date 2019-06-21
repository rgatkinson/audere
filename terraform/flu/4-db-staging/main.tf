// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

module "flu_db" {
  source = "../../modules/flu-db"

  admins = "${var.admins}"
  db_client_sg_id = "${data.terraform_remote_state.network.db_client_sg_id}"
  db_nonpii_subnet_id = "${data.terraform_remote_state.network.db_nonpii_subnet_id}"
  db_pii_subnet_id = "${data.terraform_remote_state.network.db_pii_subnet_id}"
  db_server_sg_id = "${data.terraform_remote_state.network.db_server_sg_id}"
  environment = "staging"
  internet_egress_sg_id = "${data.terraform_remote_state.network.internet_egress_sg_id}"
  log_archive_bucket_name = "${data.terraform_remote_state.global.database_log_archive_bucket_name}"
  mode = "${var.mode}"
  transient_subnet_id = "${data.terraform_remote_state.network.transient_subnet_id}"
}

module "ami" {
  source = "../../modules/ami"
}

module "vpc_cidr" {
  source = "../../modules/vpc-cidr"
}

provider "aws" {
  version = "~> 1.50"
  region = "us-west-2"
}

provider "template" {
  version = "~> 1.0"
}

data "terraform_remote_state" "global" {
  backend = "s3"
  config {
    bucket = "global-terraform.auderenow.io"
    key = "policy/terraform.state"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "network" {
  backend = "s3"
  config {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "network/terraform.state"
    region = "us-west-2"
  }
}

terraform {
  backend "s3" {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "db/terraform.state"
    region = "us-west-2"
  }
}
data "terraform_remote_state" "flu_db" {
  backend = "local"
  config {
    path = "/Users/billy/Downloads/terraform-staging/db/terraform.state"
  }
}
