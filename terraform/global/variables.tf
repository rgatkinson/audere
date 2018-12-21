// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "bastion_cidr_blocks" {
  description = "CIDR blocks for source IPs allowed to connect to bastion server"
  type = "list"
}

variable "home_size_gb" {
  default = 50
}

variable "availability_zone" {
  default = "us-west-2a"
}

variable "instance_type" {
  default = "t3.small"
}

// variable for AWS Config rule
variable "config_max_execution_frequency" {
  description = "The maximum frequency with which AWS Config runs evaluations for a rule."
  default     = "TwentyFour_Hours"
  type        = "string"
}

variable "config_delivery_frequency" {
  description = "The frequency with which AWS Config delivers configuration snapshots."
  default     = "Six_Hours"
  type        = "string"
}

/// iam-password-policy
variable "password_require_uppercase" {
  description = "Require at least one uppercase character in password."
  default     = true
}

variable "password_require_lowercase" {
  description = "Require at least one lowercase character in password."
  default     = true
}

variable "password_require_symbols" {
  description = "Require at least one symbol in password."
  default     = false
}

variable "password_require_numbers" {
  description = "Require at least one number in password."
  default     = true
}

variable "password_min_length" {
  description = "Password minimum length."
  default     = 16
}

variable "password_reuse_prevention" {
  description = "Number of passwords before allowing reuse."
  default     = 24
}

variable "password_max_age" {
  description = "Number of days before password expiration."
  default     = 90
}

/// acm-certificate-expiration
variable "acm_days_to_expiration" {
  description = "Specify the number of days before the rule flags the ACM Certificate as noncompliant."
  default     = 14
}
