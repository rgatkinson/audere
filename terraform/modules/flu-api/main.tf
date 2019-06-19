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
  instance_port = 3000
  service_url = "http://localhost:${local.instance_port}"
  assets_sha256 = "${chomp(file("${path.module}/../../../local/terraform-assets/sha256sum.txt"))}"

  availability_zones = ["${var.availability_zone}"]

  // TODO: archive_file can create a .zip
  init_tar_bz2_base64_filename = "${path.module}/../../../local/flu-api-staging-init.tar.bz2.base64"
  init_tar_bz2_base64 = "${file("${local.init_tar_bz2_base64_filename}")}"
}

module "ami" {
  source = "../ami"
}

data "template_file" "sequelize_migrate_sh" {
  template = "${file("${path.module}/cloud-init.sh")}"
  vars {
    assets_sha256 = "${local.assets_sha256}"
    commit = "${var.commit}"
    domain = "${local.api_full_domain}"
    environment = "${var.environment}"
    init_tar_bz2_base64 = "${local.init_tar_bz2_base64}"
    mode = "migrate"
    service_url = "${local.service_url}"
    ssh_public_key_map = "${module.devs.ssh_key_json}"
    subdomain = "${local.api_subdomain}"
  }
}

data "template_file" "service_init_sh" {
  template = "${file("${path.module}/cloud-init.sh")}"
  vars {
    assets_sha256 = "${local.assets_sha256}"
    commit = "${var.commit}"
    domain = "${local.api_full_domain}"
    environment = "${var.environment}"
    init_tar_bz2_base64 = "${local.init_tar_bz2_base64}"
    mode = "service"
    service_url = "${local.service_url}"
    ssh_public_key_map = "${module.devs.ssh_key_json}"
    subdomain = "${local.api_subdomain}"
  }
}

// --------------------------------------------------------------------------------
// Sequelize migration

resource "aws_instance" "migrate_instance" {
  ami = "${module.ami.ubuntu}"
  instance_type = "t2.small"
  subnet_id = "${var.transient_subnet_id}"
  user_data = "${data.template_file.sequelize_migrate_sh.rendered}"

  vpc_security_group_ids = [
    "${var.internet_egress_sg_id}",
    "${var.db_client_sg_id}",
    "${var.dev_ssh_server_sg_id}",
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

resource "aws_route53_record" "api_record" {
  zone_id = "${var.auderenow_route53_zone_id}"
  name = "${local.api_subdomain}.${var.auderenow_route53_zone_name}"
  type = "A"

  alias {
    name = "${aws_elb.flu_api_elb.dns_name}"
    zone_id = "${aws_elb.flu_api_elb.zone_id}"
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
    "${aws_elb.flu_api_elb.name}",
    "${aws_elb.flu_api_internal_elb.name}",
  ]
  max_size = 1
  min_size = 1
  vpc_zone_identifier = ["${var.app_subnet_id}"]
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

resource "aws_elb" "flu_api_elb" {
  name = "${local.base_name}-public"

  access_logs {
    bucket = "${var.elb_logs_bucket_id}"
    bucket_prefix = "public"
  }

  subnets = ["${var.app_subnet_id}"]

  security_groups = [
    "${var.public_http_sg_id}",
    "${var.fluapi_client_sg_id}",
  ]

  listener {
    lb_port = 443
    lb_protocol = "https"
    instance_port = 443
    instance_protocol = "https"
    ssl_certificate_id = "${var.auderenow_certificate_arn}"
  }

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 5
    interval = 30
    target = "HTTPS:443/api"
  }

  tags {
    Name = "${local.base_name}-public"
    LaunchConfig = "${aws_launch_configuration.flu_api_instance.name}"
  }

  count = "${var.service == "elb" ? 1 : 0}"
}

resource "aws_elb" "flu_api_internal_elb" {
  name = "${local.base_name}-internal"

  access_logs {
    bucket = "${var.elb_logs_bucket_id}"
    bucket_prefix = "internal"
  }

  subnets = ["${var.app_subnet_id}"]
  internal = true

  security_groups = [
    "${var.fluapi_client_sg_id}",
    "${var.fluapi_internal_server_sg_id}",
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
    "${var.internet_egress_sg_id}",
    "${var.fluapi_server_sg_id}",
    "${var.db_client_sg_id}",
    "${var.dev_ssh_server_sg_id}",
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
