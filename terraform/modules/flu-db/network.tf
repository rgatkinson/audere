// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

resource "aws_vpc" "fludb" {
  cidr_block = "${var.vpc_cidr}"
  enable_dns_support = true
  enable_dns_hostnames = true

  tags = {
    Name = "vpc-flu-${var.environment}"
  }
}

resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = "${var.vpc_flow_log_role_arn}"
  log_destination = "${var.vpc_flow_log_arn}"
  traffic_type    = "ALL"
  vpc_id          = "${aws_vpc.fludb.id}"
}

resource "aws_subnet" "fludb" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_db_primary_cidr}"
  map_public_ip_on_launch = false
  vpc_id = "${aws_vpc.fludb.id}"

  tags = {
    Name = "subnet-${local.base_name}"
  }
}

resource "aws_subnet" "fludb_secondary" {
  availability_zone = "${var.backup_availability_zone}"
  cidr_block = "${local.subnet_db_secondary_cidr}"
  map_public_ip_on_launch = false
  vpc_id = "${aws_vpc.fludb.id}"

  tags = {
    Name = "subnet-${local.base_name}-secondary"
  }
}

resource "aws_db_subnet_group" "fludb" {
  name = "${local.base_name}"
  subnet_ids = [
    "${aws_subnet.fludb.id}",
    "${aws_subnet.fludb_secondary.id}",
  ]
  tags = {
    Name = "${local.base_name}"
  }
}

module "fludb_sg" {
  source = "../sg-pair"

  name = "flu-db"
  port = 5432
  vpc_id = "${aws_vpc.fludb.id}"
}

resource "aws_internet_gateway" "flu_gw" {
  vpc_id = "${aws_vpc.fludb.id}"

  tags = {
    Name = "provision-${local.base_name}"
  }
}

resource "aws_route_table" "fludb_rt" {
  vpc_id = "${aws_vpc.fludb.id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${aws_internet_gateway.flu_gw.id}"
  }

  tags = {
    Name = "${local.base_name}"
  }
}

resource "aws_route_table_association" "provision" {
  subnet_id      = "${aws_subnet.provision.id}"
  route_table_id = "${aws_route_table.fludb_rt.id}"
}

resource "aws_subnet" "provision" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_db_provision_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${aws_vpc.fludb.id}"

  tags = {
    Name = "subnet-${local.base_name}-provision"
  }
}

resource "aws_security_group" "provision" {
  name = "provision"
  description = "Allow provision to have general egress"
  vpc_id = "${aws_vpc.fludb.id}"
}

resource "aws_security_group_rule" "provision_egress" {
  type = "egress"
  from_port = 0
  to_port = 65535
  protocol = "tcp"

  security_group_id = "${aws_security_group.provision.id}"
  cidr_blocks = ["0.0.0.0/0"]
}

locals {
  subnet_db_primary_cidr = "${cidrsubnet(var.db_cidr, 2, 0)}"
  subnet_db_secondary_cidr = "${cidrsubnet(var.db_cidr, 2, 1)}"
  subnet_db_provision_cidr = "${cidrsubnet(var.db_cidr, 2, 2)}"
}