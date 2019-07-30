// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  version = "~> 1.50"
  region  = "us-west-2"
}

terraform {
  backend "s3" {
    bucket = "global-terraform.auderenow.io"
    key = "policy/terraform.state"
    region = "us-west-2"
  }
}

// --------------------------------------------------------------------------------
// General config

module "config" {
  source = "../../modules/vpc-config"
}

// --------------------------------------------------------------------------------
// Group policies

module "groups" {
  source = "../../modules/group-policy"
}

// --------------------------------------------------------------------------------
// Initial Network Configs with flow logs

resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}

resource "aws_flow_log" "default_vpc_flow_log" {
  iam_role_arn    = "${aws_iam_role.vpc_flow_log_role.arn}"
  log_destination = "${aws_cloudwatch_log_group.vpc_flow_log.arn}"
  traffic_type    = "ALL"
  vpc_id          = "${aws_default_vpc.default.id}"
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name = "VPCFlowLogs"
}

data "aws_iam_policy_document" "vpc_flow_log_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "vpc_flow_log_role" {
  name = "VPCFlowLogRole"

  assume_role_policy = "${data.aws_iam_policy_document.vpc_flow_log_role_policy.json}"
}

data "aws_iam_policy_document" "logs_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "logs_role_policy" {
  name = "LogsRolePolicy"
  role = "${aws_iam_role.vpc_flow_log_role.id}"

  policy = "${data.aws_iam_policy_document.logs_policy.json}"
}

// --------------------------------------------------------------------------------
// ECS service role

resource "aws_iam_service_linked_role" "ecs_service_linked_role" {
  aws_service_name = "ecs.amazonaws.com"
  description = "Role to enable Amazon ECS service."
}

// --------------------------------------------------------------------------------
// To set an encrypted parameter in SSM:
//
// 1) Put the parameter value in a file (e.g. slack-hook-url.txt)
// 2) Generate encrypted blob via `aws`:
//      aws kms encrypt --key-id alias/ssm-parameters --plaintext fileb://./slack-hook-url.txt --output text --query CiphertextBlob
// 3) Add the value as a parameter in AWS Systems Manager
//      E.g. at https://us-west-2.console.aws.amazon.com/systems-manager/parameters?region=us-west-2
//      create parameter `slack-hook-url` with the value from step 2.
//
// Well-known parameters (these should be added after applying global and before
// applying anything else):
// * slack-hook-url: create a Slack app and generate an incoming webhook url
//
// This supports round-tripping the encrypted data to code that expects to decrypt an environment variable.
// For code that supports SecureString directly, you can just create a SecureString in SSM.

resource "aws_kms_key" "ssm_parameters" {
  description = "Key for encrypting secrets stored as SSM parameters."
}

resource "aws_kms_alias" "ssm_parameters" {
  name = "alias/ssm-parameters"
  target_key_id = "${aws_kms_key.ssm_parameters.key_id}"
}

// --------------------------------------------------------------------------------
// ECR image push user

resource "aws_iam_user" "ecr_push" {
  name = "ecr-push"
}

resource "aws_iam_user_policy_attachment" "ecr_push" {
  user       = "${aws_iam_user.ecr_push.name}"
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

data "aws_iam_policy_document" "create_ecr_repository_document" {
  statement {
    actions = [
      "ecr:CreateRepository"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "create_ecr_repository_policy" {
  name   = "ecr-push-create-repo"
  policy = "${data.aws_iam_policy_document.create_ecr_repository_document.json}"
}

resource "aws_iam_user_policy_attachment" "create_ecr_repository_attachment" {
  user       = "${aws_iam_user.ecr_push.name}"
  policy_arn = "${aws_iam_policy.create_ecr_repository_policy.arn}"
}
