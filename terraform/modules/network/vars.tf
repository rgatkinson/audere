// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "app_cidr" {
  description = "CIDR for private subnets in app tier."
  type = "string"
}

variable "availability_zone" {
  description = "Availability zone in which subnets will reside."
  type = "string"
  default = "us-west-2a"
}

variable "secondary_availability_zone" {
  description = "Secondary/backup availability zone for high-availability"
  type = "string"
  default = "us-west-2b"
}

variable "bastion_cidr_whitelist" {
  description = "CIDR blocks for source IPs allowed to connect to bastion server."
  type = "list"
}

variable "bastion_port" {
  description = "Port to open on the bastion host."
  default = 12893
}

variable "db_cidr" {
  description = "CIDR for private subnets in database tier."
  type = "string"
}

variable "dev_cidr" {
  description = "CIDR for private subnets in dev tier."
  type = "string"
}

variable "environment" {
  description = "Name associated with the environment - current one of 'staging' or 'prod'."
  type = "string"
}

variable "pii_availability_zone" {
  description = "Availability zone in which PII subnets and resources will reside."
  type = "string"
  default = "us-west-2b"
}

variable "vpc_cidr" {
  description = "CIDR for VPC containing all subnets for this environment."
  type = "string"
}

variable "vpc_flow_log_arn" {
  description = "ARN for aws_flow_log.log_destination to set up VPC flow logging."
  type = "string"
}

variable "vpc_flow_log_role_arn" {
  description = "ARN for aws_flow_log.iam_role_arn to set up VPC flow logging."
  type = "string"
}
