// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "evidation_bucket_arn" {
  value = "${aws_s3_bucket.evidation_reports_bucket.arn}"
}

output "evidation_bucket_id" {
  value = "${aws_s3_bucket.evidation_reports_bucket.id}"
}

output "fluapi_internal_fqdn" {
  value = "${element(concat(aws_lb.flu_api_internal_lb.*.dns_name, list("")), 0)}"
}

output "fluapi_route53_fqdn" {
  value = "${element(concat(aws_route53_record.api_record.*.fqdn, list("")), 0)}"
}
