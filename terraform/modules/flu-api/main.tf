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
  util_sh = "${file("${path.module}/../assets/util.sh")}"

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
    commit = "${var.commit}"
    domain = "${local.full_domain}"
    environment = "${var.environment}"
    init_tar_bz2_base64 = "${local.init_tar_bz2_base64}"
    mode = "migrate"
    service_url = "${local.service_url}"
    ssh_public_key_map = "${module.devs.ssh_key_json}"
    subdomain = "${local.subdomain}"
    util_sh = "${local.util_sh}"
  }
}

data "template_file" "service_init_sh" {
  template = "${file("${path.module}/cloud-init.sh")}"
  vars {
    commit = "${var.commit}"
    environment = "${var.environment}"
    domain = "${local.full_domain}"
    init_tar_bz2_base64 = "${local.init_tar_bz2_base64}"
    mode = "service"
    service_url = "${local.service_url}"
    ssh_public_key_map = "${module.devs.ssh_key_json}"
    subdomain = "${local.subdomain}"
    util_sh = "${local.util_sh}"
  }
}


// --------------------------------------------------------------------------------
// Sequelize migration

resource "aws_instance" "migrate_instance" {
  ami = "${module.ami.ubuntu}"
  instance_type = "t2.micro"
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
    name = "${aws_elb.flu_api_elb.dns_name}"
    zone_id = "${aws_elb.flu_api_elb.zone_id}"
    evaluate_target_health = true
  }

  count = "${var.service == "elb" ? 1 : 0}"
}

resource "aws_autoscaling_group" "flu_api" {
  availability_zones = "${local.availability_zones}"
  health_check_type = "ELB"
  launch_configuration = "${aws_launch_configuration.flu_api_instance.id}"
  load_balancers = ["${aws_elb.flu_api_elb.name}"]
  max_size = 1
  min_size = 1
  vpc_zone_identifier = ["${aws_subnet.api.id}"]

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
  name = "${local.base_name}"
  # availability_zones = "${local.availability_zones}"
  subnets = ["${aws_subnet.api.id}"]

  security_groups = [
    "${aws_security_group.public_http.id}",
    "${module.fluapi_sg.client_id}",
  ]

  listener {
    lb_port = 443
    lb_protocol = "https"
    instance_port = 443
    instance_protocol = "https"
    ssl_certificate_id = "${data.aws_acm_certificate.auderenow_io.arn}"
  }

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 2
    timeout = 5
    interval = 30
    target = "HTTPS:443/api"
  }

  tags {
    key = "Name"
    value = "${local.base_name}"
  }

  count = "${var.service == "elb" ? 1 : 0}"
}

resource "aws_elb" "flu_api_internal_elb" {
  name = "${local.base_name}-internal"
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

  tags {
    key = "Name"
    value = "${local.base_name}-internal"
  }

  count = "${var.service == "elb" ? 1 : 0}"
}

resource "aws_launch_configuration" "flu_api_instance" {
  iam_instance_profile = "${aws_iam_instance_profile.flu_api.name}"
  image_id = "${module.ami.ubuntu}"
  instance_type = "t2.micro"
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
}
