// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "arn" {
  value = "${aws_ecs_cluster.cluster.arn}"
}

output "id" {
  value = "${aws_ecs_cluster.cluster.id}"
}
