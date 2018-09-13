provider "aws" {
    region = "us-west-2"
}

resource "aws_instance" "commcare" {
     ami = "ami-51537029"
     instance_type = "t2.medium"
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
