// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "environment" {
  description = "One of 'staging' or 'prod'"
  type = "string"
}

// For policy to grant the notifier Lambda access to this key.
variable "ssm_parameters_key_arn" {
  description = "ARN of key needed to decrypt SSM parameters"
}
