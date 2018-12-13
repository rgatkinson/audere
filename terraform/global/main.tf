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
// Initial Network Configs with flow logs

// TODO: This has to be imported for now. Add the configurations for future separate VPCs here
resource "aws_vpc" "default" {
  cidr_block           = "172.31.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_flow_log" "default_vpc_flow_log" {
  iam_role_arn    = "${aws_iam_role.vpc_flow_log_role.arn}"
  log_destination = "${aws_cloudwatch_log_group.vpc_flow_log.arn}"
  traffic_type    = "ALL"
  vpc_id          = "${aws_vpc.default.id}"
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
  name   = "AdministratorAccessPolicy"
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

resource "aws_iam_group_policy_attachment" "ec2_full_access" {
  group      = "${aws_iam_group.infrastructurers.name}"
  policy_arn = "${aws_iam_policy.ec2_full_access.arn}"
}

resource "aws_iam_group_policy_attachment" "route53_full_access" {
  group      = "${aws_iam_group.infrastructurers.name}"
  policy_arn = "${aws_iam_policy.route53_full_access.arn}"
}

resource "aws_iam_group_policy_attachment" "eks_full_access" {
  group      = "${aws_iam_group.infrastructurers.name}"
  policy_arn = "${aws_iam_policy.eks_full_access.arn}"
}

resource "aws_iam_group_policy_attachment" "ses_send_email" {
  group      = "${aws_iam_group.infrastructurers.name}"
  policy_arn = "${aws_iam_policy.ses_send_email.arn}"
}

// ec2_full_access (copied from AmazonEC2FullAccess managed policy)
resource "aws_iam_policy" "ec2_full_access" {
  name   = "EC2FullAccess"
  policy = "${data.aws_iam_policy_document.ec2_full_access.json}"
}

data "aws_iam_policy_document" "ec2_full_access" {
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
}

// route53_full_access (copied from AmazonRoute53FullAccess managed policy)
resource "aws_iam_policy" "route53_full_access" {
  name   = "Route53FullAccess"
  policy = "${data.aws_iam_policy_document.route53_full_access.json}"
}

data "aws_iam_policy_document" "route53_full_access" {
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
}

// eks_full_access
resource "aws_iam_policy" "eks_full_access" {
  name   = "EKSFullAccess"
  policy = "${data.aws_iam_policy_document.eks_full_access.json}"
}

data "aws_iam_policy_document" "eks_full_access" {
  statement {
    actions = [
      "eks:*",
      "iam:PassRole",
    ]

    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
  }
}

// ses_send_email
resource "aws_iam_policy" "ses_send_email" {
  name   = "SESSendEmail"
  policy = "${data.aws_iam_policy_document.ses_send_email.json}"
}

data "aws_iam_policy_document" "ses_send_email" {
  statement {
    actions = [
      "ses:SendEmail",
      "ses:VerifyEmailIdentity",
    ]

    resources = ["*"]

    condition = {
      test     = "${local.mfa_condition_test}"
      variable = "${local.mfa_condition_variable}"
      values   = ["${local.mfa_condition_value}"]
    }
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
  name   = "SecurityHubFullAccess"
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
  name   = "SecurityAudit"
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

// --------------------------------------------------------------------------------
// Group membership

resource "aws_iam_group_membership" "administrators" {
  name  = "Administrators"
  group = "${aws_iam_group.administrators.name}"

  users = [
    "mmarucheck",
    "philip",
  ]
}

resource "aws_iam_group_membership" "infrastructurers" {
  name  = "Infrastructurers"
  group = "${aws_iam_group.infrastructurers.name}"

  users = [
    "mmarucheck",
    "ram",
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
// Locals

locals {
  mfa_condition_test     = "NumericLessThan"
  mfa_condition_variable = "aws:MultiFactorAuthAge"
  mfa_condition_value    = "${6 * 60 * 60}"
}
