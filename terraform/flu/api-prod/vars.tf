// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "bastion_cidr_whitelist" {
  description = "CIDR blocks for source IPs allowed to connect to bastion server"
  type = "list"
}

variable "devs" {
  description = "Userids of developers who should have a dev machine allocated"
  type = "list"
}


variable "service" {
  description = "Service mode, one of 'offline', 'single', 'elb'"
  default = "elb"
}

variable "migrate" {
  description = "Cycle this false -> true -> false to run a db migration"
  default = "false"
}

variable "commit" {
  description = "Git commit tag (or hash) to sync"
  default = "master"
}
