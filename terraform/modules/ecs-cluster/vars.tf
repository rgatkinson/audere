// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "cluster_name" {
  description = "ECS cluster name"
  type = "string"
}

variable "environment" {
  description = "Environment"
  type = "string"
}

variable "iam_instance_profile" {
  description = "The IAM instance profile to associate with launched instances"
  type = "string"
}

variable "subnet_ids" {
  description = "A list of subnet IDs to launch resources in"
  type = "list"
}

variable "security_groups" {
  description = "A list of security group IDs to associate"
  type = "list"
}
