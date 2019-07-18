# Copyright (c) 2019 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

# Usage note:
# This expects to be run from the root of the git repo.
# Use the `build.sh` script in this directory to build.

FROM mdillon/postgis:latest
LABEL maintainer="dev@auderenow.org"

COPY init.sql /docker-entrypoint-initdb.d/flu-api-init.sql
