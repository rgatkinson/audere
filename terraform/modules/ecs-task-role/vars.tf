// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "account" {
  description = "Identifier for the AWS account"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
}

variable "policies" {
  description = "Additional policy ARNs to attach to the task execution role"
  type = "list"
  default = []
}

variable "policy_count" {
  description = "Number of additional policies to attach to the role"
  default = "0"
}

variable "region" {
  description = "Targeted AWS region"
}

variable "task_alias" {
  description = "Alias for the task being created"
}

variable "ssm_parameters_key_arn" {
  description = "ARN of key needed to decrypt SSM parameters"
}
