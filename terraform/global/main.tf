// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

provider "aws" {
  version = "~> 1.50"
  region  = "us-west-2"
}

// --------------------------------------------------------------------------------
// CloudTrail S3 events logging

resource "aws_cloudtrail" "cloudtrail-s3-events" {
  name                          = "cloudtrail-s3-events"
  s3_bucket_name                = "${aws_s3_bucket.audere-cloudtrail-s3-logs.id}"
  include_global_service_events = true
  enable_logging                = true
  enable_log_file_validation    = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]
    }
  }

  depends_on = ["aws_s3_bucket_policy.cloudtrail-s3"]
}

resource "aws_s3_bucket" "audere-cloudtrail-s3-logs" {
  bucket        = "audere-cloudtrail-s3-logs"
  force_destroy = true
}

data "aws_iam_policy_document" "allow-cloudtrail-s3" {
  statement {
    sid       = "AWSCloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl"]
    resources = ["arn:aws:s3:::audere-cloudtrail-s3-logs"]

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }

  statement {
    sid       = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::audere-cloudtrail-s3-logs/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail-s3" {
  bucket = "${aws_s3_bucket.audere-cloudtrail-s3-logs.id}"
  policy = "${data.aws_iam_policy_document.allow-cloudtrail-s3.json}"
}

// --------------------------------------------------------------------------------
// Database logs for RDS instances

resource "aws_s3_bucket" "database_log_archive" {
  bucket        = "audere-database-log-archive"
  force_destroy = true
}

resource "aws_s3_bucket_policy" "database_log_archive" {
  bucket = "${aws_s3_bucket.database_log_archive.id}"
  policy = "${data.aws_iam_policy_document.allow_lambda_database_log_archiver.json}"
}

data "aws_iam_policy_document" "allow_lambda_database_log_archiver" {
  statement {
    actions   = [
      "s3:ListBucket",
      "s3:GetBucketAcl",
    ]
    resources = [
      "${aws_s3_bucket.database_log_archive.arn}",
      "${aws_s3_bucket.database_log_archive.arn}/*",
    ]

    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }

  statement {
    actions = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.database_log_archive.arn}/*"]

    principals {
      type = "Service"
      identifiers = ["lambda.amazonaws.com"]
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

// --------------------------------------------------------------------------------
// Initial Network Configs with flow logs

resource "aws_default_vpc" "default" {
  tags = {
    Name = "Default VPC"
  }
}

resource "aws_flow_log" "default_vpc_flow_log" {
  iam_role_arn    = "${aws_iam_role.vpc_flow_log_role.arn}"
  log_destination = "${aws_cloudwatch_log_group.vpc_flow_log.arn}"
  traffic_type    = "ALL"
  vpc_id          = "${aws_default_vpc.default.id}"
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  name = "VPCFlowLogs"
}

data "aws_iam_policy_document" "vpc_flow_log_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["vpc-flow-logs.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "vpc_flow_log_role" {
  name = "VPCFlowLogRole"

  assume_role_policy = "${data.aws_iam_policy_document.vpc_flow_log_role_policy.json}"
}

data "aws_iam_policy_document" "logs_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
    ]

    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "logs_role_policy" {
  name = "LogsRolePolicy"
  role = "${aws_iam_role.vpc_flow_log_role.id}"

  policy = "${data.aws_iam_policy_document.logs_policy.json}"
}

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

// --------------------------------------------------------------------------------
// Policy Group: Administrators

resource "aws_iam_group" "administrators" {
  name = "AudereAdministrators"
}

resource "aws_iam_group_policy_attachment" "administrator_access" {
  group      = "${aws_iam_group.administrators.name}"
  policy_arn = "${aws_iam_policy.administrator_access.arn}"
}

// administrator access (copied from AdministratorAccess managed policy)
resource "aws_iam_policy" "administrator_access" {
  name   = "AudereAdministratorAccess"
  policy = "${data.aws_iam_policy_document.administrator_access.json}"
}

data "aws_iam_policy_document" "administrator_access" {
  statement {
    actions   = ["*"]
    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }
}

// --------------------------------------------------------------------------------
// Policy Group: Infrastructurers

resource "aws_iam_group" "infrastructurers" {
  name = "AudereInfrastructurers"
}

resource "aws_iam_group_policy_attachment" "infrastructurer_access" {
  group      = "${aws_iam_group.infrastructurers.name}"
  policy_arn = "${aws_iam_policy.infrastructurer_access.arn}"
}

resource "aws_iam_policy" "infrastructurer_access" {
  name   = "AudereInfrastructurerAccess"
  policy = "${data.aws_iam_policy_document.infrastructurer_access.json}"
}

data "aws_iam_policy_document" "infrastructurer_access" {
  // ec2_full_access (copied from AmazonEC2FullAccess managed policy)
  statement {
    actions = [
      "ec2:*",
      "elasticloadbalancing:*",
      "cloudwatch:*",
      "autoscaling:*",
    ]

    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  statement {
    actions = [
      "iam:CreateServiceLinkedRole",
    ]

    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "iam:AWSServiceName"

      values = [
        "autoscaling.amazonaws.com",
        "ec2scheduled.amazonaws.com",
        "elasticloadbalancing.amazonaws.com",
        "spot.amazonaws.com",
        "spotfleet.amazonaws.com",
        "transitgateway.amazonaws.com",
      ]
    }

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  statement {
    actions = [
      "acm:DescribeCertificate",
      "acm:ListCertificates",
      "iam:GetInstanceProfile",
    ]

    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  // route53_full_access (copied from AmazonRoute53FullAccess managed policy)
  statement {
    actions = [
      "route53:*",
      "route53domains:*",
      "cloudfront:ListDistributions",
      "elasticloadbalancing:DescribeLoadBalancers",
      "elasticbeanstalk:DescribeEnvironments",
      "s3:ListBucket",
      "s3:GetBucketLocation",
      "s3:GetBucketWebsite",
      "ec2:DescribeVpcs",
      "ec2:DescribeRegions",
      "sns:ListTopics",
      "sns:ListSubscriptionsByTopic",
      "cloudwatch:DescribeAlarms",
      "cloudwatch:GetMetricStatistics",
    ]

    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  // ses_manage
  statement {
    actions = [
      "ses:SendEmail",
      "ses:VerifyEmailIdentity",
      "ses:DeleteVerifiedEmailAddress",
      "ses:GetIdentityVerificationAttributes",
      "ses:VerifyDomainIdentity",
      "ses:ListIdentities",
      "ses:ListIdentityPolicies",
    ]

    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  // manage own mfa
  statement {
    sid = "AllowAllUsersToListAccounts"

    actions = [
      "iam:ListAccountAliases",
      "iam:ListUsers",
      "iam:ListVirtualMFADevices",
      "iam:GetAccountPasswordPolicy",
      "iam:GetAccountSummary",
    ]

    resources = ["*"]
  }

  statement {
    sid = "AllowIndividualUserToSeeAndManageOnlyTheirOwnAccountInformation"

    actions = [
      "iam:ChangePassword",
      "iam:CreateAccessKey",
      "iam:CreateLoginProfile",
      "iam:DeleteAccessKey",
      "iam:DeleteLoginProfile",
      "iam:GetLoginProfile",
      "iam:ListAccessKeys",
      "iam:UpdateAccessKey",
      "iam:UpdateLoginProfile",
      "iam:ListSigningCertificates",
      "iam:DeleteSigningCertificate",
      "iam:UpdateSigningCertificate",
      "iam:UploadSigningCertificate",
      "iam:ListSSHPublicKeys",
      "iam:GetSSHPublicKey",
      "iam:DeleteSSHPublicKey",
      "iam:UpdateSSHPublicKey",
      "iam:UploadSSHPublicKey",
    ]

    resources = [
      "arn:aws:iam::*:user/$${aws:username}",
    ]
  }

  statement {
    sid = "AllowIndividualUserToViewAndManageTheirOwnMFA"

    actions = [
      "iam:CreateVirtualMFADevice",
      "iam:DeleteVirtualMFADevice",
      "iam:EnableMFADevice",
      "iam:ListMFADevices",
      "iam:ResyncMFADevice",
    ]

    resources = [
      "arn:aws:iam::*:mfa/$${aws:username}",
      "arn:aws:iam::*:user/$${aws:username}",
    ]
  }

  statement {
    sid = "AllowIndividualUserToDeactivateOnlyTheirOwnMFAOnlyWhenUsingMFA"

    actions = [
      "iam:DeactivateMFADevice",
    ]

    resources = [
      "arn:aws:iam::*:mfa/$${aws:username}",
      "arn:aws:iam::*:user/$${aws:username}",
    ]

    condition = {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  // s3 full access
  statement {
    actions = ["s3:*"]
    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }

    condition = {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["true"]
    }
  }

  // rds
  statement {
    actions = [
      "rds:Describe*",
      "rds:DownloadDBLogFilePortion",
      "rds:ListTagsForResource",
    ]

    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  // flu iam
  statement {
    actions = [
      "iam:Get*",
      "iam:List*"
    ]

    resources = [
      "arn:aws:iam::*:group/flu*",
      "arn:aws:iam::*:policy/flu*",
      "arn:aws:iam::*:role/flu*",
    ]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  // cloudwatch
  statement {
    actions = [
      "application-autoscaling:DescribeScalingPolicies",
      "autoscaling:DescribeAutoScalingGroups",
      "autoscaling:DescribePolicies",
      "cloudtrail:DescribeTrails",
      "cloudwatch:DeleteAlarms",
      "cloudwatch:DescribeAlarmHistory",
      "cloudwatch:DescribeAlarms",
      "cloudwatch:GetMetricData",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:ListMetrics",
      "cloudwatch:PutMetricAlarm",
      "cloudwatch:PutMetricData",
      "ec2:DescribeInstances",
      "ec2:DescribeTags",
      "ec2:DescribeVolumes",
      "es:DescribeElasticsearchDomain",
      "es:ListDomainNames",
      "events:DeleteRule",
      "events:DescribeRule",
      "events:DisableRule",
      "events:EnableRule",
      "events:ListRules",
      "events:PutRule",
      "iam:AttachRolePolicy",
      "iam:CreateRole",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:GetRole",
      "iam:ListAttachedRolePolicies",
      "iam:ListRoles",
      "kinesis:DescribeStream",
      "kinesis:ListStreams",
      "lambda:AddPermission",
      "lambda:CreateFunction",
      "lambda:GetFunctionConfiguration",
      "lambda:ListAliases",
      "lambda:ListFunctions",
      "lambda:ListVersionsByFunction",
      "lambda:RemovePermission",
      "logs:CancelExportTask",
      "logs:CreateExportTask",
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DeleteLogGroup",
      "logs:DeleteLogStream",
      "logs:DeleteMetricFilter",
      "logs:DeleteRetentionPolicy",
      "logs:DeleteSubscriptionFilter",
      "logs:DescribeExportTasks",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:DescribeMetricFilters",
      "logs:DescribeSubscriptionFilters",
      "logs:FilterLogEvents",
      "logs:GetLogEvents",
      "logs:PutMetricFilter",
      "logs:PutRetentionPolicy",
      "logs:PutSubscriptionFilter",
      "logs:TestMetricFilter",
      "logs:ListTagsLogGroup",
      "s3:CreateBucket",
      "s3:ListBucket",
      "sns:CreateTopic",
      "sns:GetTopicAttributes",
      "sns:ListSubscriptions",
      "sns:ListTopics",
      "sns:SetTopicAttributes",
      "sns:Subscribe",
      "sns:Unsubscribe",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
      "sqs:ListQueues",
      "sqs:SetQueueAttributes",
      "swf:CreateAction",
      "swf:DescribeAction",
      "swf:ListActionTemplates",
      "swf:RegisterAction",
      "swf:RegisterDomain",
      "swf:UpdateAction"
    ]

    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  // flu lambda dev
  statement {
    not_actions = [
      "lambda:AddPermission",
      "lambda:PutFunctionConcurrency"
    ]

    resources = ["arn:aws:lambda:*:*:function:flu*"]
  }
}

// --------------------------------------------------------------------------------
// Policy Group: Securers

resource "aws_iam_group" "securers" {
  name = "AudereSecurers"
}

resource "aws_iam_group_policy_attachment" "security_hub_full_access" {
  group      = "${aws_iam_group.securers.name}"
  policy_arn = "${aws_iam_policy.security_hub_full_access.arn}"
}

resource "aws_iam_group_policy_attachment" "security_audit" {
  group      = "${aws_iam_group.securers.name}"
  policy_arn = "${aws_iam_policy.security_audit.arn}"
}

// security_hub_full_access
resource "aws_iam_policy" "security_hub_full_access" {
  name   = "AudereSecurityHubFullAccess"
  policy = "${data.aws_iam_policy_document.security_hub_full_access.json}"
}

data "aws_iam_policy_document" "security_hub_full_access" {
  statement {
    actions = [
      "securityhub:*",
    ]

    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  statement {
    actions = [
      "iam:CreateServiceLinkedRole",
    ]

    resources = ["*"]

    condition = {
      test     = "StringLike"
      variable = "iam:AWSServiceName"
      values   = ["securityhub.amazonaws.com"]
    }

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }
}

// security_audit (copied from SecurityAudit managed policy)
resource "aws_iam_policy" "security_audit" {
  name   = "AudereSecurityAudit"
  policy = "${data.aws_iam_policy_document.security_audit.json}"
}

data "aws_iam_policy_document" "security_audit" {
  statement {
    actions = [
      "acm:DescribeCertificate",
      "acm:ListCertificates",
      "application-autoscaling:Describe*",
      "athena:List*",
      "autoscaling:Describe*",
      "batch:DescribeComputeEnvironments",
      "batch:DescribeJobDefinitions",
      "cloud9:Describe*",
      "cloud9:ListEnvironments",
      "clouddirectory:ListDirectories",
      "cloudformation:DescribeStack*",
      "cloudformation:GetTemplate",
      "cloudformation:ListStack*",
      "cloudformation:GetStackPolicy",
      "cloudfront:Get*",
      "cloudfront:List*",
      "cloudhsm:ListHapgs",
      "cloudhsm:ListHsms",
      "cloudhsm:ListLunaClients",
      "cloudsearch:DescribeDomains",
      "cloudsearch:DescribeServiceAccessPolicies",
      "cloudtrail:DescribeTrails",
      "cloudtrail:GetEventSelectors",
      "cloudtrail:GetTrailStatus",
      "cloudtrail:ListTags",
      "cloudtrail:LookupEvents",
      "cloudwatch:Describe*",
      "codebuild:ListProjects",
      "codecommit:BatchGetRepositories",
      "codecommit:GetBranch",
      "codecommit:GetObjectIdentifier",
      "codecommit:GetRepository",
      "codecommit:List*",
      "codedeploy:Batch*",
      "codedeploy:Get*",
      "codedeploy:List*",
      "codepipeline:ListPipelines",
      "codestar:Describe*",
      "codestar:List*",
      "cognito-identity:ListIdentityPools",
      "cognito-idp:ListUserPools",
      "cognito-sync:Describe*",
      "cognito-sync:List*",
      "config:Deliver*",
      "config:Describe*",
      "config:Get*",
      "datapipeline:DescribeObjects",
      "datapipeline:DescribePipelines",
      "datapipeline:EvaluateExpression",
      "datapipeline:GetPipelineDefinition",
      "datapipeline:ListPipelines",
      "datapipeline:QueryObjects",
      "datapipeline:ValidatePipelineDefinition",
      "dax:Describe*",
      "dax:ListTags",
      "directconnect:Describe*",
      "dms:Describe*",
      "dms:ListTagsForResource",
      "ds:DescribeDirectories",
      "dynamodb:DescribeContinuousBackups",
      "dynamodb:DescribeGlobalTable",
      "dynamodb:DescribeTable",
      "dynamodb:DescribeTimeToLive",
      "dynamodb:ListBackups",
      "dynamodb:ListGlobalTables",
      "dynamodb:ListStreams",
      "dynamodb:ListTables",
      "ec2:Describe*",
      "ecr:DescribeRepositories",
      "ecr:GetRepositoryPolicy",
      "ecs:Describe*",
      "ecs:List*",
      "eks:DescribeCluster",
      "eks:ListClusters",
      "elasticache:Describe*",
      "elasticbeanstalk:Describe*",
      "elasticfilesystem:DescribeFileSystems",
      "elasticloadbalancing:Describe*",
      "elasticmapreduce:Describe*",
      "elasticmapreduce:ListClusters",
      "elasticmapreduce:ListInstances",
      "es:Describe*",
      "es:ListDomainNames",
      "events:DescribeEventBus",
      "events:ListRules",
      "firehose:Describe*",
      "firehose:List*",
      "gamelift:ListBuilds",
      "gamelift:ListFleets",
      "glacier:DescribeVault",
      "glacier:GetVaultAccessPolicy",
      "glacier:ListVaults",
      "guardduty:Get*",
      "guardduty:List*",
      "iam:GenerateCredentialReport",
      "iam:Get*",
      "iam:GetAccountAuthorizationDetails",
      "iam:GetContextKeysForCustomPolicy",
      "iam:GetContextKeysForPrincipalPolicy",
      "iam:List*",
      "iam:SimulateCustomPolicy",
      "iam:SimulatePrincipalPolicy",
      "iot:DescribeEndpoint",
      "iot:ListThings",
      "kinesis:DescribeStream",
      "kinesis:ListStreams",
      "kinesis:ListTagsForStream",
      "kinesisanalytics:ListApplications",
      "kms:Describe*",
      "kms:Get*",
      "kms:List*",
      "lambda:GetAccountSettings",
      "lambda:GetPolicy",
      "lambda:ListFunctions",
      "logs:Describe*",
      "logs:ListTagsLogGroup",
      "machinelearning:DescribeMLModels",
      "mediastore:GetContainerPolicy",
      "mediastore:ListContainers",
      "opsworks-cm:DescribeServers",
      "organizations:List*",
      "organizations:Describe*",
      "rds:Describe*",
      "rds:DownloadDBLogFilePortion",
      "rds:ListTagsForResource",
      "redshift:Describe*",
      "rekognition:Describe*",
      "rekognition:List*",
      "route53:Get*",
      "route53:List*",
      "route53domains:GetDomainDetail",
      "route53domains:GetOperationDetail",
      "route53domains:ListDomains",
      "route53domains:ListOperations",
      "route53domains:ListTagsForDomain",
      "s3:GetAccelerateConfiguration",
      "s3:GetAnalyticsConfiguration",
      "s3:GetBucket*",
      "s3:GetEncryptionConfiguration",
      "s3:GetInventoryConfiguration",
      "s3:GetLifecycleConfiguration",
      "s3:GetMetricsConfiguration",
      "s3:GetObjectAcl",
      "s3:GetObjectVersionAcl",
      "s3:GetReplicationConfiguration",
      "s3:ListAllMyBuckets",
      "sagemaker:Describe*",
      "sagemaker:List*",
      "sdb:DomainMetadata",
      "sdb:ListDomains",
      "serverlessrepo:GetApplicationPolicy",
      "serverlessrepo:ListApplications",
      "ses:GetIdentityDkimAttributes",
      "ses:GetIdentityVerificationAttributes",
      "ses:ListIdentities",
      "ses:ListVerifiedEmailAddresses",
      "shield:Describe*",
      "shield:List*",
      "snowball:ListClusters",
      "snowball:ListJobs",
      "sns:GetTopicAttributes",
      "sns:ListSubscriptionsByTopic",
      "sns:ListTopics",
      "sqs:GetQueueAttributes",
      "sqs:ListQueues",
      "ssm:Describe*",
      "ssm:ListDocuments",
      "states:ListStateMachines",
      "storagegateway:DescribeBandwidthRateLimit",
      "storagegateway:DescribeCache",
      "storagegateway:DescribeCachediSCSIVolumes",
      "storagegateway:DescribeGatewayInformation",
      "storagegateway:DescribeMaintenanceStartTime",
      "storagegateway:DescribeNFSFileShares",
      "storagegateway:DescribeSnapshotSchedule",
      "storagegateway:DescribeStorediSCSIVolumes",
      "storagegateway:DescribeTapeArchives",
      "storagegateway:DescribeTapeRecoveryPoints",
      "storagegateway:DescribeTapes",
      "storagegateway:DescribeUploadBuffer",
      "storagegateway:DescribeVTLDevices",
      "storagegateway:DescribeWorkingStorage",
      "storagegateway:List*",
      "tag:GetResources",
      "tag:GetTagKeys",
      "trustedadvisor:Describe*",
      "waf:ListWebACLs",
      "waf-regional:ListWebACLs",
      "workspaces:Describe*",
    ]

    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }

  statement {
    actions = [
      "apigateway:HEAD",
      "apigateway:GET",
      "apigateway:OPTIONS",
    ]

    resources = [
      "arn:aws:apigateway:*::/restapis",
      "arn:aws:apigateway:*::/restapis/*/authorizers",
      "arn:aws:apigateway:*::/restapis/*/authorizers/*",
      "arn:aws:apigateway:*::/restapis/*/resources",
      "arn:aws:apigateway:*::/restapis/*/resources/*",
      "arn:aws:apigateway:*::/restapis/*/resources/*/methods/*",
      "arn:aws:apigateway:*::/vpclinks",
    ]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }
}

// --------------------------------------------------------------------------------
// Users with managed AWS privileges

data "aws_iam_user" "billy" {
  user_name = "billy"
}

data "aws_iam_user" "mmarucheck" {
  user_name = "mmarucheck"
}

data "aws_iam_user" "mpomarole" {
  user_name = "mpomarole"
}

data "aws_iam_user" "philip" {
  user_name = "philip"
}

data "aws_iam_user" "ram" {
  user_name = "ram"
}

data "aws_iam_user" "sam" {
  user_name = "sam"
}

data "aws_iam_user" "terri" {
  user_name = "terri"
}

// --------------------------------------------------------------------------------
// Group membership

resource "aws_iam_group_membership" "administrators" {
  name  = "Administrators"
  group = "${aws_iam_group.administrators.name}"

  users = [
    "billy",
    "mmarucheck",
    "philip",
    "ram",
  ]
}

resource "aws_iam_group_membership" "infrastructurers" {
  name  = "Infrastructurers"
  group = "${aws_iam_group.infrastructurers.name}"

  users = [
    "billy",
    "mmarucheck",
    "ram",
    "mpomarole",
    "sam",
    "terri",
  ]
}

resource "aws_iam_group_membership" "securers" {
  name  = "Securers"
  group = "${aws_iam_group.securers.name}"

  users = [
    "mpomarole",
  ]
}

// --------------------------------------------------------------------------------
// To set an encrypted parameter in SSM:
//
// 1) Put the parameter value in a file (e.g. slack-hook-url.txt)
// 2) Generate encrypted blob via `aws`:
//      aws kms encrypt --key-id alias/ssm-parameters --plaintext fileb://./slack-hook-url.txt --output text --query CiphertextBlob
// 3) Add the value as a parameter in AWS Systems Manager
//      E.g. at https://us-west-2.console.aws.amazon.com/systems-manager/parameters?region=us-west-2
//      create parameter `slack-hook-url` with the value from step 2.
//
// Well-known parameters (these should be added after applying global and before
// applying anything else):
// * slack-hook-url: create a Slack app and generate an incoming webhook url
//
// This supports round-tripping the encrypted data to code that expects to decrypt an environment variable.
// For code that supports SecureString directly, you can just create a SecureString in SSM.

resource "aws_kms_key" "ssm_parameters" {
  description = "Key for encrypting secrets stored as SSM parameters."
}

resource "aws_kms_alias" "ssm_parameters" {
  name = "alias/ssm-parameters"
  target_key_id = "${aws_kms_key.ssm_parameters.key_id}"
}

// --------------------------------------------------------------------------------
// Locals

locals {
  mfa_condition_test     = "NumericLessThan"
  mfa_condition_variable = "aws:MultiFactorAuthAge"
  mfa_condition_value    = "${12 * 60 * 60}"
}
