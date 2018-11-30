#!/bin/bash
# Copyright (c) 2018 by Audere
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

${util_sh}

readonly db_port="5432"

function main() {
  install_updates
  generate_passwords
  write_credentials
  setup_db
}

function generate_passwords() {
  add_randomness "${random_seed}"
  readonly api_password="$(new_password)"
  readonly admin_password="$(new_password)"
}

function setup_db() {
  apt-get -y install postgresql-client-10

  PGPASSWORD="${db_setup_password}" \
  retry psql \
    --host="${db_host}" \
    --username="${my_userid}" \
    --dbname=postgres \
    --no-password \
    <<EOF
select 0;
EOF

  PGPASSWORD="${db_setup_password}" \
  psql \
    --host="${db_host}" \
    --username="${my_userid}" \
    --dbname=postgres \
    --no-password \
    <<EOF
create role rds_pgaudit;
create extension pgaudit;

create user api encrypted password '$api_password';
grant api to ${my_userid};
create database flu owner api;

alter role ${my_userid} with encrypted password '$admin_password';
EOF
}

function write_credentials() {
  parted_mkfs_mount "${api_device_letter}" "api" "/mnt/api"
  write_db_creds "/mnt/api/db" "flu" "api" "$api_password"
  write_github_key "/mnt/api"
  write_vpc_cert "api.${environment}" "/mnt/api"
  umount "/mnt/api"

  parted_mkfs_mount "${my_device_letter}" "${my_userid}" "/mnt/admin"
  write_db_creds "/mnt/admin/db" "postgres" "${my_userid}" "$admin_password"
  umount "/mnt/admin"
}

function write_db_creds() {
  local readonly dir="$1"
  local readonly db_name="$2"
  local readonly db_user="$3"
  local readonly db_password="$4"
  mkdir -p "$dir"
  echo "${db_host}:$db_port:$db_name:$db_user:$db_password" >"$dir/pgpass"
  echo "DATABASE_URL=postgres://$db_user:$db_password@${db_host}:$db_port/$db_name" >"$dir/env"
}

function write_vpc_cert() {
  local readonly subdomain="$1"
  local readonly dir="$2/vpc-cert"
  mkdir -p "$dir"
  openssl req \
    -new \
    -newkey rsa:4096 \
    -days $((20 * 365)) \
    -nodes \
    -x509 \
    -subj "/C=US/ST=Washington/L=Seattle/O=Audere/CN=$subdomain.auderenow.io" \
    -keyout "$dir/vpc.key" \
    -out    "$dir/vpc.crt"

  base64 -d >"$dir/vpc.dhparam" <<EOF
${vpc_dhparam_base64}
EOF
}

function write_github_key() {
  (base64 -d | tar xj --directory "$1") <<EOF
${github_tar_bz2_base64}
EOF
}

(umask 022;touch /setup.log) # TODO remove
set -x # TODO remove
export TERM="xterm-256color"
main &>/setup.log # TODO remove
halt
