// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "pii_database_address" {
  value = "${aws_db_instance.fludb_pii.address}"
}

output "nonpii_database_address" {
  value = "${aws_db_instance.fludb_nonpii.address}"
}

output "api_creds_snapshot_id" {
  value = "${element(concat(aws_ebs_snapshot.api_creds.*.id, list("StillProvisioningNoSnapshotYet")), 0)}"
}

output "vpc_id" {
  value = "${aws_vpc.fludb.id}"
}

output "gateway_id" {
  value = "${aws_internet_gateway.flu_gw.id}"
}

output "fludb_client_sg_id" {
  value = "${module.fludb_sg.client_id}"
}

output "fludev_ssh_client_sg_id" {
  value = "${module.fludev_ssh_sg.client_id}"
}

output "fludev_ssh_server_sg_id" {
  value = "${module.fludev_ssh_sg.server_id}"
}
