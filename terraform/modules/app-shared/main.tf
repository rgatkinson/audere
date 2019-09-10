// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

data "aws_acm_certificate" "auderenow_io" {
  domain = "auderenow.io"
  types = ["AMAZON_ISSUED"]
  most_recent = true
}

data "aws_route53_zone" "auderenow_io" {
  name = "auderenow.io."
}

resource "aws_s3_bucket" "elb_logs" {
  bucket = "${local.base_name}-elb-logs"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "elb_s3" {
  bucket = "${aws_s3_bucket.elb_logs.id}"
  policy = "${data.aws_iam_policy_document.allow_us_west_2_elb.json}"
}

data "aws_iam_policy_document" "allow_us_west_2_elb" {
  statement {
    sid       = "ELBWriteToS3"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.elb_logs.arn}/*"]

    principals {
      type        = "AWS"
      // See ELB account ids - https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/enable-access-logs.html
      identifiers = ["797873946194"]
    }
  }
}

module "ecs_cluster" {
  source = "../ecs-cluster"

  cluster_name = "${local.base_name}-ecs"
  devs = "${var.devs}"
  environment = "${var.environment}"
  iam_instance_profile = "${aws_iam_instance_profile.ecs.id}"
  subnet_ids = ["${var.app_subnet_id}"]
  security_groups = [
    "${var.internet_egress_sg_id}",
    "${var.reporting_server_sg_id}",
    "${var.db_client_sg_id}",
    "${var.dev_ssh_server_sg_id}",
  ]
}

module "sftp" {
  source = "../sftp-server"

  auderenow_route53_zone_id = "${data.aws_route53_zone.auderenow_io.id}"
  auderenow_route53_zone_name = "${data.aws_route53_zone.auderenow_io.name}"
  environment = "${var.environment}"
}

module "cough_sftp" {
  source = "../sftp-user"
  
  client_role = "cough"
  environment = "${var.environment}"
  sftp_host = "${module.sftp.sftp_host}"
  transfer_server_id = "${module.sftp.transfer_server_id}"
  user_public_key = "${file("${path.module}/../../../local/sftp-keys/cough.${var.environment}.pub")}"
}

module "cough_qualtrics_sftp" {
  source = "../sftp-user"

  client_role = "cough-qualtrics"
  environment = "${var.environment}"
  sftp_host = "${module.sftp.sftp_host}"
  transfer_server_id = "${module.sftp.transfer_server_id.}"
  user_public_key = "${file("${path.module}/../../../local/sftp-keys/cough.qualtrics.${var.environment}.pub")}"
}

locals {
  base_name = "flu-${var.environment}-api"
}
