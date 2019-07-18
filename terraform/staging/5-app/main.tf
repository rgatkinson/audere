// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

terraform {
  backend "s3" {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "api/terraform.state"
    region = "us-west-2"
  }
}

provider "aws" {
  version = "~> 1.50"
  region = "us-west-2"
}

provider "template" {
  version = "~> 1.0"
}

module "shared" {
  source = "../../modules/app-shared"

  app_subnet_id = "${data.terraform_remote_state.network.app_subnet_id}"
  db_client_sg_id = "${data.terraform_remote_state.network.db_client_sg_id}"
  dev_ssh_server_sg_id = "${data.terraform_remote_state.network.dev_ssh_server_sg_id}"
  devs = "${var.devs}"
  environment = "staging"
  infra_alerts_sns_topic_arn = "${data.terraform_remote_state.flu_notifier.infra_alerts_sns_topic_arn}"
  internet_egress_sg_id = "${data.terraform_remote_state.network.internet_egress_sg_id}"
  reporting_server_sg_id = "${data.terraform_remote_state.network.reporting_server_sg_id}"
}

module "flu_api" {
  source = "../../modules/flu-api"

  app_subnet_id = "${data.terraform_remote_state.network.app_subnet_id}"
  auderenow_certificate_arn = "${module.shared.auderenow_certificate_arn}"
  auderenow_route53_zone_id = "${module.shared.auderenow_route53_zone_id}"
  auderenow_route53_zone_name = "${module.shared.auderenow_route53_zone_name}"
  commit = "${var.commit}"
  cough_aspren_bucket = "${module.shared.cough_aspren_bucket_arn}"
  audere_share_bucket = "${data.terraform_remote_state.global.audere_share_arn}"
  creds_snapshot_id = "${data.terraform_remote_state.flu_db.api_creds_snapshot_id}"
  db_client_sg_id = "${data.terraform_remote_state.network.db_client_sg_id}"
  dev_ssh_server_sg_id = "${data.terraform_remote_state.network.dev_ssh_server_sg_id}"
  devs = "${var.devs}"
  elb_logs_bucket_id = "${module.shared.elb_logs_bucket_id}"
  environment = "staging"
  fluapi_client_sg_id = "${data.terraform_remote_state.network.fluapi_client_sg_id}"
  fluapi_internal_client_sg_id = "${data.terraform_remote_state.network.fluapi_internal_client_sg_id}"
  fluapi_internal_server_sg_id = "${data.terraform_remote_state.network.fluapi_internal_server_sg_id}"
  fluapi_server_sg_id = "${data.terraform_remote_state.network.fluapi_server_sg_id}"
  internet_egress_sg_id = "${data.terraform_remote_state.network.internet_egress_sg_id}"
  migrate = "${var.migrate}"
  public_http_sg_id = "${data.terraform_remote_state.network.public_http_sg_id}"
  service = "${var.service}"
  transient_subnet_id = "${data.terraform_remote_state.network.transient_subnet_id}"
}

module "reporting" {
  source = "../../modules/reporting"

  account = "${var.account}"
  app_subnet_id = "${data.terraform_remote_state.network.app_subnet_id}"
  auderenow_certificate_arn = "${module.shared.auderenow_certificate_arn}"
  auderenow_route53_zone_id = "${module.shared.auderenow_route53_zone_id}"
  auderenow_route53_zone_name = "${module.shared.auderenow_route53_zone_name}"
  ecs_cluster_id = "${module.shared.ecs_cluster_id}"
  ecs_service_linked_role_arn = "${data.terraform_remote_state.global.ecs_service_linked_role_arn}"
  elb_logs_bucket_id = "${module.shared.elb_logs_bucket_id}"
  environment = "staging"
  metabase_database_address = "${data.terraform_remote_state.flu_db.metabase_database_address}"
  public_http_sg_id = "${data.terraform_remote_state.network.public_http_sg_id}"
  region = "${var.region}"
  reporting_client_sg_id = "${data.terraform_remote_state.network.reporting_client_sg_id}"
  ssm_parameters_key_arn = "${data.terraform_remote_state.global.ssm_parameters_key_arn}"
}

module "vpc_cidr" {
  source = "../../modules/vpc-cidr"
}

data "terraform_remote_state" "flu_db" {
  backend = "s3"
  config {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "db/terraform.state"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "flu_notifier" {
  backend = "s3"
  config {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "notifier/terraform.state"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "network" {
  backend = "s3"
  config {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "network/terraform.state"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "global" {
  backend = "s3"
  config {
    bucket = "global-terraform.auderenow.io"
    key = "policy/terraform.state"
    region = "us-west-2"
  }
}
