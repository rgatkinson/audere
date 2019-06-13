// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "api_creds_snapshot_id" {
  value = "${element(concat(aws_ebs_snapshot.api_creds.*.id, list("StillProvisioningNoSnapshotYet")), 0)}"
}

output "metabase_database_address" {
  value = "${aws_db_instance.metabase.address}"
}

output "nonpii_database_address" {
  value = "${aws_db_instance.fludb_nonpii.address}"
}

output "pii_database_address" {
  value = "${aws_db_instance.fludb_pii.address}"
}
