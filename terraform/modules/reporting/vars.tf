// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "account" {
  description = "Identifier for the AWS account"
}

variable "app_subnet_id" {
  description = "Subnet in which applications should be deployed"
}

variable "auderenow_certificate_arn" {
  description = "ARN for the certificate to associate with the Route53 record"
}

variable "auderenow_route53_zone_id" {
  description = "Identifier for the Route53 hosted zone"
}

variable "auderenow_route53_zone_name" {
  description = "Name for the Route53 hosted zone"
}

variable "ecs_cluster_id" {
  description = "Identifier for ECS cluster to run reporting applications"
}

variable "ecs_service_linked_role_arn" {
  description = "ARN of the role linked to the ECS service on this account"
}

variable "elb_logs_bucket_id" {
  description = "Identifier for bucket to capture ELB access logs"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
}

variable "metabase_database_address" {
  description = "Address for Metabase datastore"
}

variable "public_http_sg_id" {
  description = "Security group to open public HTTP/S ingress"
}

variable "region" {
  description = "Targeted AWS region"
}

variable "reporting_client_sg_id" {
  description = "Security group to open reporting client traffic"
}

variable "ssm_parameters_key_arn" {
  description = "ARN of key needed to decrypt SSM parameters"
}
