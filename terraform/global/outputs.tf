// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "vpc_flow_log_arn" {
  value = "${aws_cloudwatch_log_group.vpc_flow_log.arn}"
}

output "vpc_flow_log_role_arn" {
  value = "${aws_iam_role.vpc_flow_log_role.arn}"
}
