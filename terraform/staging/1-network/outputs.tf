// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "app_subnet_id" {
  value = "${module.env_network.app_subnet_id}"
}

output "app_b_subnet_id" {
  value = "${module.env_network.app_b_subnet_id}"
}

output "bastion_ingress_sg_id" {
  value = "${module.env_network.bastion_ingress_sg_id}"
}

output "bastion_subnet_id" {
  value = "${module.env_network.bastion_subnet_id}"
}

output "db_nonpii_subnet_id" {
  value = "${module.env_network.db_nonpii_subnet_id}"
}

output "db_pii_subnet_id" {
  value = "${module.env_network.db_pii_subnet_id}"
}

output "db_client_sg_id" {
  value = "${module.env_network.db_client_sg_id}"
}

output "db_server_sg_id" {
  value = "${module.env_network.db_server_sg_id}"
}

output "dev_machine_client_sg_id" {
  value = "${module.env_network.dev_machine_client_sg_id}"
}

output "dev_machine_server_sg_id" {
  value = "${module.env_network.dev_machine_server_sg_id}"
}

output "dev_ssh_client_sg_id" {
  value = "${module.env_network.dev_ssh_client_sg_id}"
}

output "dev_ssh_server_sg_id" {
  value = "${module.env_network.dev_ssh_server_sg_id}"
}

output "dev_machine_subnet_id" {
  value = "${module.env_network.dev_machine_subnet_id}"
}

output "fluapi_internal_client_sg_id" {
  value = "${module.env_network.fluapi_internal_client_sg_id}"
}

output "fluapi_internal_server_sg_id" {
  value = "${module.env_network.fluapi_internal_server_sg_id}"
}

output "fluapi_client_sg_id" {
  value = "${module.env_network.fluapi_client_sg_id}"
}

output "fluapi_server_sg_id" {
  value = "${module.env_network.fluapi_server_sg_id}"
}

output "gateway_id" {
  value = "${module.env_network.gateway_id}"
}

output "internet_egress_sg_id" {
  value = "${module.env_network.internet_egress_sg_id}"
}

output "public_http_sg_id" {
  value = "${module.env_network.public_http_sg_id}"
}

output "reporting_client_sg_id" {
  value = "${module.env_network.reporting_client_sg_id}"
}

output "reporting_server_sg_id" {
  value = "${module.env_network.reporting_server_sg_id}"
}

output "route_table_id" {
  value = "${module.env_network.route_table_id}"
}

output "transient_subnet_id" {
  value = "${module.env_network.transient_subnet_id}"
}

output "vpc_id" {
  value = "${module.env_network.vpc_id}"
}
