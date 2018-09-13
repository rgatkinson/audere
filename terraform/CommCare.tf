provider "aws" {
  region = "us-west-2"
}

resource "aws_instance" "commcare" {
  ami           = "ami-51537029"
  instance_type = "t2.medium"

  key_name = "2018-mmarucheck"

  security_groups = [
    "default",
    "ssh",
    "http",
  ]

  root_block_device {
    volume_size = 16
  }

  volume_tags {
    Name = "commcare"
  }

  tags {
    Name = "commcare"
  }
}

resource "aws_eip_association" "commcare_eip_assoc" {
  instance_id   = "${aws_instance.commcare.id}"
  allocation_id = "eipalloc-0857299a94393d5bb"
}
