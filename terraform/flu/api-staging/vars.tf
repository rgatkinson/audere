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

variable "availability_zones" {
  description = "List of availability zones in which to deploy"
  type = "list"
  default = ["us-west-2a"]
}

variable "init_tar_bz2_base64_filename" {
  default = "../../../local/flu-api-staging-init.tar.bz2.base64"
}

variable "ssh_public_key_directory" {
  default = "../../../dev/ssh-keys"
}

variable "flu_api_instance_port" {
  description = "Port for HTTP requests inside VPC"
  default = 3000
}
