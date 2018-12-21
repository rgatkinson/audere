// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

resource "aws_vpc" "dev" {
  cidr_block = "${local.vpc_dev_cidr}"

  tags = {
    Name = "vpc-dev"
  }
}

resource "aws_subnet" "dev_bastion" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_dev_bastion_cidr}"
  map_public_ip_on_launch = false
  vpc_id = "${aws_vpc.dev.id}"

  tags = {
    Name = "subnet-dev-bastion"
  }
}

resource "aws_subnet" "dev_machine" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_dev_machine_cidr}"
  map_public_ip_on_launch = false
  vpc_id = "${aws_vpc.dev.id}"

  tags = {
    Name = "subnet-dev-machine"
  }
}

resource "aws_security_group" "bastion" {
  name = "sg-bastion"
  description = "Allow traffic from known IP addresses to access bastion"
  vpc_id = "${aws_vpc.dev.id}"
}

resource "aws_security_group_rule" "bastion_ingress" {
  type = "ingress"
  from_port = "${local.bastion_port}"
  to_port = "${local.bastion_port}"
  protocol = "tcp"

  security_group_id = "${aws_security_group.bastion.id}"
  cidr_blocks = ["${var.bastion_cidr_blocks}"]
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

resource "aws_instance" "bastion" {
  ami = "${module.ami.ubuntu}"
  availability_zone = "${var.availability_zone}"
  instance_type = "t3.nano"
  subnet_id = "${aws_subnet.dev_bastion.id}"
  user_data = "${data.template_file.provision_bastion_sh.rendered}"

  root_block_device {
    volume_type = "gp2"
    volume_size = 15
  }

  vpc_security_group_ids = [
    "${aws_security_group.bastion.id}"
  ]

  tags {
    Name = "dev-bastion"
  }

  volume_tags {
    Name = "dev-bastion-root"
  }
}

data "template_file" "provision_bastion_sh" {
  template = "${file("provision-bastion.sh")}"
  vars {
    bastion_port = "${local.bastion_port}"
    ssh_public_key_map = "${jsonencode(module.devs.ssh_keys)}"
    util_sh = "${file("../modules/assets/util.sh")}"
  }
}

resource "aws_instance" "dev_machine" {
  count = "${length(local.devs)}"

  ami = "${module.ami.ubuntu}"
  availability_zone = "${var.availability_zone}"
  instance_type = "${var.instance_type}"
  subnet_id = "${aws_subnet.dev_machine.id}"
  user_data = "${data.template_file.provision_dev_sh.*.rendered[count.index]}"

  root_block_device {
    volume_type = "gp2"
    volume_size = 15
  }

  vpc_security_group_ids = [
    "${module.dev_machine_sg.server_id}",
    "${module.dev_debug_sg.client_id}",
  ]

  tags {
    Name = "${local.devs[count.index]}-dev"
  }

  volume_tags {
    Name = "${local.devs[count.index]}-dev-root"
  }
}

data "template_file" "provision_dev_sh" {
  count = "${length(local.devs)}"

  template = "${file("provision-dev.sh")}"
  vars {
    util_sh = "${file("../modules/assets/util.sh")}"
    home_volume_letter = "${local.home_volume_letter}"
    ssh_public_key = "${lookup(module.devs.ssh_keys, local.devs[count.index])}"
    userid = "${local.devs[count.index]}"
  }
}

resource "aws_ebs_volume" "dev_machine_home" {
  count = "${length(local.devs)}"

  availability_zone = "${var.availability_zone}"
  encrypted = true
  size = "${var.home_size_gb}"
  type = "gp2"

  tags {
    Name = "${local.devs[count.index]}-dev-home"
  }
}

resource "aws_volume_attachment" "dev_machine_home" {
  count = "${length(local.devs)}"

  device_name = "/dev/sd${local.home_volume_letter}"
  instance_id = "${aws_instance.dev_machine.*.id[count.index]}"
  volume_id = "${aws_ebs_volume.dev_machine_home.*.id[count.index]}"
}

resource "aws_route53_record" "api_record" {
  count = "${length(local.devs)}"

  zone_id = "${data.aws_route53_zone.auderenow_io.id}"
  name = "${local.devs[count.index]}-dev.${data.aws_route53_zone.auderenow_io.name}"
  type = "A"
  ttl = "300"
  records = ["${aws_instance.dev_machine.*.public_ip[count.index]}"]
}

module "ami" {
  source = "../modules/ami"
}

module "devs" {
  source = "../modules/devs"
}

data "aws_security_group" "ssh" {
  name = "ssh"
}

data "aws_route53_zone" "auderenow_io" {
  name = "auderenow.io."
}

locals {
  bastion_port = 12893
  devs = "${keys(module.devs.ssh_keys)}"
  home_volume_letter = "h"
}
