// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "availability_zone" {
  default = "us-west-2a"
}

variable "bastion_cidr_whitelist" {
  description = "CIDR blocks for source IPs allowed to connect to bastion server"
  type = "list"
}

variable "dev_cidr" {
  description = "CIDR block in which to allocate subnets for this environment"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
}

variable "fludb_client_sg_id" {
  description = "Id of client security group to enable db access"
}

variable "fludev_ssh_client_sg_id" {
  description = "Id of client security group to enable ssh access"
}

variable "gateway_id" {
  description = "Gateway id for internet access from VPC"
  type = "string"
}

variable "home_size_gb" {
  default = 20
}

variable "instance_type" {
  default = "t3.nano"
}

variable "vpc_id" {
  description = "VPC id for adding subnets"
  type = "string"
}
