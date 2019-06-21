// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "api_creds_snapshot_id" {
  value = "${module.flu_db.api_creds_snapshot_id}"
}

output "metabase_database_address" {
  value = "${module.flu_db.metabase_database_address}"
}
