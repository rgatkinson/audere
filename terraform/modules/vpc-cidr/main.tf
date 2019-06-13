// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// ==== Network CIDR configuration ====
//
// Since the IPv4 space is global to the AWS account, we specify allocations here.
// Actually creating the resources is up to the individual modules, but assigning
// address ranges here helps ensure we don't have collisions.
//
// ==== VPCs ====
//
// According to:
// https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Subnets.html#VPC_Sizing
// the recommended IPv4 CIDR blocks come from RFC 1918:
//   10.0.0.0 - 10.255.255.255 (10/8 prefix)
//   172.16.0.0 - 172.31.255.255 (172.16/12 prefix)
//   192.168.0.0 - 192.168.255.255 (192.168/16 prefix)
//
// VPCs can be up to 16-bits, of which there would be 256 + 16 + 1 = 273.
// I think this is more than we will use, but conceivably in the future we
// can resize the non-prod VPCs smaller if we need the ability to create more
// VPCs.
//
// Since 192.168.0.0/16 has exactly one 16-bit range, we give that to prod so
// there will never be any question of fragmentation.
//
// ==== Subnets ====
//
// For simplicity, I'm making 8-bit subnets.  I'm giving the db the first block (0),
// making the last block public (255), and allocating other services in 1-254.
//
// AWS seems to allocate its default VPCs from the end of 172.16-31.*.* range.

locals {
  vpc_prod_cidr = "192.168.0.0/16"
  prod_db_cidr = "${cidrsubnet(local.vpc_prod_cidr, 8, 0)}"
  prod_dev_cidr = "${cidrsubnet(local.vpc_prod_cidr, 8, 1)}"
  prod_app_cidr = "${cidrsubnet(local.vpc_prod_cidr, 8, 254)}"
  prod_public_cidr = "${cidrsubnet(local.vpc_prod_cidr, 8, 255)}"

  vpc_staging_cidr = "10.0.0.0/16"
  staging_db_cidr = "${cidrsubnet(local.vpc_staging_cidr, 8, 0)}"
  staging_dev_cidr = "${cidrsubnet(local.vpc_staging_cidr, 8, 1)}"
  staging_app_cidr = "${cidrsubnet(local.vpc_staging_cidr, 8, 254)}"
  staging_public_cidr = "${cidrsubnet(local.vpc_staging_cidr, 8, 255)}"
}
