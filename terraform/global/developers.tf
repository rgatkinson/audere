// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// -----------------------------------------------------------------
// Dev VPC

resource "aws_vpc" "dev" {
  assign_generated_ipv6_cidr_block = true
  cidr_block = "${local.vpc_dev_cidr}"
  enable_dns_support = true
  enable_dns_hostnames = true

  tags = {
    Name = "vpc-dev"
  }
}

resource "aws_flow_log" "dev_vpc_flow_log" {
  iam_role_arn    = "${aws_iam_role.vpc_flow_log_role.arn}"
  log_destination = "${aws_cloudwatch_log_group.vpc_flow_log.arn}"
  traffic_type    = "ALL"
  vpc_id          = "${aws_vpc.dev.id}"
}

resource "aws_egress_only_internet_gateway" "dev_ipv6_egress" {
  vpc_id = "${aws_vpc.dev.id}"
}

resource "aws_internet_gateway" "dev_gateway" {
  vpc_id = "${aws_vpc.dev.id}"

  tags = {
    Name = "dev-gateway-gateway"
  }
}

# resource "aws_eip" "dev_machine_ipv4_nat" {
#   vpc = true
#   depends_on = ["${aws_internet_gateway.dev_ipv4}"]
# }

# resource "aws_nat_gateway" "dev_machine_ipv4" {
#   allocation_id = ""
#   subnet_id = "${aws_subnet.dev_machine}"

#   tags = {
#     Name = "dev-nat-gateway"
#   }

#   depends_on = ["${aws_internet_gateway.dev_ipv4}"]
# }

// -----------------------------------------------------------------
// Bastion

resource "aws_subnet" "bastion" {
  assign_ipv6_address_on_creation = true
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_dev_bastion_cidr}"
  ipv6_cidr_block = "${local.dev_bastion_ipv6_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${aws_vpc.dev.id}"

  tags = {
    Name = "subnet-dev-bastion"
  }
}

resource "aws_route_table" "bastion" {
  vpc_id = "${aws_vpc.dev.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.dev_gateway.id}"
  }

  route {
    ipv6_cidr_block        = "::/0"
    gateway_id = "${aws_internet_gateway.dev_gateway.id}"
  }

  tags = {
    Name = "bastion"
  }
}

resource "aws_route_table_association" "bastion" {
  subnet_id      = "${aws_subnet.bastion.id}"
  route_table_id = "${aws_route_table.bastion.id}"
}

resource "aws_security_group" "bastion" {
  name = "bastion"
  description = "Allow bastion ingress from known IP addresses and general egress"
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

resource "aws_security_group_rule" "bastion_egress" {
  type = "egress"
  from_port = 0
  to_port = 65535
  protocol = "tcp"

  security_group_id = "${aws_security_group.bastion.id}"
  cidr_blocks = ["0.0.0.0/0"]
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
    "${aws_security_group.bastion.id}",
    "${module.dev_machine_sg.client_id}"
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

// -----------------------------------------------------------------
// Dev-machine

resource "aws_subnet" "dev_machine" {
  assign_ipv6_address_on_creation = true
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_dev_machine_cidr}"
  ipv6_cidr_block = "${local.dev_machine_ipv6_cidr}"
  map_public_ip_on_launch = true  # TODO: remove?
  vpc_id = "${aws_vpc.dev.id}"

  tags = {
    Name = "subnet-dev-machine"
  }
}

resource "aws_route_table" "dev_machine" {
  vpc_id = "${aws_vpc.dev.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.dev_gateway.id}"
  }

  route {
    ipv6_cidr_block        = "::/0"
    # egress_only_gateway_id = "${aws_egress_only_internet_gateway.dev_ipv6_egress.id}"
    gateway_id = "${aws_internet_gateway.dev_gateway.id}"
  }

  tags = {
    Name = "dev-machine"
  }
}

resource "aws_route_table_association" "dev_machine" {
  subnet_id      = "${aws_subnet.dev_machine.id}"
  route_table_id = "${aws_route_table.dev_machine.id}"
}

resource "aws_security_group" "dev_machine_egress" {
  name = "dev-machine-egress"
  description = "Allow dev-machines to access internet over IPv6"
  vpc_id = "${aws_vpc.dev.id}"
}

resource "aws_security_group_rule" "dev_machine_egress" {
  type = "egress"
  from_port = 0
  to_port = 65535
  protocol = "tcp"

  security_group_id = "${aws_security_group.dev_machine_egress.id}"
  cidr_blocks = ["0.0.0.0/0"]
  ipv6_cidr_blocks = ["::/0"]
}

resource "aws_instance" "dev_machine" {
  count = "${length(local.devs)}"

  ami = "${module.ami.ubuntu}"
  availability_zone = "${var.availability_zone}"
  instance_type = "${var.instance_type}"
  ipv6_address_count = 1
  subnet_id = "${aws_subnet.dev_machine.id}"
  user_data = "${data.template_file.provision_dev_sh.*.rendered[count.index]}"

  # TODO remove
  key_name = "2018-mmarucheck"

  root_block_device {
    volume_type = "gp2"
    volume_size = 15
  }

  vpc_security_group_ids = [
    "${module.dev_machine_sg.server_id}",
    "${aws_security_group.dev_machine_egress.id}",
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

// -----------------------------------------------------------------
// modules, data

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

  dev_machine_ipv6_cidr = "${cidrsubnet(aws_vpc.dev.ipv6_cidr_block, 8, 0)}"
  dev_bastion_ipv6_cidr = "${cidrsubnet(aws_vpc.dev.ipv6_cidr_block, 8, 255)}"
}
