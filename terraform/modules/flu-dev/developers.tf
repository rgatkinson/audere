// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// -----------------------------------------------------------------
// Bastion

resource "aws_route_table_association" "bastion_internet" {
  subnet_id      = "${aws_subnet.bastion.id}"
  route_table_id = "${aws_route_table.internet.id}"
}

resource "aws_subnet" "bastion" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_dev_bastion_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${local.base_name}-bastion"
  }
}

resource "aws_security_group" "bastion" {
  name = "${local.base_name}-bastion"
  description = "Allow bastion ingress from known public IP addresses"
  vpc_id = "${var.vpc_id}"
}

resource "aws_security_group_rule" "bastion_ingress" {
  type = "ingress"
  from_port = "${local.bastion_port}"
  to_port = "${local.bastion_port}"
  protocol = "tcp"

  security_group_id = "${aws_security_group.bastion.id}"
  cidr_blocks = ["${var.bastion_cidr_whitelist}"]
}

resource "aws_instance" "bastion" {
  ami = "${module.ami.ubuntu}"
  availability_zone = "${var.availability_zone}"
  instance_type = "t3.nano"
  subnet_id = "${aws_subnet.bastion.id}"
  user_data = "${data.template_file.provision_bastion_sh.rendered}"

  root_block_device {
    volume_type = "gp2"
    volume_size = 15
  }

  vpc_security_group_ids = [
    "${aws_security_group.internet_egress.id}",
    "${aws_security_group.bastion.id}",
    "${module.dev_machine_sg.client_id}"
  ]

  lifecycle {
    ignore_changes = ["ami", "user_data"]
  }

  tags {
    Name = "${local.base_name}-bastion"
  }

  volume_tags {
    Name = "${local.base_name}-bastion-root"
  }
}

data "template_file" "provision_bastion_sh" {
  template = "${file("${path.module}/provision-bastion.sh")}"
  vars {
    bastion_port = "${local.bastion_port}"
    ssh_public_key_map = "${module.devs.ssh_key_json}"
    util_sh = "${file("${path.module}/../assets/util.sh")}"
  }
}

// -----------------------------------------------------------------
// Dev-machine

resource "aws_route_table_association" "dev_machine_internet" {
  subnet_id      = "${aws_subnet.dev_machine.id}"
  route_table_id = "${aws_route_table.internet.id}"
}

resource "aws_subnet" "dev_machine" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_dev_machine_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${local.base_name}-dev"
  }
}

resource "aws_instance" "dev_machine" {
  count = "${length(var.devs)}"

  ami = "${module.ami.ubuntu}"
  availability_zone = "${var.availability_zone}"
  instance_type = "${var.instance_type}"
  # ipv6_address_count = 1
  subnet_id = "${aws_subnet.dev_machine.id}"
  user_data = "${data.template_file.provision_dev_sh.*.rendered[count.index]}"

  root_block_device {
    volume_type = "gp2"
    volume_size = 15
  }

  vpc_security_group_ids = [
    "${module.dev_machine_sg.server_id}",
    "${aws_security_group.internet_egress.id}",
    "${var.fludev_ssh_client_sg_id}",
    "${var.fludb_client_sg_id}",
    "${var.fluapi_internal_elb_client_sg_id}",
  ]

  lifecycle {
    ignore_changes = ["ami", "user_data"]
  }

  tags {
    Name = "${local.base_name}-${var.devs[count.index]}"
  }

  volume_tags {
    Name = "${local.base_name}-${var.devs[count.index]}-root"
  }
}

data "template_file" "provision_dev_sh" {
  count = "${length(var.devs)}"

  template = "${file("${path.module}/provision-dev.sh")}"
  vars {
    util_sh = "${file("${path.module}/../assets/util.sh")}"
    home_volume_letter = "${local.home_volume_letter}"
    ssh_public_key = "${lookup(module.devs.ssh_key_map, var.devs[count.index])}"
    userid = "${var.devs[count.index]}"
  }
}

resource "aws_ebs_volume" "dev_machine_home" {
  count = "${length(var.devs)}"

  availability_zone = "${var.availability_zone}"
  encrypted = true
  size = "${var.home_size_gb}"
  type = "gp2"

  tags {
    Name = "${local.base_name}-${var.devs[count.index]}-home"
  }
}

resource "aws_volume_attachment" "dev_machine_home" {
  count = "${length(var.devs)}"

  device_name = "/dev/sd${local.home_volume_letter}"
  instance_id = "${aws_instance.dev_machine.*.id[count.index]}"
  volume_id = "${aws_ebs_volume.dev_machine_home.*.id[count.index]}"
}

// -----------------------------------------------------------------
// common, modules, data

resource "aws_route_table" "internet" {
  vpc_id = "${var.vpc_id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${var.gateway_id}"
  }

  tags = {
    Name = "${local.base_name}-internet-egress"
  }
}

resource "aws_security_group" "internet_egress" {
  name = "${local.base_name}-egress"
  description = "Allow dev-machines to access internet"
  vpc_id = "${var.vpc_id}"
}

resource "aws_security_group_rule" "internet_egress" {
  type = "egress"
  from_port = 0
  to_port = 65535
  protocol = "tcp"

  security_group_id = "${aws_security_group.internet_egress.id}"
  cidr_blocks = ["0.0.0.0/0"]
}

module "dev_machine_sg" {
  source = "../sg-pair"

  name = "${local.base_name}-dev-machine"
  from_port = 22
  to_port = 22
  vpc_id = "${var.vpc_id}"
}

module "ami" {
  source = "../ami"
}

module "devs" {
  source = "../devs"

  userids = "${var.devs}"
}

data "aws_route53_zone" "auderenow_io" {
  name = "auderenow.io."
}

locals {
  base_name = "flu-${var.environment}-dev"
  bastion_port = 12893
  home_volume_letter = "h"

  subnet_dev_bastion_cidr = "${cidrsubnet(var.dev_cidr, 1, 0)}"
  subnet_dev_machine_cidr = "${cidrsubnet(var.dev_cidr, 1, 1)}"
}
