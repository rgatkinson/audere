#!/bin/bash
#
# Copyright (c) 2018 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

${util_sh}

function main() {
  install_updates

  # fallback in case /home mount ever fails
  echo_ssh_key | write_sshkey ubuntu

  apt-get -y install nvme-cli sshfs
  parted_mkfs_mount "${home_volume_letter}" "${userid}-home" "/home"
  echo_ssh_key | add_developer "${userid}"

  # sshfs normally only allows the current user access, which means 'sudo'
  # command cannot access remotely mounted credentials.  This allows setting
  # allow_root (or allow_other) options in sshfs.
  echo "user_allow_other" >>"/etc/fuse.conf"
}

function echo_ssh_key() {
  cat <<EOF
${ssh_public_key}
EOF
}

export TERM="xterm-256color"
main &>/setup.log
reboot
