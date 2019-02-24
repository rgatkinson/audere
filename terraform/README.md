# Terraform for Audere AWS

This project contains the Terraform code for managing Audere's AWS infrastructure.

# Setup

Working with Terraform requires access to an AWS account.  Once your AWS account is ready you must enable [MFA](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa.html) and must generate an access key.  In order to use the access key with our Terraform deployments you will need to generate a session token using the `get-session-token` script and an MFA code.  Your session token will need to be regenerated upon expiration.  Note that credentials in environment variables override the file output of `get-session-token`.

## Running Terraform

Once you have setup your credentials you can initialize Terraform by running `terraform init` from a top level directory (such as `global` or `flu/0-tfstate`).

## Administrative scripts

In order to apply scripts you must have the appropriate permissions to AWS resources.  IAM roles and permissions are defined in the global Terraform scripts which may only be applied by an administrator.  If you need data from the global tfstate or need additional permissions coordinate with an administrator.
