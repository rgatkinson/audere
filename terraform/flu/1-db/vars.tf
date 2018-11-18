// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "availability_zone" {
  default = "us-west-2a"
}

// Migration Epochs
//
// One goal of this infrastructure is to enable auditing.
// To facilitate this, we need to enable pgaudit on the database,
// and we need encrypted keys where we store unique database
// passwords for each administrator.  Generating these passwords
// and populating the database accounts is not declaratively
// supported by Terraform.
//
// To work around this, the "provisioning" variable specifies whether
// we currently should have a provisioning server running.  The
// provisioning server adds database accounts and store passwords
// and certs on encrypted drives, and then shutdown when it completes
// successfully.
//
// Since these actions are no longer declarative, we need a system
// of migrations for the provisioning actions.  We manage this by
// assigning an epoch that increments, each corresponding to a
// "provision-$N.sh" script that runs at epoch $N.
//
// So to set up a current working system, run something like:
//   for i in {0..$MAX_EPOCH}; do
//     terraform apply -var "epoch=$i" -var "provision=true"
//     # wait for provisioning server for this phase to enter "stopped" state
//   done
//   terraform apply -var "epoch=$MAX_EPOCH"
//
// This runs all the migration scripts in order, and the final apply
// switches out of "provision=true" mode and disables any provisioning
// server(s).
variable "epoch" { default = 0 }
variable "provision" { default = false }

variable "db_setup_password_filename" {
  default = "../../../local/flu/creds/db_setup_password"
}

variable "github_tar_bz2_base64_filename" {
  default = "../../../local/flu/creds/github.tar.bz2.base64"
}

variable "random_seed_filename" {
  default = "../../../local/flu/creds/random_seed"
}
