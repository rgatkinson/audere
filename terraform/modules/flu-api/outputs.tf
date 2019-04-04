// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "transient_subnet_id" {
  value = "${aws_subnet.transient.id}"
}

output "internet_egress_sg_id" {
  value = "${aws_security_group.internet_egress.id}"
}

output "elbinternal_sg_client_id" {
  value = "${module.elbinternal_sg.client_id}"
}

output "fluapi_internal_fqdn" {
  value = "${element(concat(aws_elb.flu_api_internal_elb.*.dns_name, list("")), 0)}"
}

output "fluapi_route53_fqdn" {
  value = "${element(concat(aws_route53_record.api_record.*.fqdn, list("")), 0)}"
}
