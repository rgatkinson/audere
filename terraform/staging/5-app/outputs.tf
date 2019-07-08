// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "cough_aspren_bucket" {
  value = "${module.shared.cough_aspren_bucket}"
}

output "fluapi_internal_fqdn" {
  value = "${module.flu_api.fluapi_internal_fqdn}"
}

output "fluapi_fqdn" {
  value = "${module.flu_api.fluapi_route53_fqdn}"
}
