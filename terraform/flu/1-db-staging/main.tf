// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

module "flu_db" {
  source = "../../modules/flu-db"

  admins = "${var.admins}"
  db_cidr = "${module.vpc_cidr.staging_db_cidr}"
  environment = "staging"
  log_archive_bucket_arn = "${data.terraform_remote_state.global.database_log_archive_bucket_arn}"
  mode = "${var.mode}"
  vpc_cidr = "${module.vpc_cidr.vpc_staging_cidr}"
  vpc_flow_log_arn = "${data.terraform_remote_state.global.vpc_flow_log_arn}"
  vpc_flow_log_role_arn = "${data.terraform_remote_state.global.vpc_flow_log_role_arn}"
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
  backend = "local"
  config {
    path = "../../global/terraform.tfstate"
  }
}

terraform {
  backend "s3" {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "db/terraform.state"
    region = "us-west-2"
  }
}
