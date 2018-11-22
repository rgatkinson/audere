// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

module "flu_api" {
  source = "../../modules/flu-api"

  environment = "staging"
  service = "${var.service}"
  migrate = "${var.migrate}"
  commit = "${var.commit}"
  ami_id = "${module.ami.ubuntu}"
}

module "ami" {
  source = "../../modules/ami"
}

provider "aws" {
  region = "us-west-2"
}
