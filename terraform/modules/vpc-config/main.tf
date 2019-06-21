// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// --------------------------------------------------------------------------------
// AWS Config rules

// Compute
resource "aws_config_config_rule" "restricted-ssh" {
  name        = "restricted-ssh"
  description = "Checks whether security groups that are in use disallow unrestricted incoming SSH traffic."

  source {
    owner             = "AWS"
    source_identifier = "INCOMING_SSH_DISABLED"
  }

  depends_on = ["aws_config_configuration_recorder.main"]
}

resource "aws_config_config_rule" "ec2-volume-inuse-check" {
  name        = "ec2-volume-inuse-check"
  description = "Checks whether EBS volumes are attached to EC2 instances"

  source {
    owner             = "AWS"
    source_identifier = "EC2_VOLUME_INUSE_CHECK"
  }

  depends_on = ["aws_config_configuration_recorder.main"]
}

resource "aws_config_config_rule" "instances-in-vpc" {
  name        = "instances-in-vpc"
  description = "Ensure all EC2 instances run in a VPC"

  source {
    owner             = "AWS"
    source_identifier = "INSTANCES_IN_VPC"
  }

  depends_on = [
    "aws_config_configuration_recorder.main",
    "aws_config_delivery_channel.main",
  ]
}

resource "aws_config_config_rule" "eip-attached" {
  name        = "eip-attached"
  description = "Checks whether all Elastic IP addresses that are allocated to a VPC are attached to EC2 instances or in-use elastic network interfaces (ENIs)."

  source {
    owner             = "AWS"
    source_identifier = "EIP_ATTACHED"
  }

  depends_on = [
    "aws_config_configuration_recorder.main",
  ]
}

resource "aws_config_config_rule" "vpc-default-security-group-closed" {
  name        = "vpc-default-security-group-closed"
  description = "Checks that the default security group of any Amazon Virtual Private Cloud (VPC) does not allow inbound or outbound traffic. The rule is non-compliant if the default security group has one or more inbound or outbound traffic."

  source {
    owner             = "AWS"
    source_identifier = "VPC_DEFAULT_SECURITY_GROUP_CLOSED"
  }

  depends_on = [
    "aws_config_configuration_recorder.main",
  ]
}

resource "aws_config_config_rule" "vpc-flow-logs-enabled" {
  name        = "vpc-flow-logs-enabled"
  description = "Checks whether Amazon Virtual Private Cloud flow logs are found and enabled for Amazon VPC."

  source {
    owner             = "AWS"
    source_identifier = "VPC_FLOW_LOGS_ENABLED"
  }

  depends_on = [
    "aws_config_configuration_recorder.main",
  ]
}

resource "aws_config_config_rule" "encrypted-volumes" {
  name        = "encrypted-volumes"
  description = "Checks whether EBS volumes that are in an attached state are encrypted. Optionally, you can specify the ID of a KMS key to use to encrypt the volume."

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [
    "aws_config_configuration_recorder.main",
  ]
}

resource "aws_config_config_rule" "rds-storage-encrypted" {
  name        = "rds-storage-encrypted"
  description = "Checks whether storage encryption is enabled for your RDS DB instances."

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [
    "aws_config_configuration_recorder.main",
  ]
}

resource "aws_config_config_rule" "s3-bucket-public-read-prohibited" {
  name        = "s3-bucket-public-read-prohibited"
  description = "Checks that your S3 buckets do not allow public read access. If an S3 bucket policy or bucket ACL allows public read access, the bucket is noncompliant."

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [
    "aws_config_configuration_recorder.main",
  ]
}

// Manage Tools
resource "aws_config_config_rule" "cloudtrail-enabled" {
  name        = "cloudtrail-enabled"
  description = "Ensure CloudTrail is enabled"

  source {
    owner             = "AWS"
    source_identifier = "CLOUD_TRAIL_ENABLED"
  }

  maximum_execution_frequency = "${var.config_max_execution_frequency}"

  depends_on = [
    "aws_config_configuration_recorder.main",
    "aws_config_delivery_channel.main",
  ]
}

// Security, Identity & Compliance
resource "aws_config_config_rule" "iam-user-no-policies-check" {
  name        = "iam-user-no-policies-check"
  description = "Ensure that none of your IAM users have policies attached. IAM users must inherit permissions from IAM groups or roles."

  source {
    owner             = "AWS"
    source_identifier = "IAM_USER_NO_POLICIES_CHECK"
  }

  depends_on = ["aws_config_configuration_recorder.main"]
}

data "template_file" "aws_config_iam_password_policy" {
  template = "${file("${path.module}/config-policies/iam-password-policy.tpl")}"

  vars = {
    // terraform will interpolate boolean as 0/1 and the config parameters expect "true" or "false"
    password_require_uppercase = "${var.password_require_uppercase ? "true" : "false"}"
    password_require_lowercase = "${var.password_require_lowercase ? "true" : "false"}"
    password_require_symbols   = "${var.password_require_symbols ? "true" : "false"}"
    password_require_numbers   = "${var.password_require_numbers ? "true" : "false"}"
    password_min_length        = "${var.password_min_length}"
    password_reuse_prevention  = "${var.password_reuse_prevention}"
    password_max_age           = "${var.password_max_age}"
  }
}

resource "aws_config_config_rule" "iam-password-policy" {
  name             = "iam-password-policy"
  description      = "Ensure the account password policy for IAM users meets the specified requirements"
  input_parameters = "${data.template_file.aws_config_iam_password_policy.rendered}"

  source {
    owner             = "AWS"
    source_identifier = "IAM_PASSWORD_POLICY"
  }

  maximum_execution_frequency = "${var.config_max_execution_frequency}"

  depends_on = [
    "aws_config_configuration_recorder.main",
    "aws_config_delivery_channel.main",
  ]
}

data "template_file" "aws_config_acm_certificate_expiration" {
  template = "${file("${path.module}/config-policies/acm-certificate-expiration.tpl")}"

  vars = {
    acm_days_to_expiration = "${var.acm_days_to_expiration}"
  }
}

resource "aws_config_config_rule" "acm-certificate-expiration-check" {
  name             = "acm-certificate-expiration-check"
  description      = "Ensures ACM Certificates in your account are marked for expiration within the specified number of days"
  input_parameters = "${data.template_file.aws_config_acm_certificate_expiration.rendered}"

  source {
    owner             = "AWS"
    source_identifier = "ACM_CERTIFICATE_EXPIRATION_CHECK"
  }

  maximum_execution_frequency = "${var.config_max_execution_frequency}"

  depends_on = ["aws_config_configuration_recorder.main"]
}

resource "aws_config_config_rule" "root-account-mfa-enabled" {
  name        = "root-account-mfa-enabled"
  description = "Ensure root AWS account has MFA enabled"

  source {
    owner             = "AWS"
    source_identifier = "ROOT_ACCOUNT_MFA_ENABLED"
  }

  maximum_execution_frequency = "${var.config_max_execution_frequency}"

  depends_on = [
    "aws_config_configuration_recorder.main",
    "aws_config_delivery_channel.main",
  ]
}

// Config Service
resource "aws_config_configuration_recorder_status" "main" {
  name       = "aws-config"
  is_enabled = true
  depends_on = ["aws_config_delivery_channel.main"]
}

resource "aws_s3_bucket" "config_logs_bucket" {
  bucket        = "audere-aws-config-logs"
  acl           = "private"
  force_destroy = true

  versioning {
    enabled = true
  }
}

data "aws_iam_policy_document" "aws_config_s3_policy" {
  statement {
    sid       = "AWSConfigBucketPermissionsCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = ["arn:aws:s3:::audere-aws-config-logs"]

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
  }

  statement {
    sid       = "AWSConfigBucketDelivery"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::audere-aws-config-logs/audere/AWSLogs/475613123583/Config/*"]

    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"

      values = [
        "bucket-owner-full-control",
      ]
    }
  }
}

resource "aws_s3_bucket_policy" "config_logs" {
  bucket = "${aws_s3_bucket.config_logs_bucket.id}"

  policy = "${data.aws_iam_policy_document.aws_config_s3_policy.json}"
}

resource "aws_config_delivery_channel" "main" {
  name           = "aws-config"
  s3_bucket_name = "${aws_s3_bucket.config_logs_bucket.bucket}"
  s3_key_prefix  = "audere"

  snapshot_delivery_properties = {
    delivery_frequency = "${var.config_delivery_frequency}"
  }

  depends_on = ["aws_config_configuration_recorder.main"]
}

resource "aws_config_configuration_recorder" "main" {
  name     = "aws-config"
  role_arn = "${aws_iam_service_linked_role.aws_config.arn}"

  recording_group = {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_iam_service_linked_role" "aws_config" {
  aws_service_name = "config.amazonaws.com"
}
