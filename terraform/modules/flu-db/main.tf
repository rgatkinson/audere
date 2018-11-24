// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  is_provision_0 = "${(var.epoch == 0 && (var.provision == "run")) ? 1 : 0}"
  is_done_provisioning = "${(var.provision == "done") ? 1 : 0}"
  db_setup_password = "${file("${var.db_setup_password_filename}")}"
  github_tar_bz2_base64 = "${file("${var.github_tar_bz2_base64_filename}")}"
  random_seed_base64 = "${base64encode(file("${var.random_seed_filename}"))}"
  vpc_dhparam_base64 = "${base64encode(file("${var.vpc_dhparam_filename}"))}"
}

data "aws_security_group" "ssh" { name = "ssh" }

data "aws_security_group" "default" { name = "default" }

resource "aws_db_instance" "fludb" {
  identifier = "flu-db"
  engine = "postgres"
  engine_version = "10.5"
  availability_zone = "${var.availability_zone}"
  instance_class = "db.t2.small"
  allocated_storage = 20
  license_model = "postgresql-license"
  username = "flusetup"
  password = "${local.db_setup_password}"
  backup_retention_period = 35
  backup_window = "10:00-10:59"
  publicly_accessible = false
  maintenance_window = "Sun:11:00-Sun:11:59"
  storage_encrypted = true
  copy_tags_to_snapshot = true
  parameter_group_name = "${aws_db_parameter_group.fludb_parameters.name}"
  tags {
    Name = "flu-db"
  }

  skip_final_snapshot = true // TODO
  deletion_protection = false // TODO

  # TODO
  # enabled_cloudwatch_logs_exports = [
  #   "alert",
  #   "audit",
  #   "error",
  #   "general",
  #   "listener",
  #   "slowquery",
  # ]
  # monitoring_role_arn = "${aws_iam_role.flu_rds_monitoring.arn}"
  # monitoring_interval = "30"
}

resource "aws_db_parameter_group" "fludb_parameters" {
  name = "fludb-parameters"
  family = "postgres10"

  parameter {
    name = "pgaudit.role"
    value = "rds_pgaudit"
    apply_method = "pending-reboot"
  }

  parameter {
    name = "pgaudit.log"
    value = "all"
    apply_method = "pending-reboot"
  }

  parameter {
    name = "pgaudit.log_relation"
    value = "on"
    apply_method = "pending-reboot"
  }

  parameter {
    name = "shared_preload_libraries"
    value = "pgaudit"
    apply_method = "pending-reboot"
  }
}

resource "aws_instance" "flu_provision_0" {
  count = "${local.is_provision_0}"
  ami = "${var.ami_id}"
  instance_type = "t2.micro"
  availability_zone = "${var.availability_zone}"
  vpc_security_group_ids = [
    "${data.aws_security_group.default.id}",
  ]
  user_data = "${data.template_file.provision_0_sh.rendered}"
  key_name = "2018-mmarucheck" // TODO remove
  tags { Name = "provision0" }
}
data "template_file" "provision_0_sh" {
  template = "${file("${path.module}/provision-0.sh")}"
  vars {
    db_host = "${aws_db_instance.fludb.address}"
    db_setup_user = "flusetup"
    db_setup_password = "${local.db_setup_password}"
    github_tar_bz2_base64 = "${local.github_tar_bz2_base64}"
    random_seed = "${local.random_seed_base64}"
    vpc_dhparam_base64 = "${local.vpc_dhparam_base64}"
  }
}

resource "aws_volume_attachment" "provision_api_prod" {
  count = "${local.is_provision_0}"
  device_name = "/dev/sdf"
  volume_id = "${aws_ebs_volume.api_prod.id}"
  instance_id = "${aws_instance.flu_provision_0.id}"
}
resource "aws_volume_attachment" "provision_api_staging" {
  count = "${local.is_provision_0}"
  device_name = "/dev/sdg"
  volume_id = "${aws_ebs_volume.api_staging.id}"
  instance_id = "${aws_instance.flu_provision_0.id}"
}
resource "aws_volume_attachment" "provision_ram_creds" {
  count = "${local.is_provision_0}"
  device_name = "/dev/sdn"
  volume_id = "${aws_ebs_volume.ram_creds.id}"
  instance_id = "${aws_instance.flu_provision_0.id}"
}
resource "aws_volume_attachment" "provision_mmarucheck_creds" {
  count = "${local.is_provision_0}"
  device_name = "/dev/sdo"
  volume_id = "${aws_ebs_volume.mmarucheck_creds.id}"
  instance_id = "${aws_instance.flu_provision_0.id}"
}
resource "aws_volume_attachment" "provision_db_setup_creds" {
  count = "${local.is_provision_0}"
  device_name = "/dev/sdp"
  volume_id = "${aws_ebs_volume.db_setup_creds.id}"
  instance_id = "${aws_instance.flu_provision_0.id}"
}

resource "aws_ebs_volume" "api_prod" {
  availability_zone = "${var.availability_zone}"
  type = "gp2"
  encrypted = true
  size = 1
  tags { Name = "flu-api-prod" }
}
resource "aws_ebs_snapshot" "api_prod" {
  count = "${local.is_done_provisioning}"
  volume_id = "${aws_ebs_volume.api_prod.id}"
  tags { Name = "flu-api-prod" }
}

resource "aws_ebs_volume" "api_staging" {
  availability_zone = "${var.availability_zone}"
  type = "gp2"
  encrypted = true
  size = 1
  tags { Name = "flu-api-staging" }
}
resource "aws_ebs_snapshot" "api_staging" {
  count = "${local.is_done_provisioning}"
  volume_id = "${aws_ebs_volume.api_staging.id}"
  tags { Name = "flu-api-staging" }
}

resource "aws_ebs_volume" "ram_creds" {
  availability_zone = "${var.availability_zone}"
  type = "gp2"
  encrypted = true
  size = 1
  tags { Name = "flu-ram-creds" }
}

resource "aws_ebs_volume" "mmarucheck_creds" {
  availability_zone = "${var.availability_zone}"
  type = "gp2"
  encrypted = true
  size = 1
  tags { Name = "flu-mmarucheck-creds" }
}

resource "aws_ebs_volume" "db_setup_creds" {
  availability_zone = "${var.availability_zone}"
  type = "gp2"
  encrypted = true
  size = 1
  tags { Name = "flu-db-setup-credentials" }
}