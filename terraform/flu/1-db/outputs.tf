// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "database_address" {
  value = "${aws_db_instance.fludb.address}"
}

output "api_prod_snapshot_id" {
  value = "${element(
    concat(
      aws_ebs_snapshot.api_prod.*.id,
      list("StillProvisioningNoSnapshotYet")
    ),
    0
  )}"
}

output "api_staging_snapshot_id" {
  value = "${element(
    concat(
      aws_ebs_snapshot.api_staging.*.id,
      list("StillProvisioningNoSnapshotYet")
    ),
    0
  )}"
}
