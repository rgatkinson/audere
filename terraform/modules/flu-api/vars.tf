// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "account" {
  description = "Identifier for the AWS account"
}

variable "app_subnet_id" {
  description = "Subnet in which applications should be deployed"
  type = "string"
}

variable "app_b_subnet_id" {
  description = "Backup subnet in which applications should be deployed"
}

variable "audere_share_bucket" {
  description = "ARN for public S3 bucket"
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

variable "cough_aspren_bucket" {
  description = "ARN for S3 bucket containing ASPREN reports"
}

variable "cough_qualtrics_bucket" {
  description = "ARN for S3 bucket containing Qualtrics surveys"
}

variable "db_client_sg_id" {
  description = "Security group to open database client traffic"
  type = "string"
}

variable "dev_ssh_server_sg_id" {
  description = "Security group to open SSH server traffic"
  type = "string"
}

variable "ecs_cluster_id" {
  description = "Identifier for ECS cluster to run reporting applications"
}

variable "ecs_cluster_name" {
  description = "Name for ECS cluster to run reporting applications"
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

variable "fluapi_internal_client_sg_id" {
  description = "Security group to open internal Flu API client traffic"
  type = "string"
}

variable "fluapi_internal_server_sg_id" {
  description = "Security group to open internal Flu API server traffic"
  type = "string"
}

variable "fluapi_client_sg_id" {
  description = "Security group to open Flu API client traffic"
  type = "string"
}

variable "fluapi_server_sg_id" {
  description = "Security group to open Flu API server traffic"
  type = "string"
}

variable "infra_alerts_sns_topic_arn" {
  description = "ARN of SNS topic for publishing alarms"
  type = "string"
}

variable "internet_egress_sg_id" {
  description = "Security group to open internet egress"
  type = "string"
}

variable "public_http_sg_id" {
  description = "Security group to open public HTTP/S ingress"
  type = "string"
}

variable "region" {
  description = "Targeted AWS region"
}

variable "ssm_parameters_key_arn" {
  description = "ARN of key needed to decrypt SSM parameters"
}

variable "transient_subnet_id" {
  description = "Subnet in which the transient resources, such as Lambdas and bootstrap/provisioning, should be deployed"
  type = "string"
}

variable "vpc_id" {
  description = "Identifier for the VPC"
}
