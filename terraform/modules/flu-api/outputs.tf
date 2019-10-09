// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "fluapi_internal_fqdn" {
  value = "${element(concat(aws_lb.flu_api_internal_lb.*.dns_name, list("")), 0)}"
}

output "fluapi_route53_fqdn" {
  value = "${element(concat(aws_route53_record.api_record.*.fqdn, list("")), 0)}"
}
