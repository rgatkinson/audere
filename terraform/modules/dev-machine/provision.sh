#!/bin/bash
#
# Copyright (c) 2018 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.
set -euo pipefail
# TODO remove
set -x
umask 077

function main() {
  apt-get update
  apt-get -y install nvme-cli
  write_sshkey ubuntu
  format_mount_home
  add_developer
  allow_fuse_other
  install_updates
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

function format_mount_home() {
  local readonly dev="$(find_device_by_letter ${home_volume_letter})"
  local readonly part="$(partition_device "$dev")"

  uuid=""
  for i in {1..120}; do
    for u in /dev/disk/by-uuid/*; do
      target="$(readlink "$u")"
      if [[ "$${target##*/}" == "$${part##*/}" ]]; then
        uuid="$${u#/dev/disk/by-uuid/}"
        break
      fi
    done
    [[ -n "$uuid" ]] && break
    set +x
    echo "Could not find uuid of '$part' on device '$dev'"
    echo "  === lsblk ==="
    lsblk
    echo "  === /dev/disk/by-uuid ==="
    ls -alF /dev/disk/by-uuid
    set -x
  done
  [[ -z "$uuid" ]] && exit 1

  printf "UUID=%s\t/home\text4\tdefaults,nofail\t0\t2\n" "$uuid" >>/etc/fstab
  mount -a
  lsblk
}

function find_device_by_letter() {
  local readonly letter="$1"
  local readonly xvd="/dev/xvd$letter"
  if [[ -b "$xvd" ]]; then
    echo "$xvd"
    return 0
  fi

  for dev in /dev/nvme?n?; do
    if nvme id-ctrl -v "$dev" | 1>&2 grep " \"/dev/sd$letter\.\."; then
      echo "$dev"
      return 0
    fi
  done

  echo 1>&2 "Error: could not find device for '/dev/sd$letter'"
  return 1
}

function partition_device() {
  local readonly device="$1"
  1>&2 retry parted "$device" mklabel gpt
  1>&2 retry parted -a opt "$device" mkpart primary ext4 0% 100%
  local readonly partition="$(wait_for_device "$device"1 "$device"p1)"
  1>&2 retry mkfs.ext4 -L "${userid}-home" "$partition"
  echo "$partition"
}

function wait_for_device() {
  for i in {1..120}; do
    for dev in "$@"; do
      if [[ -b "$dev" ]]; then
        echo "$dev"
        return 0
      fi
    done
    sleep 3
  done
}

function retry() { until "$@"; do sleep 1; echo "Retrying '%*'"; done; }

function allow_fuse_other() {
  # sshfs normally only allows the current user access.
  echo "user_allow_other" >>"/etc/fuse.conf"
}

function add_developer() {
  local readonly user="${userid}"
  adduser --gecos "$user" --disabled-password "$user"
  write_sshkey "$user"
  echo "$user ALL=(ALL) NOPASSWD:ALL" >"/etc/sudoers.d/50-$user"
}

function write_sshkey() {
  local readonly user="$1"
  local readonly sshdir="/home/$user/.ssh"
  mkdir -p "$sshdir"
  cat >"$sshdir/authorized_keys" <<EOF
${ssh_public_key}
EOF
  chown --recursive "$user:$user" "$sshdir"
  chmod --recursive go-rwx "$sshdir"
}

export TERM="xterm-256color"
main &>/setup.log
echo "Rebooting in 2 seconds"
sleep 2
reboot
