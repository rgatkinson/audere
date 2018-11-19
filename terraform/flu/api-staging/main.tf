// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  init_tar_bz2_base64 = "${file("${var.init_tar_bz2_base64_filename}")}"
}

provider "aws" {
  region = "us-west-2"
}
variable "availability_zones" {
  description = "List of availability zones in which to deploy"
  type = "list"
  default = ["us-west-2a"]
}

variable "init_tar_bz2_base64_filename" {
  default = "../../../local/flu-api-staging-init.tar.bz2.base64"
}

variable "flu_api_instance_port" {
  description = "Port for HTTP requests"
  default = 3000
}

# TODO remove
variable "ssh_key_name" {
  description = "Key name to use for setting up instances"
  default = "2018-mmarucheck"
}

module "ami" { source = "../../modules/ami" }

data "terraform_remote_state" "db" {
  backend = "local"
  config {
    path = "../1-db/terraform.tfstate"
  }
}

data "aws_security_group" "default" { name = "default" }

data "aws_security_group" "http" { name = "http" }

data "aws_security_group" "ssh" { name = "ssh" }

data "aws_acm_certificate" "auderenow_io" {
  domain = "auderenow.io"
  types = ["AMAZON_ISSUED"]
  most_recent = true
}

# TODO remove
resource "aws_instance" "flu_api_instance" {
  ami = "${module.ami.ubuntu}"
  instance_type = "t2.micro"
  key_name = "2018-mmarucheck"
  user_data = "${data.template_file.cloud_init_sh.rendered}"
  vpc_security_group_ids = [
    "${data.aws_security_group.default.id}",
    "${data.aws_security_group.ssh.id}",
  ]

  # TODO: manually create a snapshot so we can tag it
  ebs_block_device {
    device_name = "/dev/sdf"
    snapshot_id = "${data.terraform_remote_state.db.api_staging_snapshot_id}"
  }

  tags {
    Name = "staging"
  }
}
# TODO end remove

# data "aws_route53_zone" "auderenow_io" {
#   name = "auderenow.io."
# }

# resource "aws_route53_record" "api_staging" {
#   zone_id = "${data.aws_route53_zone.auderenow_io.id}"
#   name = "api.staging.${data.aws_route53_zone.auderenow_io.name}"
#   type = "A"

#   alias {
#     name = "${aws_elb.flu_api_elb.dns_name}"
#     zone_id = "${aws_elb.flu_api_elb.zone_id}"
#     evaluate_target_health = true
#   }
# }

# resource "aws_autoscaling_group" "flu_api" {
#   launch_configuration = "${aws_launch_configuration.flu_api_instance.id}"
#   availability_zones = "${var.availability_zones}"
#   #load_balancers = ["${aws_elb.flu_api_elb.name}"]
#   #health_check_type = "ELB"

#   min_size = 1
#   max_size = 1 # TODO staging

#   tag {
#     key = "Name"
#     value = "flu-api-staging"
#     propagate_at_launch = true
#   }
# }

# resource "aws_elb" "flu_api_elb" {
#   name = "flu-api-staging"
#   availability_zones = "${var.availability_zones}"

#   security_groups = [
#     "${aws_security_group.flu_api_elb.id}",
#     "${data.aws_security_group.default.id}",
#   ]

#   listener {
#     lb_port = 443
#     lb_protocol = "https"
#     instance_port = "${var.flu_api_instance_port}"
#     instance_protocol = "https"
#     ssl_certificate_id = "${data.aws_acm_certificate.auderenow_io.arn}"
#   }

#   # TODO
#   # health_check {
#   #   healthy_threshold = 2
#   #   unhealthy_threshold = 2
#   #   timeout = 10
#   #   interval = 120
#   #   target = "HTTP:${var.flu_api_instance_port}/"
#   # }

#   tags {
#     key = "Name"
#     value = "flu-api-staging"
#   }
# }

# resource "aws_launch_configuration" "flu_api_instance" {
#   image_id = "${module.ami.ubuntu}"
#   instance_type = "t2.micro"
#   key_name = "2018-mmarucheck" # TODO remove
#   user_data = "${data.template_file.cloud_init_sh.rendered}"

#   # TODO: allow https from LB, from dev machines, postgres to db
#   security_groups = [
#     "${data.aws_security_group.default.id}",
#     "${data.aws_security_group.http.id}",
#     "${data.aws_security_group.ssh.id}",
#     "${aws_security_group.flu_api_instance.id}",
#   ]

#   # TODO: manually create a snapshot so we can tag it
#   ebs_block_device {
#     device_name = "/dev/sdf"
#     snapshot_id = "${data.terraform_remote_state.db.api_staging_snapshot_id}"
#   }

#   lifecycle {
#     create_before_destroy = true
#   }
# }

resource "aws_security_group" "flu_api_elb" {
  name = "flu-api-elb"

  ingress {
    from_port = 80
    to_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port = 443
    to_port = 443
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # TODO: allow egress to api instances
  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "flu_api_instance" {
  name = "flu-api-instance"

  ingress {
    from_port = "${var.flu_api_instance_port}"
    to_port = "${var.flu_api_instance_port}"
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["209.63.143.172/32"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

data "template_file" "cloud_init_sh" {
  template = "${file("./cloud-init.sh")}"
  vars {
    api_port = "${var.flu_api_instance_port}"
    subdomain = "api.staging"
    domain = "api.staging.auderenow.io"
    service_url = "http://localhost:3000"
    repo_tag = "5f2fced1163"
    init_tar_bz2_base64 = "${local.init_tar_bz2_base64}"
  }
}
