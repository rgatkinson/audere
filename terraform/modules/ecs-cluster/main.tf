// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  full_name = "${var.cluster_name}-${var.environment}"

  assets_sha256 = "${chomp(file("${path.module}/../../../local/terraform-assets/sha256sum.txt"))}"
}

data "aws_ami" "amazon_linux_ecs" {
  most_recent = true

  filter {
    name   = "name"
    values = ["amzn-ami-*-amazon-ecs-optimized"]
  }

  filter {
    name   = "owner-alias"
    values = ["amazon"]
  }
}

module "devs" {
  source = "../devs"
  userids = "${var.devs}"
}

data "template_file" "cloud_init_sh" {
  template = "${file("${path.module}/cloud-init.sh")}"
  vars {
    assets_sha256 = "${local.assets_sha256}"
    cluster_name = "${aws_ecs_cluster.cluster.name}"
    environment = "${var.environment}"
    ssh_public_key_map = "${module.devs.ssh_key_json}"
  }
}

resource "aws_ecs_cluster" "cluster" {
  name = "${local.full_name}"
}

module "asg" {
  source = "terraform-aws-modules/autoscaling/aws"
  version = "~> v2.0"
  name = "${local.full_name}"

  # Launch configuration
  lc_name = "${local.full_name}-lc"

  iam_instance_profile = "${var.iam_instance_profile}"
  image_id = "${data.aws_ami.amazon_linux_ecs.id}"
  instance_type = "t3.small"
  security_groups = "${var.security_groups}"

  # This magically associates the instances to the ECS cluster
  user_data = "${data.template_file.cloud_init_sh.rendered}"

  # Auto scaling group
  asg_name = "${local.full_name}-asg"
  vpc_zone_identifier = "${var.subnet_ids}"
  health_check_type = "ELB"
  min_size = 0
  max_size = 1
  desired_capacity = 1
  wait_for_capacity_timeout = 0

  tags = [
    {
      key = "Environment"
      value = "${var.environment}"
      propagate_at_launch = true
    }
  ]
}
