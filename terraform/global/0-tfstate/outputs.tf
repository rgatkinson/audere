// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "staging_terraform_arn" {
  value = "${aws_s3_bucket.staging_terraform.arn}"
}

output "prod_terraform_arn" {
  value = "${aws_s3_bucket.prod_terraform.arn}"
}
