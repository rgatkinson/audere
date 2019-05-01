// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

// For errors observed by classic load balanders.
resource "aws_cloudwatch_metric_alarm" "elb_api_server_error" {
  alarm_name = "${local.base_name}-internal-server-errors-classic"
  alarm_description = "5XX server error for ELBs"

  alarm_actions = [
    "${var.infra_alerts_sns_topic_arn}"
  ]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods = "1"
  insufficient_data_actions = []
  metric_name = "HTTPCode_Backend_5XX"
  namespace = "AWS/ELB"
  period = "60"
  statistic = "Sum"
  threshold = "1"
  treat_missing_data = "notBreaching"
}

// For errors observed by application load balancers.
resource "aws_cloudwatch_metric_alarm" "lb_api_server_error" {
  alarm_name = "${local.base_name}-internal-server-errors"
  alarm_description = "5XX server error for Application LBs"

  alarm_actions = [
    "${var.infra_alerts_sns_topic_arn}"
  ]
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods = "1"
  insufficient_data_actions = []
  metric_name = "HTTPCode_Target_5XX_Count"
  namespace = "AWS/ApplicationELB"
  period = "60"
  statistic = "Sum"
  threshold = "1"
  treat_missing_data = "notBreaching"
}
