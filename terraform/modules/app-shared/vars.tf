// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "app_subnet_id" {
  description = "Subnet in which applications should be deployed"
}

variable "build_user" {
  description = "User that executes infrastructure tasks from the build"
}

variable "db_client_sg_id" {
  description = "Security group to open database client traffic"
}

variable "dev_ssh_server_sg_id" {
  description = "Security group to open SSH server traffic"
}

variable "devs" {
  description = "Userids of developers who should have ssh access to frontend machines"
  type = "list"
}

variable "ecs_dynamic_server_sg_id" {
  description = "Security group to receive traffic to dynamic ECS ports"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
}

variable "infra_alerts_sns_topic_arn" {
  description = "ARN of SNS topic for publishing alarms"
  type = "string"
}

variable "internet_egress_sg_id" {
  description = "Security group to open internet egress"
}

variable "redis_client_sg_id" {
  description = "Security group to send traffic to Redis server"
}

variable "reporting_server_sg_id" {
  description = "Security group to open reporting server traffic"
}
