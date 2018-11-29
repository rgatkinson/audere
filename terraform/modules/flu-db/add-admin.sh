#!/bin/bash
# Copyright (c) 2018 by Audere
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

${util_sh}

function main() {
  install_updates
  load_existing_creds

  echo "${random_seed}" | add_randomness
  readonly local new_password="$(new_password)"
  write_credentials "$new_password"
  update_db "$new_password"
}

function load_existing_creds() {
  local readonly dev="$(device_by_letter "${my_device_letter}")"
  local readonly part="$(wait_for_device "$dev"1 "$dev"p1)"

  local readonly mem="/mnt/mem"
  mkdir "$mem"
  mount -t ramfs -o size=1m ext4 "$mem"

  local readonly creds="/mnt/my-creds"
  mkdir "$creds"
  mount "$part" "$creds"
  rsync -a "$creds/db/" "$mem/db"
  umount "$creds"

  export PGPASSFILE="$mem/db/pgpass"
}

function update_db() {
  local readonly new_password="$1"
  apt-get -y install postgresql-client-10

  retry psql \
    --host="${db_host}" \
    --username="${my_userid}" \
    --dbname=postgres \
    --no-password \
    <<EOF
select 0;
EOF

  psql \
    --host="${db_host}" \
    --username="${my_userid}" \
    --dbname=postgres \
    --no-password \
    <<EOF
create user ${new_userid} encrypted password '$new_password';
grant rds_superuser to ${new_userid};
grant api to ${new_userid};
EOF
}

function write_credentials() {
  local readonly creds="/mnt/new-creds"
  parted_mkfs_mount "${new_device_letter}" "${new_userid}-creds" "$creds"

  mkdir -p "$creds/db"
  echo "${db_host}:5432:postgres:${new_userid}:$new_password" >"$creds/db/pgpass"
  echo "DATABASE_URL=postgres://${new_userid}:$new_password@${db_host}:5432/postgres" >"$creds/db/env"
  umount "$creds"
}

set -x # TODO remove
export TERM="xterm-256color"
main &>/setup.log # TODO remove
halt
