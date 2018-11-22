// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

data "aws_ami" "ubuntu" {
  most_recent = true

  // https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/finding-an-ami.html

  owners = ["099720109477"]

  filter {
    name = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-*"]
  }

  filter {
    name = "state"
    values = ["available"]
  }

  filter {
    name = "virtualization-type"
    values = ["hvm"]
  }
}
