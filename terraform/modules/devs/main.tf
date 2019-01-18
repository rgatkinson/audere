// Copyright (c) 2018, 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

resource "null_resource" "ssh_keys" {
  count = "${length(var.userids)}"

  triggers {
    key = "${file("${local.keydir}/${element(var.userids, count.index)}.pub")}"
  }
}

locals {
  keydir = "${var.keydir != "" ? var.keydir : "${path.module}/../../../dev/ssh-keys"}"
  ssh_key_json = "${jsonencode(local.ssh_key_map)}"
  ssh_key_map = "${zipmap(var.userids, null_resource.ssh_keys.*.triggers.key)}"
}
