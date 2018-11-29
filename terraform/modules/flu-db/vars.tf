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

variable "ami_id" {
  type = "string"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
  type = "string"
}

variable "mode" {
  description = "One of 'provision0', 'provision1', 'add-admin', or 'run'"
  default = "run"
}

variable "db_setup_password_filename" {
  default = "../../../local/flu/creds/db_setup_password"
}

variable "github_tar_bz2_base64_filename" {
  default = "../../../local/flu/creds/github.tar.bz2.base64"
}

variable "random_seed_filename" {
  default = "../../../local/flu/creds/random_seed"
}

variable "vpc_dhparam_filename" {
  default = "../../../local/flu/creds/vpc.dhparam"
}

variable "availability_zone" {
  default = "us-west-2a"
}
