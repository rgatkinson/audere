// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

resource "aws_instance" "dev_machine" {
  key_name = "2018-mmarucheck" # TODO remove
  availability_zone = "${var.availability_zone}"

  ami = "${var.ami_id}"
  instance_type = "${var.instance_type}"

  user_data = "${data.template_file.provision_sh.rendered}"

  root_block_device {
    volume_type = "gp2"
    volume_size = 12
  }

  vpc_security_group_ids = [
    "${data.aws_security_group.default.id}",
    "${data.aws_security_group.ssh.id}",
  ]

  tags {
    Name = "${var.userid}-dev"
  }

  volume_tags {
    Name = "${var.userid}-dev-root"
  }
}

resource "aws_ebs_volume" "dev_machine_home" {
  availability_zone = "${var.availability_zone}"

  type = "gp2"
  encrypted = true
  size = "${var.home_size_gb}"

  tags {
    Name = "${var.userid}-dev-home"
  }
}

resource "aws_volume_attachment" "dev_machine_home" {
  device_name = "/dev/sd${var.home_volume_letter}"
  instance_id = "${aws_instance.dev_machine.id}"
  volume_id = "${aws_ebs_volume.dev_machine_home.id}"
}

data "template_file" "provision_sh" {
  template = "${file("${path.module}/provision.sh")}"
  vars {
    home_volume_letter = "${var.home_volume_letter}"
    ssh_public_key = "${var.ssh_public_key}"
    userid = "${var.userid}"
  }
}

data "aws_security_group" "ssh" { name = "ssh" }

data "aws_security_group" "default" { name = "default" }
