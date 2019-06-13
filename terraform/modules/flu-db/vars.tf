// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// Migration Epochs
//
// One goal of this infrastructure is to enable auditing.
// To facilitate this, we need to enable pgaudit on the database,
// and we need encrypted keys where we store unique database
// passwords for each administrator.  Generating these passwords
// and populating the database accounts is not declaratively
// supported by Terraform.
//
// To work around this, the "mode" variable specifies whether
// we currently should have a provisioning server running.  The
// provisioning server adds database accounts and store passwords
// and certs on encrypted drives, and then shutdown when it completes
// successfully.
//
// Since these actions are no longer declarative, we need a system
// of migrations for the provisioning actions.  We manage this by
// running stages of mode=provision0, mode=provision1, etc.  Once
// all provision modes have completed, we set mode=run to run.
//
// To add an administrator account, add the userid to the list of
// admins and run something like:
//   terraform apply -var "mode=add-admin"
//   terraform apply

variable "admins" {
  type = "list"
}

variable "availability_zone" {
  default = "us-west-2a"
}

variable "db_client_sg_id" {
  description = "Security group to open database client traffic"
  type = "string"
}

variable "db_nonpii_subnet_id" {
  description = "Subnet in which non-PII databases should be deployed"
  type = "string"
}

variable "db_pii_subnet_id" {
  description = "Subnet in which PII databases should be deployed"
  type = "string"
}

variable "db_server_sg_id" {
  description = "Security group to open database server traffic"
  type = "string"
}

variable "db_setup_password_filename" {
  default = "../../../local/flu/creds/db_setup_password"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
  type = "string"
}

variable "github_tar_bz2_base64_filename" {
  default = "../../../local/flu/creds/github.tar.bz2.base64"
}

variable "internet_egress_sg_id" {
  description = "Security group to open internet egress"
  type = "string"
}

variable "log_archive_bucket_name" {
  description = "Name of S3 bucket where db logs are archived"
  type = "string"
}

variable "mode" {
  description = "One of 'provision0', 'provision1', 'add-admin', or 'run'"
  default = "run"
}

variable "pii_availability_zone" {
  default = "us-west-2b"
}

variable "random_seed_filename" {
  default = "../../../local/flu/creds/random_seed"
}

variable "transient_subnet_id" {
  description = "Subnet in which the transient resources, such as Lambdas and bootstrap/provisioning, should be deployed"
  type = "string"
}

variable "vpc_dhparam_filename" {
  default = "../../../local/flu/creds/vpc.dhparam"
}
