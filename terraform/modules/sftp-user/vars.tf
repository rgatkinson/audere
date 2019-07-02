// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "client_role" {
  description = "Name for the client user group to be provisioned"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
}

variable "sftp_host" {
  description = "Hostname for the SFTP server"
}

variable "transfer_server_id" {
  description = "Identifier for the transfer server to which the SFTP account is attached"
}

variable "user_public_key" {
  description = "Public key for authenticating the provisioned user"
}
