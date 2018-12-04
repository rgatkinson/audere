// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// See epoch/provision documentation in modules/flu-db/main.tf

variable "mode" {
  description = "See 'mode' in modules/flu-db/vars.tf"
  default = "run"
}

variable "admins" {
  description = "List of admin userids."
  default = [
    "mmarucheck",
    "ram",
  ]
}
