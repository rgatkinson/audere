// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "elbinternal_sg_client_id" {
  value = "${module.flu_api.elbinternal_sg_client_id}"
}

output "internet_egress_sg_id" {
  value = "${module.flu_api.internet_egress_sg_id}"
}

output "transient_subnet_id" {
  value = "${module.flu_api.transient_subnet_id}"
}

output "fluapi_internal_fqdn" {
  value = "${module.flu_api.fluapi_internal_fqdn}"
}

output "fluapi_fqdn" {
  value = "${module.flu_api.fluapi_route53_fqdn}"
}
