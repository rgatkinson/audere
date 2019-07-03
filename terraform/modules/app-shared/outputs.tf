// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "auderenow_certificate_arn" {
  value = "${data.aws_acm_certificate.auderenow_io.arn}"
}

output "auderenow_route53_zone_id" {
  value = "${data.aws_route53_zone.auderenow_io.id}"
}

output "auderenow_route53_zone_name" {
  value = "${data.aws_route53_zone.auderenow_io.name}"
}

output "cough_aspren_bucket" {
  value = "${module.cough_sftp.sftp_bucket_arn}"
}

output "ecs_cluster_id" {
  value = "${module.ecs_cluster.id}"
}

output "elb_logs_bucket_id" {
  value = "${aws_s3_bucket.elb_logs.id}"
}
