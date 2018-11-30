#!/bin/bash
# Copyright (c) 2018 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

set -euo pipefail
# TODO remove
set -x
umask 077

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

_has_random=false
function add_randomness() {
  echo "$1" >/dev/random
  _has_random=true
}

function new_password() {
  "$_has_random" || \
    fail "Must call add_randomness before generating password"
  tr -dc "A-Za-z0-9" </dev/urandom 2>/dev/null | head -c 32 || true
}

function add_developer() {
  local readonly u="$1"
  adduser --gecos "$u" --disabled-password "$u"
  write_sshkey "$u"
  echo "$u ALL=(ALL) NOPASSWD:ALL" >"/etc/sudoers.d/50-$u"
}

function write_sshkey() {
  local readonly u="$1"
  local readonly d="/home/$u/.ssh"
  mkdir -p "$d"
  # We expect stdin to be the ssh public key
  cat >"$d/authorized_keys"
  chown --recursive "$u:$u" "$d"
  chmod --recursive go-rwx "$d"
}

function parted_mkfs_mount() {
  local readonly dev="$(device_by_letter "$1")"
  local readonly label="$2"
  local readonly dir="$3"
  1>&2 retry parted "$dev" mklabel gpt
  1>&2 retry parted -a opt "$dev" mkpart primary ext4 0% 100%
  local readonly part="$(wait_for_device "$dev"1 "$dev"p1)"
  1>&2 retry mkfs.ext4 "$part"
  local readonly uuid="$(partition_uuid "$part")"
  printf "UUID=%s\t%s\text4\tdefaults,nofail\t0\t2\n" "$uuid" "$dir" >>/etc/fstab
  mkdir -p "$dir"
  mount -a
  1>&2 lsblk
  echo "$label" >"$dir/disk-label.txt"
  echo "$part"
}

function wait_for_device() {
  for i in {1..120}; do
    for dev in "$@"; do [[ -b "$dev" ]] && echo "$dev" && return 0; done
    sleep 1
  done
  fail "wait_for_device: No device(s) '$*' found"
}

function retry() {
  for i in {1..120}; do "$@" && return 0; sleep 1; done
  fail "retry: '$*' did not succeed in 120 attempts"
}

function partition_uuid() {
  local readonly part="$1"
  local uuid=""
  for i in {1..120}; do
    1>&2 lsblk
    1>&2 ls -alF /dev/disk/by-uuid
    for u in /dev/disk/by-uuid/*; do
      target="$(readlink "$u")"
      [[ "${target##*/}" == "${part##*/}" ]] && echo "${u#/dev/disk/by-uuid/}" && return 0
    done
    sleep 1
  done
  fail "partition_uuid: '$part' not found"
}

function device_by_letter() {
  local readonly letter="$1"
  local readonly xvd="/dev/xvd$letter"
  [[ -b "$xvd" ]] && echo "$xvd" && return 0
  for dev in /dev/nvme?n?; do
    if nvme id-ctrl -v "$dev" | 1>&2 grep " \"/dev/sd$letter\.\."; then
      echo "$dev"
      return 0
    fi
  done
  fail "find_device_by_letter: mapping for '/dev/sd$letter' not found."
}

function fail() {
  (
    echo "$*"
    set -x
    lsblk
    ls -alF /dev/disk/by-uuid
  ) 1>&2
  return 1;
}
