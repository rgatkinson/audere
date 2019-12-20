// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "chills_virena_bucket_arn" {
  description = "ARN of bucket where Virena reports are stored"
  type = "string"
}

variable "chills_virena_bucket_id" {
  description = "Name of bucket where Virena reports are stored"
  type = "string"
}

variable "cough_aspren_bucket_arn" {
  description = "ARN of bucket where ASPREN reports are stored"
  type = "string"
}

variable "cough_aspren_bucket_id" {
  description = "Name of bucket where ASPREN reports are stored"
  type = "string"
}

variable "cough_follow_ups_bucket_arn" {
  description = "ARN of bucket where follow up surveys are stored"
  type = "string"
}

variable "cough_follow_ups_bucket_id" {
  description = "Name of bucket where follow up surveys are stored"
  type = "string"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
  type = "string"
}

variable "evidation_bucket_arn" {
  description = "ARN of bucket where Evidation reports are stored"
  type = "string"
}

variable "evidation_bucket_id" {
  description = "ID of bucket where Evidation reports are stored"
  type = "string"
}

variable "fluapi_fqdn" {
  description = "Fully qualified domain name for FluApi"
  type = "string"
}

variable "internal_elb_access_sg" {
  description = "Security group to open internal ELB traffic"
  type = "string"
}

variable "internet_egress_sg" {
  description = "Security group to open internet egress"
  type = "string"
}

variable "infra_alerts_sns_topic_arn" {
  description = "ARN of SNS topic for publishing alarms"
  type = "string"
}

variable "lambda_subnet_id" {
  description = "Subnet in which the Lambda should be deployed"
  type = "string"
}
