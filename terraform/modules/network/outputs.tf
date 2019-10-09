// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

output "app_subnet_id" {
  value = "${aws_subnet.app.id}"
}

output "app_b_subnet_id" {
  value = "${aws_subnet.app_b.id}"
}

output "bastion_ingress_sg_id" {
  value = "${aws_security_group.bastion_ingress.id}"
}

output "bastion_subnet_id" {
  value = "${aws_subnet.bastion.id}"
}

output "db_client_sg_id" {
  value = "${module.db_sg.client_id}"
}

output "db_server_sg_id" {
  value = "${module.db_sg.server_id}"
}

output "dev_machine_client_sg_id" {
  value = "${module.dev_machine_sg.client_id}"
}

output "dev_machine_server_sg_id" {
  value = "${module.dev_machine_sg.server_id}"
}

output "dev_machine_subnet_id" {
  value = "${aws_subnet.dev_machine.id}"
}

output "dev_ssh_client_sg_id" {
  value = "${module.dev_ssh_sg.client_id}"
}

output "dev_ssh_server_sg_id" {
  value = "${module.dev_ssh_sg.server_id}"
}

output "db_nonpii_subnet_id" {
  value = "${aws_subnet.db_nonpii.id}"
}

output "db_pii_subnet_id" {
  value = "${aws_subnet.db_pii.id}"
}

output "fluapi_client_sg_id" {
  value = "${module.fluapi_sg.client_id}"
}

output "fluapi_internal_client_sg_id" {
  value = "${module.fluapi_internal_sg.client_id}"
}

output "fluapi_internal_server_sg_id" {
  value = "${module.fluapi_internal_sg.server_id}"
}

output "fluapi_server_sg_id" {
  value = "${module.fluapi_sg.server_id}"
}

output "gateway_id" {
  value = "${aws_internet_gateway.gw.id}"
}

output "internet_egress_sg_id" {
  value = "${aws_security_group.internet_egress.id}"
}

output "public_http_sg_id" {
  value = "${aws_security_group.public_http.id}"
}

output "reporting_client_sg_id" {
  value = "${module.reporting_sg.client_id}"
}

output "reporting_server_sg_id" {
  value = "${module.reporting_sg.server_id}"
}

output "route_table_id" {
  value = "${aws_route_table.rt.id}"
}

output "transient_subnet_id" {
  value = "${aws_subnet.transient.id}"
}

output "vpc_id" {
  value = "${aws_vpc.env_vpc.id}"
}
