#!/bin/bash
# Copyright (c) 2019 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

set -euxo pipefail
umask 077
SELF_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"

if [[ ! -d "./node_modules" ]]; then
  echo 1>&2 "WARNING: this goes faster if you run init0-build.sh in base image."
  "$SELF_DIR/init0-build.sh"
fi

# Must avoid generate-build-info here because we no longer have git
time yarn run build:contents
