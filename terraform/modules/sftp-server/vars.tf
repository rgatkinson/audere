// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

variable "auderenow_route53_zone_id" {
  description = "Identifier for the Route53 hosted zone"
}

variable "auderenow_route53_zone_name" {
  description = "Name for the Route53 hosted zone"
}

variable "environment" {
  description = "One of 'staging' or 'prod'"
}
