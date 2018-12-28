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
  base_name = "flu-api-${var.environment}"
  instance_port = 3000
  service_url = "http://localhost:${local.instance_port}"
  util_sh = "${file("${path.module}/../assets/util.sh")}"

  availability_zones = ["us-west-2a"]

  // TODO: archive_file can create a .zip
  init_tar_bz2_base64_filename = "${path.module}/../../../local/flu-api-staging-init.tar.bz2.base64"
  init_tar_bz2_base64 = "${file("${local.init_tar_bz2_base64_filename}")}"

  ssh_public_key_directory = "${path.module}/../../../dev/ssh-keys"
  ram_ssh_public_key = "${file("${local.ssh_public_key_directory}/2018-ram.pub")}"
  mmarucheck_ssh_public_key = "${file("${local.ssh_public_key_directory}/2018-mmarucheck.pub")}"
}

data "aws_acm_certificate" "auderenow_io" {
  domain = "auderenow.io"
  types = ["AMAZON_ISSUED"]
  most_recent = true
}

data "template_file" "sequelize_migrate_sh" {
  template = "${file("${path.module}/cloud-init.sh")}"
  vars {
    commit = "master"
    domain = "${local.full_domain}"
    init_tar_bz2_base64 = "${local.init_tar_bz2_base64}"
    mmarucheck_ssh_public_key = "${local.mmarucheck_ssh_public_key}"
    mode = "migrate"
    ram_ssh_public_key = "${local.ram_ssh_public_key}"
    service_url = "${local.service_url}"
    subdomain = "${local.subdomain}"
    util_sh = "${local.util_sh}"
  }
}

data "template_file" "service_init_sh" {
  template = "${file("${path.module}/cloud-init.sh")}"
  vars {
    commit = "master"
    domain = "${local.full_domain}"
    init_tar_bz2_base64 = "${local.init_tar_bz2_base64}"
    mmarucheck_ssh_public_key = "${local.mmarucheck_ssh_public_key}"
    mode = "service"
    ram_ssh_public_key = "${local.ram_ssh_public_key}"
    service_url = "${local.service_url}"
    subdomain = "${local.subdomain}"
    util_sh = "${local.util_sh}"
  }
}


// --------------------------------------------------------------------------------
// Sequelize migration

resource "aws_instance" "migrate_instance" {
  ami = "${var.ami_id}"
  instance_type = "t2.micro"
  key_name = "2018-mmarucheck" # TODO remove
  subnet_id = "${aws_subnet.migrate.id}"
  user_data = "${data.template_file.sequelize_migrate_sh.rendered}"

  vpc_security_group_ids = [
    "${aws_security_group.internet_egress.id}",
    "${aws_security_group.migrate.id}",
    "${var.fludb_client_sg_id}",
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
// Single-instance mode (for debugging)

# resource "aws_instance" "flu_api_instance" {
#   ami = "${var.ami_id}"
#   instance_type = "t2.micro"
#   key_name = "2018-mmarucheck"
#   user_data = "${data.template_file.service_init_sh.rendered}"

#   vpc_security_group_ids = [
#     "${data.aws_security_group.default.id}",
#     "${data.aws_security_group.ssh.id}",
#     "${data.aws_security_group.http.id}",
#   ]

#   ebs_block_device {
#     device_name = "/dev/sdf"
#     snapshot_id = "${var.creds_snapshot_id}"
#   }

#   tags {
#     Name = "${local.base_name}-single"
#   }

#   count = "${var.service == "single" ? 1 : 0}"
# }


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

resource "aws_launch_configuration" "flu_api_instance" {
  image_id = "${var.ami_id}"
  instance_type = "t2.micro"
  user_data = "${data.template_file.service_init_sh.rendered}"

  security_groups = [
    "${aws_security_group.internet_egress.id}",
    "${module.fluapi_sg.server_id}",
    "${var.fludb_client_sg_id}",
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
