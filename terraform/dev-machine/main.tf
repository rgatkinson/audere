// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

module "dev_machine" {
  source = "../modules/dev-machine"

  userid = "${var.userid}"
  ssh_public_key = "${file("${var.key_path}")}"
  ami_id = "${module.ami.ubuntu}"
  home_size_gb = "${var.home_size_gb}"
  availability_zone = "${var.availability_zone}"
  instance_type = "${var.instance_type}"
}

module "ami" {
  source = "../modules/ami"
}

provider "aws" {
  region = "us-west-2"
}
