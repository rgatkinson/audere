// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  subdomains = {
    prod = "api"
    staging = "api.staging"
  }
  subdomain = "${local.subdomains["${var.environment}"]}"
  full_domain = "${local.subdomain}.auderenow.io"
  base_name = "flu-${var.environment}-api"
  instance_port = 3000
  service_url = "http://localhost:${local.instance_port}"
  assets_sha256 = "${chomp(file("${path.module}/../../../local/terraform-assets/sha256sum.txt"))}"

  availability_zones = ["us-west-2a"]

  // TODO: archive_file can create a .zip
  init_tar_bz2_base64_filename = "${path.module}/../../../local/flu-api-staging-init.tar.bz2.base64"
  init_tar_bz2_base64 = "${file("${local.init_tar_bz2_base64_filename}")}"
}

module "ami" {
  source = "../ami"
}

data "aws_acm_certificate" "auderenow_io" {
  domain = "auderenow.io"
  types = ["AMAZON_ISSUED"]
  most_recent = true
}

data "template_file" "sequelize_migrate_sh" {
  template = "${file("${path.module}/cloud-init.sh")}"
  vars {
    assets_sha256 = "${local.assets_sha256}"
    commit = "${var.commit}"
    domain = "${local.full_domain}"
    environment = "${var.environment}"
    init_tar_bz2_base64 = "${local.init_tar_bz2_base64}"
    mode = "migrate"
    service_url = "${local.service_url}"
    ssh_public_key_map = "${module.devs.ssh_key_json}"
    subdomain = "${local.subdomain}"
  }
}

data "template_file" "service_init_sh" {
  template = "${file("${path.module}/cloud-init.sh")}"
  vars {
    assets_sha256 = "${local.assets_sha256}"
    commit = "${var.commit}"
    domain = "${local.full_domain}"
    environment = "${var.environment}"
    init_tar_bz2_base64 = "${local.init_tar_bz2_base64}"
    mode = "service"
    service_url = "${local.service_url}"
    ssh_public_key_map = "${module.devs.ssh_key_json}"
    subdomain = "${local.subdomain}"
  }
}


// --------------------------------------------------------------------------------
// Sequelize migration

resource "aws_instance" "migrate_instance" {
  ami = "${module.ami.ubuntu}"
  instance_type = "t2.small"
  subnet_id = "${aws_subnet.transient.id}"
  user_data = "${data.template_file.sequelize_migrate_sh.rendered}"

  vpc_security_group_ids = [
    "${aws_security_group.internet_egress.id}",
    "${var.fludb_client_sg_id}",
    "${var.fludev_ssh_server_sg_id}",
  ]

  ebs_block_device {
    device_name = "/dev/sdf"
    snapshot_id = "${var.creds_snapshot_id}"
  }

  tags {
    Name = "${local.base_name}-migrate"
  }

  count = "${var.migrate == "true" ? 1 : 0}"
}


// --------------------------------------------------------------------------------
// ELB (multi-instance) mode

data "aws_route53_zone" "auderenow_io" {
  name = "auderenow.io."
}

resource "aws_route53_record" "api_record" {
  zone_id = "${data.aws_route53_zone.auderenow_io.id}"
  name = "${local.subdomain}.${data.aws_route53_zone.auderenow_io.name}"
  type = "A"

  alias {
    name = "${aws_lb.front_end.dns_name}"
    zone_id = "${aws_lb.front_end.zone_id}"
    evaluate_target_health = true
  }

  count = "${var.service == "elb" ? 1 : 0}"
}

resource "aws_autoscaling_group" "flu_api" {
  name = "${aws_launch_configuration.flu_api_instance.name}"
  availability_zones = "${local.availability_zones}"
  health_check_type = "ELB"
  launch_configuration = "${aws_launch_configuration.flu_api_instance.id}"
  load_balancers = [
    "${aws_elb.flu_api_internal_elb.name}",
  ]
  max_size = 1
  min_size = 1
  target_group_arns = [
    "${aws_lb_target_group.flu_api_public.arn}"
  ],
  vpc_zone_identifier = ["${aws_subnet.api.id}"]
  wait_for_elb_capacity = 1

  tag {
    key = "Name"
    value = "${local.base_name}"
    propagate_at_launch = true
  }

  count = "${var.service == "elb" ? 1 : 0}"

  lifecycle {
    create_before_destroy = true
  }
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
      identifiers = ["797873946194"]
    }
  }
}

resource "aws_lb" "front_end" {
  name = "${local.base_name}-public"

  access_logs {
    bucket = "${aws_s3_bucket.elb_logs.id}"
    prefix = "public"
    enabled = true
  }

  subnets = ["${aws_subnet.api.id}"]

  security_groups = [
    "${aws_security_group.public_http.id}",
    "${module.fluapi_sg.client_id}",
  ]

  count = "${var.service == "elb" ? 1 : 0}"
}

resource "aws_lb_target_group" "flu_api_public" {
  name = "${local.base_name}-api"
  port = "443"
  protocol = "HTTPS"

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 5
    interval = 30
    path = "/api"
  }

  count = "${var.service == "elb" ? 1 : 0}"
}

resource "aws_lb_target_group" "flu_reporting_public" {
  name = "${local.base_name}-reporting"
  port = "443"
  protocol = "HTTPS"

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 5
    interval = 30
    path = "/api/health"
  }

  count = "${var.service == "elb" ? 1 : 0}"
}

resource "aws_lb_listener" "front_end" {
  load_balancer_arn = "${aws_lb.front_end.arn}"
  port = "443"
  protocol = "HTTPS"
  certificate_arn = "${data.aws_acm_certificate.auderenow_io.arn}"

  default_action {
    type = "forward"
    target_group_arn = "${aws_lb_target_group.flu_api_public.arn}"
  }

  count = "${var.service == "elb" ? 1 : 0}"
}

resource "aws_lb_listener_rule" "reporting" {
  listener_arn = "${aws_lb_listener.front_end.arn}"
  priority = 100

  action {
    type = "forward"
    target_group_arn = "${aws_lb_target_group.flu_reporting_public.arn}"
  }

  condition {
    field = "path-pattern"
    values = ["/reporting/*"]
  }
}

resource "aws_elb" "flu_api_internal_elb" {
  name = "${local.base_name}-internal"

  access_logs {
    bucket = "${aws_s3_bucket.elb_logs.id}"
    bucket_prefix = "internal"
  }

  subnets = ["${aws_subnet.api.id}"]
  internal = true

  security_groups = [
    "${module.fluapi_sg.client_id}",
    "${module.elbinternal_sg.server_id}",
  ]

  listener {
    lb_port = 444
    lb_protocol = "http"
    instance_port = 444
    instance_protocol = "https"
  }

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 5
    interval = 30
    target = "HTTPS:444/api"
  }

  tags {
    Name = "${local.base_name}-internal"
    LaunchConfig = "${aws_launch_configuration.flu_api_instance.name}"
  }

  count = "${var.service == "elb" ? 1 : 0}"
}

resource "aws_launch_configuration" "flu_api_instance" {
  name_prefix = "${local.base_name}-"
  iam_instance_profile = "${aws_iam_instance_profile.flu_api.name}"
  image_id = "${module.ami.ubuntu}"
  instance_type = "t3.small"
  user_data = "${data.template_file.service_init_sh.rendered}"

  security_groups = [
    "${aws_security_group.internet_egress.id}",
    "${module.fluapi_sg.server_id}",
    "${var.fludb_client_sg_id}",
    "${var.fludev_ssh_server_sg_id}",
  ]

  ebs_block_device {
    device_name = "/dev/sdf"
    snapshot_id = "${var.creds_snapshot_id}"
    volume_type = "gp2"
  }

  lifecycle {
    create_before_destroy = true
  }

  count = "${var.service == "elb" ? 1 : 0}"
}

module "devs" {
  source = "../devs"
  userids = "${var.devs}"
}

// --------------------------------------------------------------------------------
// CloudWatch log group

resource "aws_cloudwatch_log_group" "flu_api_log_group" {
  name = "${local.base_name}"
  retention_in_days = 30

  tags = {
    environment = "${var.environment}"
    application = "FluApi"
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
// Metabase & ECS

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

module "ecs_cluster" {
  source = "../ecs-cluster"
  cluster_name = "${local.base_name}-ecs"
  environment = "${var.environment}"
  iam_instance_profile = "${aws_iam_instance_profile.flu_api.id}"
  subnet_ids = ["${aws_subnet.api.id}"]
  security_groups = [
    "${aws_security_group.internet_egress.id}",
    "${module.fluapi_sg.server_id}",
    "${var.fludb_client_sg_id}",
    "${var.fludev_ssh_server_sg_id}",
  ]
}

resource "aws_ecs_task_definition" "metabase" {
  family = "metabase-${var.environment}"
  container_definitions = "${data.template_file.metabase.rendered}"
  execution_role_arn = "${aws_iam_role.ecs_task_execution_role.arn}"
}

resource "aws_ecs_service" "metabase" {
  name = "metabase-${var.environment}"
  cluster = "${module.ecs_cluster.id}"
  task_definition = "${aws_ecs_task_definition.metabase.arn}"
  desired_count = 1

  load_balancer {
    target_group_arn = "${aws_lb_target_group.flu_reporting_public.arn}"
    container_name = "metabase-${var.environment}"
    container_port = 3000
  }
}
