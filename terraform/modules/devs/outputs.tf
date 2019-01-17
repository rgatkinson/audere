// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "ssh_keys" {
  value = "${map(
    "billy", "${file("${local.keydir}/billy.pub")}",
    "mmarucheck", "${file("${local.keydir}/mmarucheck.pub")}",
    "ram", "${file("${local.keydir}/ram.pub")}",
    "terri", "${file("${local.keydir}/terri.pub")}",
  )}"
}

locals {
  keydir = "${path.module}/../../../dev/ssh-keys"
}
