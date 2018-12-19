// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "dev_vpc_id" {
  value = "${aws_vpc.dev.id}"
}

output "dev_machine_subnet_id" {
  value = "${aws_subnet.dev_machine.id}"
}

output "dev_machine_sg_ids" {
  value = [
    "${module.dev_machine_sg.server_id}",
    "${module.dev_debug_sg.client_id}",
  ]
}

resource "aws_vpc" "dev" {
  cidr = "${var.vpc_cidr}"

  tags = {
    Name = "vpc-dev"
  }
}

resource "aws_subnet" "dev_bastion" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${var.subnet_dev_bastion_cidr}"
  map_public_ip_on_launch = false
  vpc_id = "${aws_vpc.dev.id}"

  tags = {
    Name = "subnet-dev-bastion"
  }
}

resource "aws_subnet" "dev_machine" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${var.subnet_dev_machine_cidr}"
  map_public_ip_on_launch = false
  vpc_id = "${aws_vpc.dev.id}"

  tags = {
    Name = "subnet-dev-machine"
  }
}

resource "aws_instance" "bastion" {
  availability_zone = "${var.availability_zone}"

}


module "dev_machine_sg" {
  source = "../modules/sg-pair"

  name = "dev-machine"
  port = "22"
  vpc_id = "${aws_vpc.dev.id}"
}

module "dev_debug_sg" {
  source = "../modules/sg-pair"

  name = "dev-debug"
  port = "22"
  vpc_id = "${aws_vpc.dev.id}"
}

data "aws_security_group" "ssh" {
  name = "ssh"
}
