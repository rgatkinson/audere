// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "ssh_keys" {
  value = "${map(
    "mmarucheck", "${file("${path.module}/../../../dev/ssh-keys/2018-mmarucheck.pub")}",
    "mpomarole", "${file("${path.module}/../../../dev/ssh-keys/2018-mpomarole.pub")}",
    "ram", "${file("${path.module}/../../../dev/ssh-keys/2018-ram.pub")}",
    "terri", "${file("${path.module}/../../../dev/ssh-keys/2018-terri.pub")}",
  )}"
}
