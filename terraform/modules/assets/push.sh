#!/bin/bash
#
# Copyright (c) 2019 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

set -euo pipefail
umask 077

SELF_DIR="$(cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd)"
LOCAL_DIR="$(cd "$SELF_DIR/../../../local" && pwd)"

if [[ "$(basename "$SELF_DIR")" != "assets" ]]; then
  echo 1>&2 "These scripts assume they are working with a directory named 'assets'."
  exit 1
fi

cd "$SELF_DIR/.."

HASH="$(
  find assets -type f -exec sha256sum '{}' '+' \
    | sort \
    | sha256sum - \
    | awk '{print $1}'
)"

LOCAL_ASSETS_DIR="$LOCAL_DIR/terraform-assets"
TAR_NAME="$HASH.tar.bz2"
TAR_FILE="$LOCAL_ASSETS_DIR/$TAR_NAME"
REF_FILE="$LOCAL_ASSETS_DIR/sha256sum.txt"

mkdir -p "$LOCAL_ASSETS_DIR"

if [[ -f "$TAR_FILE" ]]; then
  echo "Archive '$TAR_FILE' appears to be current.  Nothing uploaded."
  echo "To force upload:"
  echo "  rm '$TAR_FILE' && '${BASH_SOURCE[0]}'"
else
  echo "Creating assets archive file '$TAR_FILE'"
  tar cjf "$TAR_FILE" assets
  echo "Uploading assets archive to S3"
  aws s3 cp \
    "$TAR_FILE" \
    "s3://build-artifacts.auderenow.io/terraform-assets/$TAR_NAME" \
    --grants "read=uri=http://acs.amazonaws.com/groups/global/AllUsers"
fi

echo "$HASH" >"$REF_FILE"
