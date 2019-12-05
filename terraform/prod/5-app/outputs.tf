// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "chills_virena_bucket_arn" {
  value = "${module.shared.chills_virena_bucket_arn}"
}

output "chills_virena_bucket_id" {
  value = "${module.shared.chills_virena_bucket_id}"
}

output "cough_aspren_bucket_arn" {
  value = "${module.shared.cough_aspren_bucket_arn}"
}

output "cough_aspren_bucket_id" {
  value = "${module.shared.cough_aspren_bucket_id}"
}

output "cough_follow_ups_bucket_arn" {
  value = "${module.shared.cough_follow_ups_bucket_arn}"
}

output "cough_follow_ups_bucket_id" {
  value = "${module.shared.cough_follow_ups_bucket_id}"
}

output "fluapi_fqdn" {
  value = "${module.flu_api.fluapi_route53_fqdn}"
}

output "fluapi_internal_fqdn" {
  value = "${module.flu_api.fluapi_internal_fqdn}"
}
