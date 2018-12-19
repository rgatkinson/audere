// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

resource "aws_vpc" "fludb_vpc" {
  cidr = "${var.vpc_cidr}"

  tags = {
    Name = "flu-${var.environment}-vpc"
  }
}

resource "aws_subnet" "fludb_subnet" {
  availability_zone = "${var.availability_zone}"
  cidr_block = "${var.subnet_db_cidr}"
  map_public_ip_on_launch = false
  vpc_id = "${aws_vpc.fludb_vpc.id}"

  tags = {
    Name = "flu-${var.environment}-db-subnet"
  }
}

module "fludb_sg" {
  source = "../sg-pair"

  name = "fludb"
  port = 5432
  vpc_id = "${aws_vpc.fludb_vpc.id}"
}
