// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

module "flu_db" {
  source = "../../modules/flu-db"

  epoch = "${var.epoch}"
  provision = "${var.provision}"
  environment = "prod"
  ami_id = "${module.ami.ubuntu}"
}

module "ami" {
  source = "../../modules/ami"
}

provider "aws" {
  region = "us-west-2"
}

terraform {
  backend "s3" {
    bucket = "flu-prod-terraform.auderenow.io"
    key = "db/terraform.state"
    region = "us-west-2"
  }
}
