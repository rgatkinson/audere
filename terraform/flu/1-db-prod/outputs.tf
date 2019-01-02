// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "api_creds_snapshot_id" {
  value = "${module.flu_db.api_creds_snapshot_id}"
}

output "fludb_client_sg_id" {
  value = "${module.flu_db.fludb_client_sg_id}"
}

output "fludev_ssh_client_sg_id" {
  value = "${module.flu_db.fludev_ssh_client_sg_id}"
}

output "fludev_ssh_server_sg_id" {
  value = "${module.flu_db.fludev_ssh_server_sg_id}"
}

output "gateway_id" {
  value = "${module.flu_db.gateway_id}"
}

output "vpc_id" {
  value = "${module.flu_db.vpc_id}"
}
