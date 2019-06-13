// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

terraform {
  backend "s3" {
    bucket = "flu-prod-terraform.auderenow.io"
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

module "flu_api" {
  source = "../../modules/flu-api"

  account = "${var.account}"
  app_subnet_id = "${data.terraform_remote_state.network.app_subnet_id}"
  commit = "${var.commit}"
  creds_snapshot_id = "${data.terraform_remote_state.flu_db.api_creds_snapshot_id}"
  db_client_sg_id = "${data.terraform_remote_state.network.db_client_sg_id}"
  dev_ssh_server_sg_id = "${data.terraform_remote_state.network.dev_ssh_server_sg_id}"
  devs = "${var.devs}"
  ecs_service_linked_role_arn = "${data.terraform_remote_state.global.ecs_service_linked_role_arn}"
  environment = "prod"
  fluapi_client_sg_id = "${data.terraform_remote_state.network.fluapi_client_sg_id}"
  fluapi_internal_client_sg_id = "${data.terraform_remote_state.network.fluapi_internal_client_sg_id}"
  fluapi_internal_server_sg_id = "${data.terraform_remote_state.network.fluapi_internal_server_sg_id}"
  fluapi_server_sg_id = "${data.terraform_remote_state.network.fluapi_server_sg_id}"
  infra_alerts_sns_topic_arn = "${data.terraform_remote_state.flu_notifier.infra_alerts_sns_topic_arn}"
  internet_egress_sg_id = "${data.terraform_remote_state.network.internet_egress_sg_id}"
  metabase_database_address = "${data.terraform_remote_state.flu_db.metabase_database_address}"
  migrate = "${var.migrate}"
  public_http_sg_id = "${data.terraform_remote_state.network.public_http_sg_id}"
  region = "${var.region}"
  reporting_client_sg_id = "${data.terraform_remote_state.network.reporting_client_sg_id}"
  reporting_server_sg_id = "${data.terraform_remote_state.network.reporting_server_sg_id}"
  service = "${var.service}"
  ssm_parameters_key_arn = "${data.terraform_remote_state.global.ssm_parameters_key_arn}"
  transient_subnet_id = "${data.terraform_remote_state.network.transient_subnet_id}"
}

module "flu_dev" {
  source = "../../modules/flu-dev"

  bastion_ingress_sg_id = "${data.terraform_remote_state.network.bastion_ingress_sg_id}"
  bastion_subnet_id = "${data.terraform_remote_state.network.bastion_subnet_id}"
  db_client_sg_id = "${data.terraform_remote_state.network.db_client_sg_id}"
  dev_machine_client_sg_id = "${data.terraform_remote_state.network.dev_machine_client_sg_id}"
  dev_machine_server_sg_id = "${data.terraform_remote_state.network.dev_machine_server_sg_id}"
  dev_machine_subnet_id = "${data.terraform_remote_state.network.dev_machine_subnet_id}"
  dev_ssh_client_sg_id = "${data.terraform_remote_state.network.dev_ssh_client_sg_id}"
  devs = "${var.devs}"
  fluapi_internal_client_sg_id = "${data.terraform_remote_state.network.fluapi_internal_client_sg_id}"
  environment = "prod"
  internet_egress_sg_id = "${data.terraform_remote_state.network.internet_egress_sg_id}"
}

module "vpc_cidr" {
  source = "../../modules/vpc-cidr"
}

data "terraform_remote_state" "network" {
  backend = "s3"
  config {
    bucket = "flu-prod-terraform.auderenow.io"
    key = "network/terraform.state"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "flu_db" {
  backend = "s3"
  config {
    bucket = "flu-prod-terraform.auderenow.io"
    key = "db/terraform.state"
    region = "us-west-2"
  }
}

data "terraform_remote_state" "global" {
  backend = "local"
  config {
    path = "../../global/terraform.tfstate"
  }
}

data "terraform_remote_state" "flu_notifier" {
  backend = "s3"
  config {
    bucket = "flu-prod-terraform.auderenow.io"
    key = "notifier/terraform.state"
    region = "us-west-2"
  }
}
