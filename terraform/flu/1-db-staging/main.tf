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
  region = "us-west-2"
}
