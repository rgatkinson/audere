// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// ECS task role

module "task_role" {
  source = "../ecs-task-role"

  account = "${var.account}"
  environment = "${var.environment}"
  region = "${var.region}"
  task_alias = "metabase"
  ssm_parameters_key_arn = "${var.ssm_parameters_key_arn}"
}
