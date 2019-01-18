// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "userids" {
  description = "List of developer userids to include"
  type = "list"
}

variable "keydir" {
  description = "Path to directory containing ssh public keys, each of the form: '$USERID.pub'"
  default = ""
}
