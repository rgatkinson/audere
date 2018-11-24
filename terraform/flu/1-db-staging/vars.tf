// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "epoch" {
  default = 0
}

variable "provision" {
  description = "One of 'run', 'cleanup', or 'done'"
  default = "done"
}
