// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "environment" {
  description = "One of 'staging' or 'prod'"
  type = "string"
}

variable "base_name" {
  description = "Base name to use to name things we create"
  type = "string"
}

variable "db_name" {
  description = "Name of RDS instance"
  type = "string"
}

variable "db_logs_arn" {
  description = "Name of S3 bucket where we store DB logs"
  type = "string"
}

variable "availability_zone" {
  default = "us-west-2a"
}
