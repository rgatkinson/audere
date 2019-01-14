// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "bucket_name" {
  description = "Name of S3 bucket where we store DB logs"
  type = "string"
}

variable "db_name" {
  description = "Name/identifier of RDS instance"
  type = "string"
}
