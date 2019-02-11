# Flu Track

**CircleCI build status**

[![CircleCI](https://circleci.com/gh/AudereNow/learn.svg?style=svg&circle-token=58430dd777deb478fd971a19ae00e94e5b0d9977)](https://circleci.com/gh/AudereNow/learn)

## Overview

Flu is an experimental project under active development for use in a Seattle area study.

Flu tracks consent and survey information about flu symptoms in participants. The application has two primary components, a React Native application for participants and a data collection API that persists participant data. These applications are built using CircleCI and deployed to AWS.

* [FluStudy](https://github.com/AudereNow/learn/tree/master/FluStudy)
* [FluTrack](https://github.com/AudereNow/learn/tree/master/learn/ReactNativeTS/FluTrack)
* [FluApi](https://github.com/AudereNow/learn/tree/master/FluApi)
* [Terraform scripts](https://github.com/AudereNow/learn/tree/master/terraform)

## Development setup

Building this project requires the following dependencies:

* [Yarn](https://yarnpkg.com)
* [CircleCI](https://circleci.com/)
* [Docker](https://www.docker.com/)

The project can be built locally by executing the CircleCI target `circleci local execute --job build`. This will execute the configured build action within a local Docker CircleCI server, which builds and tests the application modules.

More information about running each component can be found in the respective application documentation.

## Releases

The FluTrack application is not intended for general use but is used directly by clinicians in controlled environments.

## Terraform

This repository also contains Audere's AWS account management and provisioning scripts, used to administer the application environment.
