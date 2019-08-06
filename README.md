**CircleCI build status**

[![CircleCI](https://circleci.com/gh/AudereNow/audere.svg?style=svg&circle-token=c97dd3b896e5aceacec319919414658655db7037)](https://circleci.com/gh/AudereNow/audere)

# Audere

Welcome to the Audere repo!

This repo hosts our code as we work to make it open-source.

To contribute, please see [CONTRIBUTING](CONTRIBUTING.md).

## Under Construction

Please pardon the mess.

We are in the process of transitioning our code from a private repo called "learn" to a public repo called "audere".
This is happening gradually to minimize disruption for our developers.
During the transition there will be (apparently broken) links that refer back to the private repo.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code.
Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@auderenow.org.

# Projects

## Flu

Flu is an experimental project used to study flu.

The flu apps track consent and survey information about flu symptoms in participants.
The application has two primary components, a React Native application for participants and a data collection API that persists participant data.
These applications are built using CircleCI and deployed to AWS.

- [FluStudy_au](https://github.com/AudereNow/audere/tree/master/FluStudy_au)
- [FluStudy_us](https://github.com/AudereNow/audere/tree/master/FluStudy_us)
- [FluTrack](https://github.com/AudereNow/audere/tree/master/FluTrack)
- [FluApi](https://github.com/AudereNow/audere/tree/master/FluApi)
- [Terraform scripts](https://github.com/AudereNow/audere/tree/master/terraform)

### Development setup

Building this project requires the following dependencies:

- [CircleCI](https://circleci.com/)
- [Docker](https://www.docker.com/)

The project can be built locally by executing the CircleCI target `circleci local execute --job build`.
This will execute the configured build action within a local Docker CircleCI server, which builds and tests the application modules.

More information about running each component can be found in the respective application documentation.

### Releases

The FluTrack application is not intended for general use but is used directly by clinicians in controlled environments.
Our other mobile apps are released through the Android Play Store and iOS App Store when the corresponding study is active.

## Terraform

This repository also contains Audere's AWS account management and provisioning scripts, used to administer the application infrastructure environment.
