// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// --------------------------------------------------------------------------------
// Environment VPC basics

resource "aws_vpc" "env_vpc" {
  cidr_block = "${var.vpc_cidr}"
  enable_dns_support = true
  enable_dns_hostnames = true

  tags = {
    Name = "vpc-${var.environment}"
  }
}

// Block all traffic for default security group.
resource "aws_default_security_group" "default" {
  vpc_id = "${aws_vpc.env_vpc.id}"
}

resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = "${var.vpc_flow_log_role_arn}"
  log_destination = "${var.vpc_flow_log_arn}"
  traffic_type    = "ALL"
  vpc_id          = "${aws_vpc.env_vpc.id}"
}

resource "aws_internet_gateway" "gw" {
  vpc_id = "${aws_vpc.env_vpc.id}"

  tags = {
    Name = "gw-${var.environment}"
  }
}

// --------------------------------------------------------------------------------
// Subnets

resource "aws_route_table_association" "app" {
  subnet_id      = "${aws_subnet.app.id}"
  route_table_id = "${aws_route_table.rt.id}"
}

resource "aws_subnet" "app" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_app_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${aws_vpc.env_vpc.id}"

  tags = {
    Name = "${local.api_base_name}-instance"
  }
}

resource "aws_route_table_association" "app_b" {
  subnet_id      = "${aws_subnet.app_b.id}"
  route_table_id = "${aws_route_table.rt.id}"
}

resource "aws_subnet" "app_b" {
  availability_zone = "${var.secondary_availability_zone}"
  cidr_block = "${local.subnet_app_b_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${aws_vpc.env_vpc.id}"

  tags = {
    Name = "${local.api_base_name}-instance-b"
  }
}

resource "aws_route_table_association" "bastion_internet" {
  subnet_id      = "${aws_subnet.bastion.id}"
  route_table_id = "${aws_route_table.rt.id}"
}

resource "aws_subnet" "bastion" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_dev_bastion_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${aws_vpc.env_vpc.id}"

  tags = {
    Name = "${local.dev_base_name}-bastion"
  }
}

resource "aws_route_table_association" "dev_machine_internet" {
  subnet_id      = "${aws_subnet.dev_machine.id}"
  route_table_id = "${aws_route_table.rt.id}"
}

resource "aws_subnet" "dev_machine" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_dev_machine_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${aws_vpc.env_vpc.id}"

  tags = {
    Name = "${local.dev_base_name}-dev"
  }
}

resource "aws_subnet" "db_pii" {
  availability_zone = "${var.pii_availability_zone}"
  cidr_block = "${local.subnet_db_pii_cidr}"
  map_public_ip_on_launch = false
  vpc_id = "${aws_vpc.env_vpc.id}"

  tags = {
    Name = "${local.db_base_name}-pii"
  }
}

resource "aws_subnet" "db_nonpii" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_db_nonpii_cidr}"
  map_public_ip_on_launch = false
  vpc_id = "${aws_vpc.env_vpc.id}"

  tags = {
    Name = "${local.db_base_name}-nonpii"
  }
}

resource "aws_route_table_association" "transient" {
  subnet_id      = "${aws_subnet.transient.id}"
  route_table_id = "${aws_route_table.rt.id}"
}

resource "aws_subnet" "transient" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${local.subnet_transient_cidr}"
  map_public_ip_on_launch = true
  vpc_id = "${aws_vpc.env_vpc.id}"

  tags = {
    Name = "${local.api_base_name}-transient"
  }
}

// --------------------------------------------------------------------------------
// Security groups

module "db_sg" {
  source = "../sg-pair"

  name = "${local.db_base_name}-db"
  from_port = 5432
  to_port = 5432
  vpc_id = "${aws_vpc.env_vpc.id}"
}

module "dev_machine_sg" {
  source = "../sg-pair"

  name = "${local.dev_base_name}-dev-machine"
  from_port = 22
  to_port = 22
  vpc_id = "${aws_vpc.env_vpc.id}"
}

module "dev_ssh_sg" {
  source = "../sg-pair"

  name = "${local.db_base_name}-ssh"
  from_port = 22
  to_port = 22
  vpc_id = "${aws_vpc.env_vpc.id}"
}

module "fluapi_internal_sg" {
  source = "../sg-pair"

  name = "${local.api_base_name}-elb"
  from_port = 444
  to_port = 444
  vpc_id = "${aws_vpc.env_vpc.id}"
}

module "fluapi_sg" {
  source = "../sg-pair"

  name = "${local.api_base_name}"
  from_port = 443
  to_port = 444
  vpc_id = "${aws_vpc.env_vpc.id}"
}

module "reporting_sg" {
  source = "../sg-pair"

  name = "${local.api_base_name}-reporting"
  from_port = 80
  to_port = 80
  vpc_id = "${aws_vpc.env_vpc.id}"
}

resource "aws_security_group" "bastion_ingress" {
  name = "${local.dev_base_name}-bastion"
  description = "Allow bastion ingress from known public IP addresses"
  vpc_id = "${aws_vpc.env_vpc.id}"
}

resource "aws_security_group_rule" "bastion_ingress" {
  type = "ingress"
  from_port = "${var.bastion_port}"
  to_port = "${var.bastion_port}"
  protocol = "tcp"

  security_group_id = "${aws_security_group.bastion_ingress.id}"
  cidr_blocks = "${var.bastion_cidr_whitelist}"
}

resource "aws_security_group" "internet_egress" {
  name = "${local.api_base_name}-egress"
  description = "Allow instances access to the internet"
  vpc_id = "${aws_vpc.env_vpc.id}"
}

resource "aws_security_group_rule" "internet_egress" {
  type = "egress"
  from_port = 0
  to_port = 65535
  protocol = "tcp"

  security_group_id = "${aws_security_group.internet_egress.id}"
  cidr_blocks = ["0.0.0.0/0"]
}

resource "aws_security_group" "public_http" {
  name = "${local.api_base_name}-public-http"
  description = "Allow http/https traffic to ELB"
  vpc_id = "${aws_vpc.env_vpc.id}"
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

// --------------------------------------------------------------------------------
// Locals

locals {
  // TODO: This module combines resources from pre-existing modules that used
  // different naming strategies. We're preserving the different names since
  // renaming security groups creates new resources.  In the future it would
  // be nice to be able to rename security groups for consistency.
  api_base_name = "flu-${var.environment}-api"
  db_base_name = "flu-${var.environment}-db"
  dev_base_name = "flu-${var.environment}-dev"

  subnet_app_cidr = "${cidrsubnet(var.app_cidr, 2, 0)}"
  subnet_transient_cidr = "${cidrsubnet(var.app_cidr, 2, 1)}"
  subnet_app_b_cidr = "${cidrsubnet(var.app_cidr, 2, 2)}"
  subnet_app_private_cidr = "${cidrsubnet(var.app_cidr, 2, 3)}"
  subnet_db_pii_cidr = "${cidrsubnet(var.db_cidr, 2, 0)}"
  subnet_db_nonpii_cidr = "${cidrsubnet(var.db_cidr, 2, 1)}"
  subnet_dev_bastion_cidr = "${cidrsubnet(var.dev_cidr, 1, 0)}"
  subnet_dev_machine_cidr = "${cidrsubnet(var.dev_cidr, 1, 1)}"
}
