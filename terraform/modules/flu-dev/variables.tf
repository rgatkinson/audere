// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "availability_zone" {
  default = "us-west-2a"
}

variable "bastion_ingress_sg_id" {
  description = "Security group to open bastion server ingress"
  type = "string"
}

variable "bastion_port" {
  description = "Port to open on the bastion host."
  default = 12893
}

variable "bastion_subnet_id" {
  description = "Subnet in which the bastion server should be deployed"
  type = "string"
}

variable "db_client_sg_id" {
  description = "Id of client security group to enable db access"
}

variable "dev_machine_client_sg_id" {
  description = "Security group to allow a resource to talk to dev machines"
  type = "string"
}

variable "dev_machine_server_sg_id" {
  description = "Security group to restrict access to dev machines"
  type = "string"
}

variable "dev_machine_subnet_id" {
  description = "Subnet in which dev machines should be deployed"
  type = "string"
}

variable "dev_ssh_client_sg_id" {
  description = "Id of client security group to enable ssh access"
}

variable "devs" {
  description = "Userids for developers who should have a dev machine in this environment"
  type = "list"
}

variable "fluapi_internal_client_sg_id" {
  description = "Id of client security group to enable access to internal API"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
}

variable "home_size_gb" {
  default = 20
}

variable "instance_type" {
  default = "t3.small"
}

variable "internet_egress_sg_id" {
  description = "Security group to open internet egress"
  type = "string"
}

variable "proxies" {
  description = "Userids for proxy accounts who need bastion access but not a dev machine"
  default = []
}
