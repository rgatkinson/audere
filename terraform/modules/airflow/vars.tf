// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "account" {
  description = "Identifier for the AWS account"
}

variable "airflow_database_address" {
  description = "Postgres db address for Airflow backend"
}

variable "app_subnet_id" {
  description = "Subnet in which applications should be deployed"
}

variable "app_b_subnet_id" {
  description = "Backup subnet in which applications should be deployed"
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

variable "ecs_dynamic_client_sg_id" {
  description = "Security group to send traffic to dynamic ECS ports"
}

variable "elb_logs_bucket_id" {
  description = "Identifier for bucket to capture ELB access logs"
}

variables "ecs_cluster_id" {
  description = "Identifier for ECS cluster to run reporting applications"
}

variable "ecs_service_linked_role_arn" {
  description = "ARN of the role linked to the ECS service on this account"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
}

variable "redis_server_sg_id" {
  description = "Security group to receive traffic on Redis server"
}

variable "region" {
  description = "Targeted AWS region"
}

variable "vpc_id" {
  description = "Identifier for the VPC"
}
