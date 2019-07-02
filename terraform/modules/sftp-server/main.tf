// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  base_name = "${var.environment}-sftp"
  hostname = "sftp.${var.environment}.${var.auderenow_route53_zone_name}"
}

resource "aws_route53_record" "sftp_hostname" {
  zone_id = "${var.auderenow_route53_zone_id}"
  name = "${local.hostname}"
  type = "CNAME"
  ttl = "300"
  records = ["${aws_transfer_server.sftp_server.endpoint}"]
}

data "aws_iam_policy_document" "assume_transfer_service_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type = "Service"
      identifiers = ["transfer.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cloudwatch_logging_role" {
  name = "${local.base_name}-cloudwatch-logging"
  assume_role_policy = "${data.aws_iam_policy_document.assume_transfer_service_role_policy.json}"
}

data "aws_iam_policy_document" "cloudwatch_logging_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "cloudwatch_logging_role_policy" {
  name = "${local.base_name}-cloudwatch-logging-policy"
  role = "${aws_iam_role.cloudwatch_logging_role.id}"
  policy = "${data.aws_iam_policy_document.cloudwatch_logging_policy.json}"
}

resource "aws_transfer_server" "sftp_server" {
  identity_provider_type = "SERVICE_MANAGED"
  logging_role = "${aws_iam_role.cloudwatch_logging_role.arn}"
}

// The provider implementation of aws_transfer_server does not allow setting a
// custom hostname since it requires creation of an aws.* tag. We work around
// this limitation by running AWS CLI manually, see:
// https://github.com/terraform-providers/terraform-provider-aws/issues/6956
resource "null_resource" "associate_custom_hostname" {
  provisioner "local-exec" {
    command = <<EOF
aws transfer tag-resource \
  --arn '${aws_transfer_server.sftp_server.arn}' \
  --tags \
    'Key=aws:transfer:customHostname,Value=${aws_route53_record.sftp_hostname.name}' \
    'Key=aws:transfer:route53HostedZoneId,Value=/hostedzone/${aws_route53_record.sftp_hostname.zone_id}'
EOF
  }
  depends_on = ["aws_transfer_server.sftp_server", "aws_route53_record.sftp_hostname"]
}
