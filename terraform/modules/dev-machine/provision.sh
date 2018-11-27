#!/bin/bash
#
# Copyright (c) 2018 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

${common_sh}

function main() {
  apt-get update
  apt-get -y install nvme-cli
  write_sshkey ubuntu
  format_mount_home
  common_add_developer "${userid}" <<EOF
${ssh_public_key}
EOF
  # sshfs normally only allows the current user access.
  echo "user_allow_other" >>"/etc/fuse.conf"
  common_install_updates
}

function format_mount_home() {
  local readonly dev="$(common_device_by_letter ${home_volume_letter})"
  local readonly part="$(common_parted_mkfs "$dev" "${userid}-home")"
  local readonly uuid="$(common_partition_uuid "$part")"
  printf "UUID=%s\t/home\text4\tdefaults,nofail\t0\t2\n" "$uuid" >>/etc/fstab
  mount -a
  lsblk
}

export TERM="xterm-256color"
main &>/setup.log
reboot
