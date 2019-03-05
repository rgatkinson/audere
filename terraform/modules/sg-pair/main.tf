// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// Inputs

variable "vpc_id" {
  description = "VPC in which to create the security groups"
  type = "string"
}

variable "name" {
  description = "Name for security groups.  Server will be named as '{name}, client as '{name}-client'."
  type = "string"
}

variable "from_port" {
  description = "Port on which to allow traffic between the two groups."
  type = "string"
}

variable "to_port" {
  description = "Upper on which to allow traffic"
  type = "string"
}

variable "protocol" {
  description = "Protocol for allowed traffic between the two groups."
  default = "tcp"
}

// Outputs

output "server_id" {
  value = "${aws_security_group.server.id}"
}

output "client_id" {
  value = "${aws_security_group.client.id}"
}

// Logic

resource "aws_security_group" "server" {
  name = "${var.name}"
  description = "Allow incoming traffic from ${var.name}-client (${local.port_description})."
  vpc_id = "${var.vpc_id}"
}

resource "aws_security_group" "client" {
  name = "${var.name}-client"
  description = "Allow outgoing traffic to ${var.name} (${local.port_description})."
  vpc_id = "${var.vpc_id}"
}

resource "aws_security_group_rule" "ingress" {
  type = "ingress"
  from_port = "${var.from_port}"
  to_port = "${var.to_port}"
  protocol = "${var.protocol}"

  security_group_id = "${aws_security_group.server.id}"
  source_security_group_id = "${aws_security_group.client.id}"
}

resource "aws_security_group_rule" "egress" {
  type = "egress"
  from_port = "${var.from_port}"
  to_port = "${var.to_port}"
  protocol = "${var.protocol}"

  security_group_id = "${aws_security_group.client.id}"
  source_security_group_id = "${aws_security_group.server.id}"
}

locals {
  port_description = "${(var.from_port == var.to_port) ? "port ${var.to_port}" : "port range ${var.from_port} - ${var.to_port}"}"
}
