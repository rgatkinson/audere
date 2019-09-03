# FluLambda

Lambda functions for administering the Flu system.  May contain various handlers for processing events from FluApi or AWS infrastructure.

## Build

To build locally:

1. `yarn install` to install local dependencies.
2. `yarn build` to run tsc and generate JavaScript from TypeScript.

Tests can be run via Jest by `yarn test`

## Packaging and Deploying

Lambda functions are uploaded as a zip archive.  To generate the zip archive we blow away the local node modules & retrieve only production dependencies to minimize the archive's size.  You can generate the archive by running `yarn package`.

Lambda function deployment is done via Terraform, see the [flu-lambda](https://github.com/AudereNow/audere/tree/master/terraform/modules/flu-lambda) module and the [staging](https://github.com/AudereNow/audere/tree/master/terraform/flu/lambda-staging) and [production](https://github.com/AudereNow/audere/tree/master/terraform/flu/lambda-production) configurations.
