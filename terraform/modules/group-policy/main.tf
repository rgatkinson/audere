// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

locals {
  mfa_condition_test     = "NumericLessThan"
  mfa_condition_variable = "aws:MultiFactorAuthAge"
  mfa_condition_value    = "${12 * 60 * 60}"
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
// Policy Group: Commiters

resource "aws_iam_group" "committers" {
  name = "AudereCommitters"
}

resource "aws_iam_group_policy_attachment" "committer_access" {
  group = "${aws_iam_group.committers.name}"
  policy_arn = "arn:aws:iam::aws:policy/AWSCodeCommitPowerUser"
}

// --------------------------------------------------------------------------------
// Policy Group: DataScientists

resource "aws_iam_group" "datascientists" {
  name = "AudereDataScientists"
}

resource "aws_iam_group_policy_attachment" "datascientist_job" {
  group      = "${aws_iam_group.datascientists.name}"
  policy_arn = "arn:aws:iam::aws:policy/job-function/DataScientist"
}

resource "aws_iam_group_policy_attachment" "datascientist_groundtruth" {
  group      = "${aws_iam_group.datascientists.name}"
  policy_arn = "${aws_iam_policy.datascientist_groundtruth.arn}"
}

resource "aws_iam_policy" "datascientist_groundtruth" {
  name = "AudereDataScientistGroundTruth"
  policy = "${data.aws_iam_policy_document.datascientist_groundtruth.json}"
}

// https://docs.aws.amazon.com/sagemaker/latest/dg/sms-getting-started-step1.html
data "aws_iam_policy_document" "datascientist_groundtruth" {
  statement {
    actions = [
      "cognito-idp:CreateGroup",
      "cognito-idp:CreateUserPool",
      "cognito-idp:CreateUserPoolDomain",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:CreateUserPoolClient",
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:DescribeUserPoolClient",
      "cognito-idp:DescribeUserPool",
      "cognito-idp:UpdateUserPool"
    ],
    resources = ["*"]
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

data "aws_iam_user" "jenny" {
  user_name = "jenny"

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
    "sam",
    "shawna"
  ]
}

resource "aws_iam_group_membership" "committers" {
  name = "Committers"
  group = "${aws_iam_group.committers.name}"

  users = [
    "billy",
    "jenny",
    "mmarucheck",
    "philip",
    "ram",
    "sam",
    "terri",
  ]
}

resource "aws_iam_group_membership" "datascientists" {
  name  = "DataScientists"
  group = "${aws_iam_group.datascientists.name}"

  users = [
    "jenny",
    "mmarucheck",
    "sam",
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
