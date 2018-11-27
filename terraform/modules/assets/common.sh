# Copyright (c) 2018 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

set -euo pipefail
# TODO remove
set -x
umask 077

function common_install_updates() {
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

_common_has_random=false
function common_add_randomness() {
  "$_common_has_random" || cat >/dev/random
  _common_has_random=true
}

function common_new_password() {
  "$_common_has_random" || \
    common_fail "Must call common_add_randomness before generating password"
  tr -dc "A-Za-z0-9" </dev/urandom 2>/dev/null | head -c 32 || true
}

function common_add_developer() {
  local readonly u="$1"
  adduser --gecos "$u" --disabled-password "$u"

  local readonly d="/home/$u/.ssh"
  mkdir -p "$d"
  # We expect stdin to be the ssh public key
  cat >"$d/authorized_keys"
  chown --recursive "$u:$u" "$d"
  chmod --recursive go-rwx "$d"

  echo "$u ALL=(ALL) NOPASSWD:ALL" >"/etc/sudoers.d/50-$u"
}

function common_parted_mkfs() {
  local readonly device="$1"
  local readonly label="$2"
  1>&2 common_retry parted "$device" mklabel gpt
  1>&2 common_retry parted -a opt "$device" mkpart primary ext4 0% 100%
  local readonly partition="$(common_wait_for_device "$device"1 "$device"p1)"
  1>&2 common_retry mkfs.ext4 -L "$label-home" "$partition"
  echo "$partition"
}

function common_wait_for_device() {
  for i in {1..120}; do
    for dev in "$@"; do [[ -b "$dev" ]] && echo "$dev" && return 0; done
    sleep 1
  done
  common_fail "wait_for_device: No device(s) '$*' found"
}

function common_retry() {
  for i in {1..120}; do "$@" && return 0; sleep 1; done
  common_fail "retry: '$*' did not succeed in 120 attempts"
}

function common_partition_uuid() {
  local readonly part="$1"
  local uuid=""
  for i in {1..120}; do
    for u in /dev/disk/by-uuid/*; do
      target="$(readlink "$u")"
      [[ "$${target##*/}" == "$${part##*/}" ]] && echo "$${u#/dev/disk/by-uuid/}" && return 0
    done
    sleep 1
  done
  common_fail "partition_uuid: '$part' not found"
}

function common_device_by_letter() {
  local readonly letter="$1"
  local readonly xvd="/dev/xvd$letter"
  [[ -b "$xvd" ]] && echo "$xvd" && return 0
  for dev in /dev/nvme?n?; do
    if nvme id-ctrl -v "$dev" | 1>&2 grep " \"/dev/sd$letter\.\."; then
      echo "$dev"
      return 0
    fi
  done
  common_fail "find_device_by_letter: mapping for '/dev/sd$letter' not found."
}

function common_fail() {
  1>&2 (
    echo "$*"
    set -x
    lsblk
    ls -alF /dev/disk/by-uuid
  )
  return 1;
}
