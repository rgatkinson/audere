// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.


output "vpc_prod_cidr" {
  value = "${local.vpc_prod_cidr}"
}

output "subnet_prod_db_cidr" {
  value = "${local.subnet_prod_db_cidr}"
}

output "subnet_prod_api_cidr" {
  value = "${local.subnet_prod_api_cidr}"
}

output "subnet_prod_public_cidr" {
  value = "${local.subnet_prod_public_cidr}"
}



output "vpc_staging_cidr" {
  value = "${local.vpc_staging_cidr}"
}

output "subnet_staging_db_cidr" {
  value = "${local.subnet_staging_db_cidr}"
}

output "subnet_staging_api_cidr" {
  value = "${local.subnet_staging_api_cidr}"
}

output "subnet_staging_public_cidr" {
  value = "${local.subnet_staging_public_cidr}"
}
