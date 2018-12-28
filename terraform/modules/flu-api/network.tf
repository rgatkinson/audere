// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

resource "aws_route_table" "fluapi_rt" {
  vpc_id = "${var.vpc_id}"

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = "${var.gateway_id}"
  }

  tags = {
    Name = "${local.base_name}"
  }
}

resource "aws_route_table_association" "elb" {
  subnet_id      = "${aws_subnet.elb.id}"
  route_table_id = "${aws_route_table.fluapi_rt.id}"
}

resource "aws_subnet" "elb" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_public_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "subnet-${local.base_name}-elb"
  }
}

resource "aws_route_table_association" "api" {
  subnet_id      = "${aws_subnet.api.id}"
  route_table_id = "${aws_route_table.fluapi_rt.id}"
}

resource "aws_subnet" "api" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_api_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "subnet-${local.base_name}-instance"
  }
}

resource "aws_route_table_association" "migrate" {
  subnet_id      = "${aws_subnet.migrate.id}"
  route_table_id = "${aws_route_table.fluapi_rt.id}"
}

resource "aws_subnet" "migrate" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_migrate_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "subnet-${local.base_name}-migrate"
  }
}

// Security groups

module "fluapi_sg" {
  source = "../sg-pair"

  name = "${local.base_name}"
  port = 443
  vpc_id = "${var.vpc_id}"
}

resource "aws_security_group" "internet_egress" {
  name = "${local.base_name}-egress"
  description = "Allow instances access to the internet"
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

resource "aws_security_group" "migrate" {
  name = "${local.base_name}-migrate"
  description = "Allow migrate to have general egress"
  vpc_id = "${var.vpc_id}"
}

resource "aws_security_group_rule" "migrate_ingress" {
  type = "ingress"
  from_port = 22
  to_port = 22
  protocol = "tcp"

  security_group_id = "${aws_security_group.migrate.id}"
  cidr_blocks = ["24.16.71.212/32"]
}

resource "aws_security_group" "public_http" {
  name = "${local.base_name}-public-http"
  description = "Allow http/https traffic to ELB"
  vpc_id = "${var.vpc_id}"
}

resource "aws_security_group_rule" "public_https" {
  type = "ingress"
  from_port = 443
  to_port = 443
  protocol = "tcp"

  security_group_id = "${aws_security_group.public_http.id}"
  cidr_blocks = ["0.0.0.0/0"]
}

resource "aws_security_group_rule" "public_http" {
  type = "ingress"
  from_port = 80
  to_port = 80
  protocol = "tcp"

  security_group_id = "${aws_security_group.public_http.id}"
  cidr_blocks = ["0.0.0.0/0"]
}

data "aws_security_group" "ssh" { name = "ssh" }

locals {
  subnet_api_cidr = "${cidrsubnet(var.subnet_api_cidr, 1, 0)}"
  subnet_migrate_cidr = "${cidrsubnet(var.subnet_api_cidr, 1, 1)}"
  subnet_public_cidr = "${var.subnet_public_cidr}"
}