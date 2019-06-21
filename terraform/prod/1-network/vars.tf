// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "bastion_cidr_whitelist" {
  description = "CIDR blocks for source IPs allowed to connect to bastion server"
  type = "list"
}
