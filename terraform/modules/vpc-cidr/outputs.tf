// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "vpc_prod_cidr" {
  value = "${local.vpc_prod_cidr}"
}

output "prod_db_cidr" {
  value = "${local.prod_db_cidr}"
}

output "prod_dev_cidr" {
  value = "${local.prod_dev_cidr}"
}

output "prod_api_cidr" {
  value = "${local.prod_api_cidr}"
}

output "prod_public_cidr" {
  value = "${local.prod_public_cidr}"
}


output "vpc_staging_cidr" {
  value = "${local.vpc_staging_cidr}"
}

output "staging_db_cidr" {
  value = "${local.staging_db_cidr}"
}

output "staging_dev_cidr" {
  value = "${local.staging_dev_cidr}"
}

output "staging_api_cidr" {
  value = "${local.staging_api_cidr}"
}

output "staging_public_cidr" {
  value = "${local.staging_public_cidr}"
}
