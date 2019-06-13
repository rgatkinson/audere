// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

resource "aws_db_subnet_group" "fludb" {
  name = "${local.base_name}"
  subnet_ids = [
    "${var.db_pii_subnet_id}",
    "${var.db_nonpii_subnet_id}",
  ]
  tags = {
    Name = "${local.base_name}"
  }
}
