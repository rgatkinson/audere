// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "userid" {
}

variable "key_path" {
}

variable "home_size_gb" {
  default = 15
}

variable "availability_zone" {
  default = "us-west-2a"
}

variable "instance_type" {
  default = "t3.small"
}