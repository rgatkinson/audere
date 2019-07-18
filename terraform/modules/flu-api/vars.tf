// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "app_subnet_id" {
  description = "Subnet in which applications should be deployed"
  type = "string"
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

variable "availability_zone" {
  default = "us-west-2a"
}

variable "commit" {
  description = "Git commit tag (or hash) to sync"
  default = "master"
}

variable "cough_aspren_bucket" {
  description = "ARN for S3 bucket containing ASPREN reports"
}

variable "audere_share_bucket" {
  description = "ARN for public S3 bucket"
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

variable "internet_egress_sg_id" {
  description = "Security group to open internet egress"
  type = "string"
}

variable "migrate" {
  description = "Cycle this false -> true -> false to run a db migration"
}

variable "public_http_sg_id" {
  description = "Security group to open public HTTP/S ingress"
  type = "string"
}

variable "service" {
  description = "Service mode, one of 'offline', 'single', 'elb'"
}

variable "transient_subnet_id" {
  description = "Subnet in which the transient resources, such as Lambdas and bootstrap/provisioning, should be deployed"
  type = "string"
}
