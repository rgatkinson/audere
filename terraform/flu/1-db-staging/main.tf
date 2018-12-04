// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

module "flu_db" {
  source = "../../modules/flu-db"

  admins = "${var.admins}"
  ami_id = "${module.ami.ubuntu}"
  environment = "staging"
  mode = "${var.mode}"
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

terraform {
  backend "s3" {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "db/terraform.state"
    region = "us-west-2"
  }
}
