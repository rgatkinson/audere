// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

terraform {
  backend "s3" {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "lambda/terraform.state"
    region = "us-west-2"
  }
}

provider "aws" {
  version = "~> 2.43"
  region = "us-west-2"
}

provider "template" {
  version = "~> 1.0"
}

module "flu_lambda" {
  source = "../../modules/flu-lambda"

  chills_virena_bucket_arn = "${data.terraform_remote_state.flu_api.chills_virena_bucket_arn}"
  chills_virena_bucket_id = "${data.terraform_remote_state.flu_api.chills_virena_bucket_id}"
  cough_aspren_bucket_arn = "${data.terraform_remote_state.flu_api.cough_aspren_bucket_arn}"
  cough_aspren_bucket_id = "${data.terraform_remote_state.flu_api.cough_aspren_bucket_id}"
  cough_follow_ups_bucket_arn = "${data.terraform_remote_state.flu_api.cough_follow_ups_bucket_arn}"
  cough_follow_ups_bucket_id = "${data.terraform_remote_state.flu_api.cough_follow_ups_bucket_id}"
  environment = "staging"
  evidation_bucket_arn = "${data.terraform_remote_state.flu_api.evidation_bucket_arn}"
  evidation_bucket_id = "${data.terraform_remote_state.flu_api.evidation_bucket_id}"
  fluapi_fqdn = "${data.terraform_remote_state.flu_api.fluapi_internal_fqdn}"
  infra_alerts_sns_topic_arn = "${data.terraform_remote_state.flu_notifier.infra_alerts_sns_topic_arn}"
  internet_egress_sg = "${data.terraform_remote_state.network.internet_egress_sg_id}"
  internal_elb_access_sg = "${data.terraform_remote_state.network.fluapi_internal_client_sg_id}"
  lambda_subnet_id = "${data.terraform_remote_state.network.transient_subnet_id}"
}

data "terraform_remote_state" "flu_api" {
  backend = "s3"
  config {
    bucket = "flu-staging-terraform.auderenow.io"
    key = "api/terraform.state"
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
