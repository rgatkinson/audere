# Copyright (c) 2019 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

# Usage note:
# This expects to be run from the root of the git repo.
# Use the `build.sh` script in this directory to build.

FROM node:10-stretch
LABEL maintainer="dev@auderenow.org"

RUN apt-get update && apt-get --yes dist-upgrade

RUN apt-get install --yes \
   libpq-dev \
   postgresql-client \
   rsync

RUN npm install --global yarn

RUN adduser -gecos "Audere Api" --disabled-password api

COPY --chown=api:api . /audere
USER api
WORKDIR /audere/FluApi

RUN /audere/FluApi/docker/api/init-once.sh

ENTRYPOINT /audere/FluApi/docker/api/entrypoint.sh
