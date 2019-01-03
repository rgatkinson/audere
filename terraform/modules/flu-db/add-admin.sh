#!/bin/bash
# Copyright (c) 2018 by Audere
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

${util_sh}

readonly db_port="5432"

function main() {
  install_updates
  load_existing_creds

  add_randomness "${random_seed}"
  local new_password="$(new_password)"
  write_credentials "$new_password"
  update_db "${pii_db_host}" "$new_password"
  update_db "${nonpii_db_host}" "$new_password"
}

function load_existing_creds() {
  local dev="$(device_by_letter "${my_device_letter}")"
  local part="$(wait_for_device "$dev"1 "$dev"p1)"

  local mem="/mnt/mem"
  mkdir "$mem"
  mount -t ramfs -o size=1m ext4 "$mem"

  local creds="/mnt/my-creds"
  mkdir "$creds"
  mount "$part" "$creds"
  rsync -a "$creds/db/" "$mem/db"
  umount "$creds"

  export PGPASSFILE="$mem/db/pgpass"
}

function update_db() {
  local host="$1"
  local new_password="$2"
  apt-get -y install postgresql-client-10

  retry psql \
    --host="$host" \
    --username="${my_userid}" \
    --dbname=postgres \
    --no-password \
    <<EOF
select 0;
EOF

  psql \
    --host="$host" \
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
  local db_name="flu"
  local db_user="${new_userid}"
  local db_password="$1"
  local creds="/mnt/new-creds"
  parted_mkfs_mount "${new_device_letter}" "$db_user" "$creds"

  mkdir -p "$creds/db"
  cat >"$creds/pgpass" <<EOF
${pii_db_host}:$db_port:$db_name:$db_user:$db_password
${nonpii_db_host}:$db_port:$db_name:$db_user:$db_password
EOF
  cat >"$creds/env" <<EOF
PII_DATABASE_URL=postgres://$db_user:$db_password@${pii_db_host}:$db_port/$db_name
NONPII_DATABASE_URL=postgres://$db_user:$db_password@${nonpii_db_host}:$db_port/$db_name
EOF
  umount "$creds"
}

(umask 022;touch /setup.log) # TODO remove
set -x # TODO remove
export TERM="xterm-256color"
main &>/setup.log # TODO remove
halt
