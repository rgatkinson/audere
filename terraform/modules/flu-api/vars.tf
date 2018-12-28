// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "environment" {
  description = "One of 'staging' or 'prod'"
}

variable "service" {
  description = "Service mode, one of 'offline', 'single', 'elb'"
}

variable "migrate" {
  description = "Cycle this false -> true -> false to run a db migration"
}

variable "api_cidr" {
  description = "CIDR for private subnets in api tier."
  type = "string"
}

variable "public_cidr" {
  description = "CIDR for public subnet we create for the application load balancer and any other public endpoints."
  type = "string"
}

variable "vpc_id" {
  description = "VPC id for adding subnets"
  type = "string"
}

variable "gateway_id" {
  description = "Gateway id for internet access from VPC"
  type = "string"
}

variable "fludb_client_sg_id" {
  description = "Id of client security group to enable db access"
}

variable "fludev_ssh_server_sg_id" {
  description = "Id of server security group to enable ssh access"
}


variable "availability_zone" {
  default = "us-west-2a"
}

variable "commit" {
  description = "Git commit tag (or hash) to sync"
  default = "master"
}

variable "creds_snapshot_id" {
  description = "snapshot id of volume containing api credentials"
}

variable "ami_id" {
  description = "ami id to use"
}