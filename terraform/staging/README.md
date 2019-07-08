# Staging environment configuration and setup

Staging environment configuration consists of a sequence of top level modules which must be run in sequence due to explicit or implicit resource dependencies.

1. network - Sets up VPC subnets and ingress/egress policies to control network traffic.
2. developers - Provisions developer machines which provide developers network access to the environment.
3. notifier - Creates a topic for alarms and high priority notifications.
4. db - Creates environment databases.
5. app - Sets up application resources & infrastructure and deploys application code.
6. lambda - Creates Lambdas which are used to respond to events and manage scheduled workflows.
