// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  api_subdomains = {
    prod = "api"
    staging = "api.staging"
  }
  api_subdomain = "${local.api_subdomains["${var.environment}"]}"
  api_full_domain = "${local.api_subdomain}.auderenow.io"
  base_name = "flu-${var.environment}-api"
  iprd_rdt_reader_subpath = "/IPRD/rdt-reader/"
}


// --------------------------------------------------------------------------------
// Load balancers

resource "aws_route53_record" "api_record" {
  zone_id = "${var.auderenow_route53_zone_id}"
  name = "${local.api_subdomain}.${var.auderenow_route53_zone_name}"
  type = "A"

  alias {
    name = "${aws_lb.flu_api_lb.dns_name}"
    zone_id = "${aws_lb.flu_api_lb.zone_id}"
    evaluate_target_health = true
  }
}

resource "aws_lb" "flu_api_lb" {
  name = "${local.base_name}-public"
  subnets = [
    "${var.app_subnet_id}",
    "${var.app_b_subnet_id}",
  ]
  security_groups = [
    "${var.public_http_sg_id}",
    "${var.fluapi_client_sg_id}",
  ]

  access_logs {
    bucket = "${var.elb_logs_bucket_id}"
    prefix = "public"
    enabled = true
  }
}

resource "aws_lb_target_group" "flu_api" {
  name = "${local.base_name}-public"
  port = 443
  protocol = "HTTPS"
  target_type = "ip"
  vpc_id = "${var.vpc_id}"

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 5
    interval = 30
    path = "/api"
    port = "443"
    protocol = "HTTPS"
  }
}

resource "aws_lb_listener" "flu_api_listener" {
  load_balancer_arn = "${aws_lb.flu_api_lb.id}"
  port = 443
  protocol = "HTTPS"
  ssl_policy = "ELBSecurityPolicy-2016-08"
  certificate_arn = "${var.auderenow_certificate_arn}"

  default_action {
    target_group_arn = "${aws_lb_target_group.flu_api.id}"
    type = "forward"
  }
}

resource "aws_lb" "flu_api_internal_lb" {
  name = "${local.base_name}-internal"
  internal = true
  subnets = [
    "${var.app_subnet_id}",
    "${var.app_b_subnet_id}",
  ]
  security_groups = [
    "${var.fluapi_client_sg_id}",
    "${var.fluapi_internal_server_sg_id}",
  ]

  access_logs {
    bucket = "${var.elb_logs_bucket_id}"
    prefix = "internal"
    enabled = true
  }
}

resource "aws_lb_target_group" "flu_api_internal" {
  name = "${local.base_name}-internal"
  port = 444
  protocol = "HTTP"
  target_type = "ip"
  vpc_id = "${var.vpc_id}"

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 5
    interval = 30
    path = "/api"
    port = "444"
    protocol = "HTTP"
  }
}

resource "aws_lb_listener" "flu_api_internal_listener" {
  load_balancer_arn = "${aws_lb.flu_api_internal_lb.id}"
  port = 444
  protocol = "HTTP"

  default_action {
    target_group_arn = "${aws_lb_target_group.flu_api_internal.id}"
    type = "forward"
  }
}

// --------------------------------------------------------------------------------
// FluApi reporting bucket

resource "aws_s3_bucket" "flu_api_reports_bucket" {
  bucket        = "${local.base_name}-reports"
  force_destroy = true

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "aws:kms"
      }
    }
  }
}

// --------------------------------------------------------------------------------
// FluApi ECS task

data "template_file" "fluapi" {
  template = "${file("${path.module}/fluapi.json")}"

  vars {
    account = "${var.account}"
    domain = "${local.api_full_domain}"
    environment = "${var.environment}"
    region = "${var.region}"
    subdomain = "${local.api_subdomain}"
  }
}

resource "aws_ecs_task_definition" "fluapi" {
  family = "fluapi-${var.environment}"
  container_definitions = "${data.template_file.fluapi.rendered}"
  task_role_arn = "${module.task_role.arn}"
  execution_role_arn = "${module.task_role.arn}"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu = 256
  memory = 1024
}

resource "aws_ecs_service" "fluapi" {
  name = "fluapi-${var.environment}"
  cluster = "${var.ecs_cluster_id}"
  task_definition = "${aws_ecs_task_definition.fluapi.arn}"
  desired_count = 1
  deployment_maximum_percent = 200
  deployment_minimum_healthy_percent = 100
  launch_type = "FARGATE"
  network_configuration {
    assign_public_ip = true
    security_groups = [
      "${var.internet_egress_sg_id}",
      "${var.fluapi_server_sg_id}",
      "${var.db_client_sg_id}",
    ]
    subnets = ["${var.app_subnet_id}"]
  }

  load_balancer {
    target_group_arn = "${aws_lb_target_group.flu_api.id}"
    container_name = "nginx-${var.environment}"
    container_port = 443
  }

  load_balancer {
    target_group_arn = "${aws_lb_target_group.flu_api_internal.id}"
    container_name = "nginx-${var.environment}"
    container_port = 444
  }
}

resource "aws_cloudwatch_metric_alarm" "fluapi-task-alarm" {
  alarm_name = "fluapi-${var.environment}-active-tasks"
  alarm_description = "Monitors number of running tasks for the fluapi service"

  alarm_actions = [
    "${var.infra_alerts_sns_topic_arn}"
  ]

  ok_actions = [
    "${var.infra_alerts_sns_topic_arn}"
  ]

  comparison_operator = "LessThanThreshold"
  evaluation_periods = "1"
  insufficient_data_actions = []
  metric_name = "CPUUtilization"
  namespace = "AWS/ECS"
  period = "60"
  statistic = "SampleCount"
  threshold = "1"
  treat_missing_data = "breaching"
  dimensions {
    ClusterName = "${var.ecs_cluster_name}"
    ServiceName = "${aws_ecs_service.fluapi.name}"
  }
}

// --------------------------------------------------------------------------------
// IPRD RDT reader ECS task

resource "aws_lb_listener_rule" "iprd_rdt_reader" {
  listener_arn = "${aws_lb_listener.flu_api_listener.arn}"

  action {
    target_group_arn = "${aws_lb_target_group.iprd_rdt_reader.arn}"
    type = "forward"
  }

  condition {
    field = "path-pattern"
    values = ["${local.iprd_rdt_reader_subpath}*"]
  }
}

resource "aws_lb_target_group" "iprd_rdt_reader" {
  name = "iprd-rdt-reader-${var.environment}-public"
  port = 443
  protocol = "HTTPS"
  target_type = "ip"
  vpc_id = "${var.vpc_id}"

  # TODO once we have a working image with a health-check endpoint.
  # health_check {
  #   healthy_threshold = 2
  #   unhealthy_threshold = 2
  #   timeout = 5
  #   interval = 30
  #   path = "/IPRD/rdt-reader/health-check"
  #   port = "443"
  #   protocol = "HTTPS"
  # }
}

data "template_file" "iprd_rdt_reader" {
  template = "${file("${path.module}/iprd-rdt-reader.json")}"

  vars {
    account = "${var.account}"
    domain = "${local.api_full_domain}"
    subpath = "${local.iprd_rdt_reader_subpath}"
    environment = "${var.environment}"
    region = "${var.region}"
    subdomain = "${local.api_subdomain}"
  }
}

resource "aws_ecs_task_definition" "iprd_rdt_reader" {
  family = "iprd-rdt-reader-${var.environment}"
  container_definitions = "${data.template_file.iprd_rdt_reader.rendered}"
  task_role_arn = "${module.task_role.arn}"
  execution_role_arn = "${module.task_role.arn}"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu = 256
  memory = 1024
}

resource "aws_ecs_service" "iprd_rdt_reader" {
  name = "iprd-rdt-reader-${var.environment}"
  cluster = "${var.ecs_cluster_id}"
  task_definition = "${aws_ecs_task_definition.iprd_rdt_reader.arn}"
  desired_count = 1
  deployment_maximum_percent = 200
  deployment_minimum_healthy_percent = 100
  launch_type = "FARGATE"
  network_configuration {
    assign_public_ip = true
    security_groups = [
      "${var.internet_egress_sg_id}",
      "${var.fluapi_server_sg_id}",
    ]
    subnets = ["${var.app_subnet_id}"]
  }

  load_balancer {
    target_group_arn = "${aws_lb_target_group.iprd_rdt_reader.id}"
    container_name = "nginx-${var.environment}"
    container_port = 443
  }

  // No internal load balancer needed for RDT reader
}

resource "aws_cloudwatch_metric_alarm" "iprd_rdt_reader_task_alarm" {
  alarm_name = "iprd-rdt-reader-${var.environment}-active-tasks"
  alarm_description = "Monitors number of running tasks for the iprd-rdt-reader service"

  alarm_actions = [
    "${var.infra_alerts_sns_topic_arn}"
  ]

  ok_actions = [
    "${var.infra_alerts_sns_topic_arn}"
  ]

  comparison_operator = "LessThanThreshold"
  evaluation_periods = "1"
  insufficient_data_actions = []
  metric_name = "CPUUtilization"
  namespace = "AWS/ECS"
  period = "60"
  statistic = "SampleCount"
  threshold = "1"
  treat_missing_data = "breaching"
  dimensions {
    ClusterName = "${var.ecs_cluster_name}"
    ServiceName = "${aws_ecs_service.iprd_rdt_reader.name}"
  }
}
