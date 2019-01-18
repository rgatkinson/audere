# Copyright (c) 2018 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

set -euo pipefail
set -x # TODO remove
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
    apt-get -y install unattended-upgrades
    umask 022
    cat >/etc/apt/apt.conf.d/50auto-upgrades <<"EOF"
Unattended-Upgrade::Allowed-Origins {
        "${distro_id}:${distro_codename}";
        "${distro_id}:${distro_codename}-security";
        "${distro_id}ESM:${distro_codename}";
};
Unattended-Upgrade::Package-Blacklist {
};
Unattended-Upgrade::DevRelease "false";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "10:00";
EOF
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
  local u="$1"
  if [[ ! -d "/home/$u"]]; then
    adduser --gecos "$u" --disabled-password "$u"
    write_sshkey "$u"
    echo "$u ALL=(ALL) NOPASSWD:ALL" >"/etc/sudoers.d/50-$u"
  }
}

function write_sshkey() {
  local u="$1"
  local d="/home/$u/.ssh"
  mkdir -p "$d"
  # We expect stdin to be the ssh public key
  cat >"$d/authorized_keys"
  chown --recursive "$u:$u" "$d"
  chmod --recursive go-rwx "$d"
}

function parted_mkfs_mount() {
  local dev="$(device_by_letter "$1")"
  local label="$2"
  local dir="$3"
  1>&2 retry parted "$dev" mklabel gpt
  1>&2 retry parted -a opt "$dev" mkpart primary ext4 0% 100%
  local part="$(wait_for_device "$dev"1 "$dev"p1)"
  # Sometimes Linux does not assign a uuid if we don't give some time here
  #sleep 10
  1>&2 retry mkfs.ext4 -L "$label" "$part"
  local uuid=$(uuidgen)
  1>&2 retry tune2fs -U "$uuid" "$part"
  #local uuid="$(partition_uuid "$part")"
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
  local part="$1"
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
  local letter="$1"
  local xvd="/dev/xvd$letter"
  ( type nvme || apt-get -y install nvme-cli ) 1>&2
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
