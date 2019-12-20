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

RUN adduser -gecos "Audere Api" --disabled-password api
RUN mkdir -p /audere/FluApi && chown -R api:api /audere
USER api
WORKDIR /audere/FluApi

COPY --chown=api:api ./FluApi/yarn.lock ./FluApi/package.json /audere/FluApi/
COPY --chown=api:api ./FluApi/docker/api/ /audere/FluApi/docker/api/
COPY --chown=api:api ./FluApi/static/buildInfo.json /audere/FluApi/static/buildInfo.json
RUN /audere/FluApi/docker/api/init0-install.sh

COPY --chown=api:api . /audere
RUN /audere/FluApi/docker/api/init1-build.sh

ENTRYPOINT /audere/FluApi/docker/api/entrypoint.sh
