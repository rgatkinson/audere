// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

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
