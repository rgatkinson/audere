// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "sftp_host" {
  value = "${aws_route53_record.sftp_hostname.fqdn}"
}

output "transfer_server_id" {
  value = "${aws_transfer_server.sftp_server.id}"
}
