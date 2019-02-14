
#!/bin/bash
# Copyright (c) 2018 by Audere
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

${util_sh}

function main() {
  install_updates
  generate_secrets
  write_secrets
}

function generate_secrets() {
  add_randomness "${random_seed}"
  # Although not a password 32 char random string is sufficient
  readonly sha_secret="$(new_password)"
}

function write_secrets() {
  parted_mkfs_mount "${api_device_letter}" "api" "/mnt/api"
  mkdir -p "/mnt/api/app"
  cat >"/mnt/api/app/env" <<EOF
EXPORT_HASH_SECRET=$sha_secret
EOF
  umount "/mnt/api"
}

(umask 022;touch /setup.log)
set -x
export TERM="xterm-256color"
main &>/setup.log
halt
