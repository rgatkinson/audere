// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// -----------------------------------------------------------------
// Bastion

resource "aws_instance" "bastion" {
  ami = "${module.ami.ubuntu}"
  availability_zone = "${var.availability_zone}"
  instance_type = "t3.nano"
  subnet_id = "${var.bastion_subnet_id}"
  user_data = "${data.template_file.provision_bastion_sh.rendered}"

  root_block_device {
    volume_type = "gp2"
    volume_size = 15
  }

  vpc_security_group_ids = [
    "${var.internet_egress_sg_id}",
    "${var.bastion_ingress_sg_id}",
    "${var.dev_machine_client_sg_id}"
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
    bastion_port = "${var.bastion_port}"
    ssh_public_key_map = "${module.devs_and_proxies.ssh_key_json}"
    util_sh = "${file("${path.module}/../assets/util.sh")}"
  }
}

// -----------------------------------------------------------------
// Dev-machine

resource "aws_instance" "dev_machine" {
  count = "${length(var.devs)}"

  ami = "${module.ami.ubuntu}"
  availability_zone = "${var.availability_zone}"
  instance_type = "${var.instance_type}"
  # ipv6_address_count = 1
  subnet_id = "${var.dev_machine_subnet_id}"
  user_data = "${data.template_file.provision_dev_sh.*.rendered[count.index]}"

  root_block_device {
    volume_type = "gp2"
    volume_size = 15
  }

  vpc_security_group_ids = [
    "${var.dev_machine_server_sg_id}",
    "${var.internet_egress_sg_id}",
    "${var.dev_ssh_client_sg_id}",
    "${var.db_client_sg_id}",
    "${var.fluapi_internal_client_sg_id}",
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

module "ami" {
  source = "../ami"
}

module "devs" {
  source = "../devs"

  userids = "${var.devs}"
}

module "devs_and_proxies" {
  source = "../devs"

  userids = "${concat(var.devs, var.proxies)}"
}
data "aws_route53_zone" "auderenow_io" {
  name = "auderenow.io."
}

locals {
  base_name = "flu-${var.environment}-dev"
  home_volume_letter = "h"
}
