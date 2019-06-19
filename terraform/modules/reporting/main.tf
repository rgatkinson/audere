// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  reporting_subdomains = {
    prod = "reporting"
    staging = "reporting.staging"
  }
  reporting_subdomain = "${local.reporting_subdomains["${var.environment}"]}"
  reporting_full_domain = "${local.reporting_subdomain}.auderenow.io"
  base_name = "flu-${var.environment}-api"
}

// --------------------------------------------------------------------------------
// ELB/domain setup

resource "aws_route53_record" "reporting_record" {
  zone_id = "${var.auderenow_route53_zone_id}"
  name = "${local.reporting_subdomain}.${var.auderenow_route53_zone_name}"
  type = "A"

  alias {
    name = "${aws_elb.reporting_elb.dns_name}"
    zone_id = "${aws_elb.reporting_elb.zone_id}"
    evaluate_target_health = true
  }
}

resource "aws_elb" "reporting_elb" {
  name = "${local.base_name}-reporting"

  access_logs {
    bucket = "${var.elb_logs_bucket_id}"
    bucket_prefix = "reporting"
  }

  subnets = ["${var.app_subnet_id}"]

  security_groups = [
    "${var.public_http_sg_id}",
    "${var.reporting_client_sg_id}",
  ]

  listener {
    lb_port = 443
    lb_protocol = "https"
    instance_port = 80
    instance_protocol = "http"
    ssl_certificate_id = "${var.auderenow_certificate_arn}"
  }

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 5
    interval = 30
    target = "HTTP:80/api/health"
  }

  tags {
    Name = "${local.base_name}-reporting"
  }
}

// --------------------------------------------------------------------------------
// Metabase task

data "template_file" "metabase" {
  template = "${file("${path.module}/metabase.json")}"

  vars {
    account = "${var.account}"
    container_name = "metabase-${var.environment}"
    db_host = "${var.metabase_database_address}"
    db_pass_key = "metabase-${var.environment}.pass"
    db_user_key = "metabase-${var.environment}.user"
    encryption_secret_key = "metabase-${var.environment}.secret"
    image = "metabase/metabase:v0.32.5"
    region = "${var.region}"
  }
}

resource "aws_ecs_task_definition" "metabase" {
  family = "metabase-${var.environment}"
  container_definitions = "${data.template_file.metabase.rendered}"
  execution_role_arn = "${aws_iam_role.ecs_task_execution_role.arn}"
}

resource "aws_ecs_service" "metabase" {
  name = "metabase-${var.environment}"
  cluster = "${var.ecs_cluster_id}"
  task_definition = "${aws_ecs_task_definition.metabase.arn}"
  desired_count = 1
  iam_role = "${var.ecs_service_linked_role_arn}"

  load_balancer {
    elb_name = "${aws_elb.reporting_elb.name}"
    container_name = "metabase-${var.environment}"
    container_port = 3000
  }
}
