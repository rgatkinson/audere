// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "bucket_arn" {
  description = "Name of S3 bucket where we store DB logs"
  type = "string"
}

variable "db_name" {
  description = "Name/identifier of RDS instance"
  type = "string"
}

variable "security_group_ids" {
  description = "IDs of the security groups the archiver should use"
  default = []
}

variable "subnet_id" {
  description = "ID of the subnet where the archiver should run"
  type = "string"
}
