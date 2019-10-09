#!/bin/bash
# Copyright (c) 2019 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

set -euxo pipefail
umask 077
SELF_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"

time (
  set +x
  function check() { echo 'select 1;' | psql "$@"; }
  until check "$NONPII_DATABASE_URL" && check "$PII_DATABASE_URL"; do
    sleep 1
  done
)

time yarn setup-assume-built
time yarn setup-aws

node "./build/src/server.js"
