#!/bin/bash
# Copyright (c) 2018 by Audere
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.
set -euo pipefail
# TODO remove
set -x
umask 077

readonly db_port="5432"

function main() {
  install_updates
  generate_passwords
  write_credentials
  setup_db
  shutdown1
}

function install_updates() {
  (
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get dist-upgrade \
      -y \
      -o Dpkg::Options::="--force-confdef" \
      -o Dpkg::Options::="--force-confold" \
      --allow-change-held-packages
  )
}

function generate_passwords() {
  add_randomness
  readonly api_prod_password="$(generate_password)"
  readonly api_staging_password="$(generate_password)"
  readonly ram_password="$(generate_password)"
  readonly mmarucheck_password="$(generate_password)"
  readonly new_db_setup_password="$(generate_password)"
}

function add_randomness() {
  # Add bytes from local dev machine to VM's randomness
  echo "${random_seed}" >"/dev/random"
}

function generate_password() {
  tr -dc "A-Za-z0-9" </dev/urandom 2>/dev/null | head -c 32 || true
}

function setup_db() {
  apt-get -y install postgresql-client-10

  PGPASSWORD="${db_setup_password}" \
  retry psql \
    --host="${db_host}" \
    --username="${db_setup_user}" \
    --dbname=postgres \
    --no-password \
    <<EOF
select 0;
EOF

  PGPASSWORD="${db_setup_password}" \
  psql \
    --host="${db_host}" \
    --username="${db_setup_user}" \
    --dbname=postgres \
    --no-password \
    <<EOF
create role rds_pgaudit;
create extension pgaudit;

create user api_prod encrypted password '$api_prod_password';
create user api_staging encrypted password '$api_staging_password';

create user ram encrypted password '$ram_password';
grant rds_superuser to ram;
grant api_staging to ram;
grant api_prod to ram;

create user mmarucheck encrypted password '$mmarucheck_password';
grant rds_superuser to mmarucheck;
grant api_staging to mmarucheck;
grant api_prod to mmarucheck;

grant api_prod to ${db_setup_user};
create database flu_prod owner api_prod;
grant api_staging to ${db_setup_user};
create database flu_staging owner api_staging;

alter role ${db_setup_user} with encrypted password '$new_db_setup_password';
EOF
}

function write_credentials() {
  format_xvd "f" "api-prod"
  write_pgpass "/mnt/api-prod/db" "flu_prod" "api_prod" "$api_prod_password"
  write_env    "/mnt/api-prod/db" "flu_prod" "api_prod" "$api_prod_password"
  write_github_key "/mnt/api-prod"
  write_vpc_cert "api" "/mnt/api-prod"
  umount "/mnt/api-prod"

  format_xvd "g" "api-staging"
  write_pgpass "/mnt/api-staging/db" "flu_staging" "api_staging" "$api_staging_password"
  write_env    "/mnt/api-staging/db" "flu_staging" "api_staging" "$api_staging_password"
  write_github_key "/mnt/api-staging"
  write_vpc_cert "api.staging" "/mnt/api-staging"
  umount "/mnt/api-staging"

  # Nobody other than ram should attach this volume.
  format_xvd "n" "ram-creds"
  write_pgpass "/mnt/ram-creds/db" "postgres" "ram" "$ram_password"
  umount "/mnt/ram-creds"

  # Nobody other than mmarucheck should attach this volume.
  format_xvd "o" "mmarucheck-creds"
  write_pgpass "/mnt/mmarucheck-creds/db" "postgres" "mmarucheck" "$mmarucheck_password"
  umount "/mnt/mmarucheck-creds"

  # Nobody should ever attach this volume.  We save it only in case of emergency.
  format_xvd "p" "db-setup-creds"
  write_pgpass "/mnt/db-setup-creds/db" "postgres" "${db_setup_user}" "$new_db_setup_password"
  umount "/mnt/db-setup-creds"
}

function format_xvd() {
  local device="/dev/xvd$1"
  local partition="$device"'1'
  local name="$2"
  local dir="/mnt/$name"

  wait_for_device "$device"
  lsblk
  parted "$device" mklabel gpt
  parted -a opt "$device" mkpart primary ext4 0% 100%

  wait_for_device "$partition"
  lsblk
  retry mkfs.ext4 -L "$name" "$partition"

  mkdir -p "$dir"
  mount "$partition" "$dir"
}

function wait_for_device() {
  retry test -e "$device"
}

function write_pgpass() {
  local dir="$1"
  local db_name="$2"
  local db_user="$3"
  local db_password="$4"
  mkdir -p "$dir"
  echo "${db_host}:$db_port:$db_name:$db_user:$db_password" >"$dir/pgpass"
}

function write_env() {
  local dir="$1"
  local db_name="$2"
  local db_user="$3"
  local db_password="$4"
  mkdir -p "$dir"
  echo "DATABASE_URL=postgres://$db_user:$db_password@${db_host}:$db_port/$db_name" >"$dir/env"
}

function shutdown1() {
  echo "Provision script done, shutting down in 2 seconds."
  sleep 2
  systemctl poweroff
}

function write_vpc_cert() {
  (
    readonly subdomain="$1"
    readonly dir="$2/vpc-cert"
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
  )
}

function write_github_key() {
  (base64 -d | tar xj --directory "$1") <<EOF
${github_tar_bz2_base64}
EOF
}

function retry() { until "$@"; do sleep 1; echo "Retrying '%*'"; done; }

umask 022 # TODO remove
set -x # TODO remove
export TERM="xterm-256color"
main &>/setup.log # TODO remove
