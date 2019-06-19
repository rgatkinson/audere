// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

data "aws_iam_policy_document" "assume_ec2_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_role" {
  name = "${local.base_name}-ecs"
  assume_role_policy = "${data.aws_iam_policy_document.assume_ec2_role_policy.json}"
}

resource "aws_iam_instance_profile" "ecs" {
  name = "${local.base_name}-ecs"
  role = "${aws_iam_role.ecs_role.name}"
}

resource "aws_iam_role_policy_attachment" "ecs_attachment" {
   roles = ["${aws_iam_role.ecs_role.name}"]
   policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}
