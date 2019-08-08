# Copyright (c) 2019 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

# Usage note:
# This expects to be run from the root of the git repo.
# Use the `build.sh` script in this directory to build.

FROM node:10-alpine
LABEL maintainer="dev@auderenow.org"

RUN apk update
RUN adduser -g "Task Runner" -D taskuser
RUN mkdir -p /audere/pipeline/cough && chown -R taskuser:taskuser /audere

USER taskuser
WORKDIR /audere/pipeline/cough

COPY --chown=taskuser:taskuser ./build build
COPY --chown=taskuser:taskuser ./node_modules node_modules
COPY --chown=taskuser:taskuser audere-lib-0.1.0.tgz .

COPY --chown=taskuser:taskuser ./package.json package.json
COPY --chown=taskuser:taskuser ./yarn.lock yarn.lock
RUN yarn add file:audere-lib-0.1.0.tgz

CMD ["/bin/sh"]
