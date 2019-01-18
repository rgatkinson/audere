#!/bin/bash
#
# Copyright (c) 2018 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

${util_sh}

function main() {
  install_updates
  apt-get -y install jq
  add_users
  deluser --remove-home ubuntu
  update_sshd
}

function add_users() {
  for u in $(echo_ssh_keys | jq -r 'keys[]'); do
    adduser --gecos "$u" --disabled-password "$u"
    echo_ssh_keys | jq -r ".$u" | write_sshkey "$u"
  done
}

function echo_ssh_keys() {
  cat <<'EOF'
${ssh_public_key_map}
EOF
}

function update_sshd() {
  cat >>/etc/ssh/sshd_config <<'EOF'
Port ${bastion_port}
PermitRootLogin no
EOF
}

export TERM="xterm-256color"
( umask 022; touch /setup.log )
main &>>/setup.log
reboot
