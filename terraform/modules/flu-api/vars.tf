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

variable "availability_zone" {
  default = "us-west-2a"
}

variable "commit" {
  description = "Git commit tag (or hash) to sync"
  default = "master"
}

variable "creds_snapshot_id" {
  description = "snapshot id of volume containing api credentials"
}

variable "db_client_sg_id" {
  description = "Security group to open database client traffic"
  type = "string"
}

variable "dev_ssh_server_sg_id" {
  description = "Security group to open SSH server traffic"
  type = "string"
}

variable "devs" {
  description = "Userids of developers who should have ssh access to frontend machines"
  type = "list"
}

variable "ecs_service_linked_role_arn" {
  description = "ARN of the role linked to the ECS service on this account"
}

variable "fluapi_internal_client_sg_id" {
  description = "Security group to open internal Flu API client traffic"
  type = "string"
}

variable "fluapi_internal_server_sg_id" {
  description = "Security group to open internal Flu API server traffic"
  type = "string"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
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

variable "metabase_database_address" {
  description = "Address for Metabase datastore"
}

variable "migrate" {
  description = "Cycle this false -> true -> false to run a db migration"
}

variable "public_http_sg_id" {
  description = "Security group to open public HTTP/S ingress"
  type = "string"
}

variable "region" {
  description = "Targeted AWS region"
}

variable "reporting_client_sg_id" {
  description = "Security group to open reporting client traffic"
  type = "string"
}

variable "reporting_server_sg_id" {
  description = "Security group to open reporting server traffic"
  type = "string"
}

variable "service" {
  description = "Service mode, one of 'offline', 'single', 'elb'"
}

variable "ssm_parameters_key_arn" {
  description = "ARN of key used to encrypt SSM parameters"
}

variable "transient_subnet_id" {
  description = "Subnet in which the transient resources, such as Lambdas and bootstrap/provisioning, should be deployed"
  type = "string"
}
