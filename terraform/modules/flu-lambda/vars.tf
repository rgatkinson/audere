// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "environment" {
  description = "One of 'staging' or 'prod'"
  type = "string"
}

variable "lambda_subnet_id" {
  description = "Subnet in which the Lambda should be deployed."
  type = "string"
}

variable "lambda_sg_ids" {
  description = "Security groups to apply to the Lambda function."
  type = "list"
}

variable "fluapi_fqdn" {
  description = "Fully qualified domain name for FluApi"
  type = "string"
}
