// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "audere_share_arn" {
  value = "${aws_s3_bucket.audere_share.arn}"
}

output "database_log_archive_bucket_name" {
  value = "${aws_s3_bucket.database_log_archive.id}"
}

output "ecr_push_user" {
  value = "${aws_iam_user.ecr_push.name}"
}

output "ecs_service_linked_role_arn" {
  value = "${aws_iam_service_linked_role.ecs_service_linked_role.arn}"
}

output "ssm_parameters_key_arn" {
  value = "${aws_kms_key.ssm_parameters.arn}"
}

output "vpc_flow_log_arn" {
  value = "${aws_cloudwatch_log_group.vpc_flow_log.arn}"
}

output "vpc_flow_log_role_arn" {
  value = "${aws_iam_role.vpc_flow_log_role.arn}"
}
