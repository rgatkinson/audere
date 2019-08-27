// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  airflow_subdomains = {
    prod = "airflow"
    staging = "airflow.staging"
  }
  airflow_subdomain = "${local.reporting_subdomains["${var.environment}"]}"
  ecr_registry = "${var.account}.dkr.ecr.${var.region}.amazonaws.com"
}

// --------------------------------------------------------------------------------
// Load balancer

resource "aws_lb" "airflow_lb" {
  name = "airflow-${var.environment}"
  subnets = [
    "${var.app_subnet_id}",
    "${var.app_b_subnet_id}",
  ]
  security_groups = [
    "${var.public_http_sg_id}",
    "${var.ecs_dynamic_client_sg_id}",
  ]

  access_logs {
    bucket = "${var.elb_logs_bucket_id}"
    bucket_prefix = "reporting"
    enabled = true
  }
}

resource "aws_lb_target_group" "webserver" {
  name = "airflow-webserver-${var.environment}"
  port = 443
  protocol = "HTTPS"
  vpc_id = "${var.vpc_id}"
}

resource "aws_lb_target_group" "flower" {
  name = "airflow-flower-${var.environment}"
  port = 443
  protocol = "HTTPS"
  vpc_id = "${varr.vpc_id}"
}

resource "aws_lb_listener" "airflow_listener" {
  load_balancer_arn = "${aws_lb.airflow_lb.id}"
  port = 443
  protocol = "HTTPS"

  default_action {
    target_group_arn = "${aws_lb_target_group.webserver.id}"
    type = "forward"
  }
}

resource "aws_lb_listener_rule" "flower_routing" {
  listener_arn = "${aws_lb_listener.airflow_listener.arn}"

  action {
    target_group_arn = "${aws_lb_target_group.flower.arn}"
    type = "forward"
  }

  condition {
    field = "path-pattern"
    values = ["/flower/*"]
  }
}

resource "aws_route53_record" "airflow_record" {
  zone_id = "${var.auderenow_route53_zone_id}"
  name = "${local.airflow_subdomain}.${var.auderenow_route53_zone_name}"
  type = "A"

  alias {
    name = "${aws_lb.airflow_lb.dns_name}"
    zone_id = "${aws_lb.airflow_lb.zone_id}"
    evaluate_target_health = true
  }
}

// --------------------------------------------------------------------------------
// Celery Redis (task queue)

resource "aws_elasticache_cluster" "celery_queue" {
  cluster_id = "airflow-celery-${var.environment}"
  engine = "redis"
  node_type = "cache.t2.small"
  num_cache_nodes = 1
  parameter_group_name = "default.redis5.0"
  port = 6379
  security_group_ids = ["${var.redis_server_sg_id}"]
}

// --------------------------------------------------------------------------------
// Airflow tasks

data "template_file" "webserver" {
  template = "${file("${path.module}/airflow.json")}"

  vars {
    account = "${var.account}"
    container_name = "airflow-webserver-${var.environment}"
    container_port = 8080
    fernet_key = "airflow-${var.environment}.fernet"
    host_port = 0
    redis_host = "${aws_elasticache_cluster.celery_queue.cache_nodes.0.address}"
    redis_port = "${aws_elasticache_cluster.celery_queue.cache_nodes.0.port}"
    postgres_host = "${var.airflow_database_address}"
    postgres_pass_key = "airflow-${var.environment}.pass"
    postgres_user_key = "airflow-${var.environment}.user"
    environment = "${var.environment}"
    image = "${local.ecr_registry}/airflow:${var.environment}"
    command = "webserver"
    region = "${var.region}"
  }
}

resource "aws_ecs_task_definition" "webserver" {
  family = "airflow-webserver-${var.environment}"
  container_definitions = "${data.template_file.webserver.rendered}"
  execution_role_arn = "${aws_iam_role.airflow_task_execution_role.arn}"
}

resource "aws_ecs_service" "webserver" {
  name = "airflow-webserver-${var.environment}"
  cluster = "${var.ecs_cluster_id}"
  task_definition = "${aws_ecs_task_definition.webserver.arn}"
  desired_count = 1
  iam_role = "${var.ecs_service_linked_role_arn}"

  load_balancer {
    target_group_arn = "${aws_lb_target_group.webserver.id}"
    container_name = "airflow-webserver-${var.environment}"
    container_port = 8080
  }
}

data "template_file" "scheduler" {
  template = "${file("${path.module}/airflow.json")}"

  vars {
    account = "${var.account}"
    container_name = "airflow-scheduler-${var.environment}"
    container_port = 8793
    fernet_key = "airflow-${var.environment}.fernet"
    host_port = 0
    redis_host = "${aws_elasticache_cluster.celery_queue.cache_nodes.0.address}"
    redis_port = "${aws_elasticache_cluster.celery_queue.cache_nodes.0.port}"
    postgres_host = "${var.airflow_database_address}"
    postgres_pass_key = "airflow-${var.environment}.pass"
    postgres_user_key = "airflow-${var.environment}.user"
    environment = "${var.environment}"
    image = "${local.ecr_registry}/airflow:${var.environment}"
    command = "scheduler"
    region = "${var.region}"
  }
}

resource "aws_ecs_task_definition" "scheduler" {
  family = "airflow-scheduler-${var.environment}"
  container_definitions = "${data.template_file.scheduler.rendered}"
  execution_role_arn = "${aws_iam_role.airflow_task_execution_role.arn}"
}

resource "aws_ecs_service" "scheduler" {
  name = "airflow-scheduler-${var.environment}"
  cluster = "${var.ecs_cluster_id}"
  task_definition = "${aws_ecs_task_definition.scheduler.arn}"
  desired_count = 1
  iam_role = "${var.ecs_service_linked_role_arn}"
}

data "template_file" "worker" {
  template = "${file("${path.module}/airflow_no_ports.json")}"

  vars {
    account = "${var.account}"
    container_name = "airflow-worker-${var.environment}"
    fernet_key = "airflow-${var.environment}.fernet"
    redis_host = "${aws_elasticache_cluster.celery_queue.cache_nodes.0.address}"
    redis_port = "${aws_elasticache_cluster.celery_queue.cache_nodes.0.port}"
    postgres_host = "${var.airflow_database_address}"
    postgres_pass_key = "airflow-${var.environment}.pass"
    postgres_user_key = "airflow-${var.environment}.user"
    environment = "${var.environment}"
    image = "${local.ecr_registry}/airflow:${var.environment}"
    command = "worker"
    region = "${var.region}"
  }
}

resource "aws_ecs_task_definition" "worker" {
  family = "airflow-worker-${var.environment}"
  container_definitions = "${data.template_file.worker.rendered}"
  execution_role_arn = "${aws_iam_role.airflow_task_execution_role.arn}"
}

resource "aws_ecs_service" "worker" {
  name = "airflow-worker-${var.environment}"
  cluster = "${var.ecs_cluster_id}"
  task_definition = "${aws_ecs_task_definition.scheduler.arn}"
  desired_count = 2
  iam_role = "${var.ecs_service_linked_role_arn}"
}

data "template_file" "flower" {
  template = "${file("${path.module}/airflow.json")}"

  vars {
    account = "${var.account}"
    container_name = "airflow-flower-${var.environment}"
    container_port = 5555
    fernet_key = "airflow-${var.environment}.fernet"
    host_port = 0
    redis_host = "${aws_elasticache_cluster.celery_queue.cache_nodes.0.address}"
    redis_port = "${aws_elasticache_cluster.celery_queue.cache_nodes.0.port}"
    postgres_host = "${var.airflow_database_address}"
    postgres_pass_key = "airflow-${var.environment}.pass"
    postgres_user_key = "airflow-${var.environment}.user"
    environment = "${var.environment}"
    image = "${local.ecr_registry}/airflow:${var.environment}"
    command = "flower"
    region = "${var.region}"
  }
}

resource "aws_ecs_task_definition" "flower" {
  family = "airflow-flower-${var.environment}"
  container_definitions = "${data.template_file.flower.rendered}"
  execution_role_arn = "${aws_iam_role.airflow_task_execution_role.arn}"
}

resource "aws_ecs_service" "flower" {
  name = "airflow-flower-${var.environment}"
  cluster = "${var.ecs_cluster_id}"
  task_definition = "${aws_ecs_task_definition.flower.arn}"
  desired_count = 1
  iam_role = "${var.ecs_service_linked_role_arn}"

  load_balancer {
    target_group_arn = "${aws_lb_target_group.flower.id}"
    container_name = "airflow-flower-${var.environment}"
    container_port = 5555
  }
}
