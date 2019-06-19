#!/bin/bash
# Copyright (c) 2019 by Audere
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

function download_assets() {
  local hash="${assets_sha256}"

  mkdir /audere
  (
    cd /audere
    curl "http://build-artifacts.auderenow.io.s3.amazonaws.com/terraform-assets/$hash.tar.bz2" \
      | tar xj
    h="$(
      find assets -type f -exec sha256sum '{}' '+' \
      | sort \
      | sha256sum - \
      | awk '{print $1}'
    )"
    if [[ "$h" != "$hash" ]]; then
      echo 1>&2 "Corrupted asset archive: exiting"
      exit 1
    fi
  )
  export TF_ASSETS="/audere/assets"
}

function main() {
  yum -y update
  yum -y install tar bzip2 jq unzip wget

  add_developer_accounts
  download_assets

  install_cloudwatch_agent
  add_to_ecs_cluster
}

function add_developer_accounts() {
  for u in $(echo_ssh_keys | jq -r 'keys[]'); do
    echo_ssh_keys | jq -r ".$u" | add_developer "$u"
  done
}

function add_developer() {
  local u="$1"
  useradd -m -c "$u" "$u"
  write_sshkey "$u"
  echo "$u ALL=(ALL) NOPASSWD:ALL" >"/etc/sudoers.d/50-$u"
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

function echo_ssh_keys() {
  cat <<'EOF'
${ssh_public_key_map}
EOF
}

function echo_cloudwatch_agent_config() {
  sed \
    -e 's/TF_ENVIRONMENT/${environment}/' \
    "$TF_ASSETS/ecs-cloudwatch-agent-config.json"
}

function install_cloudwatch_agent() {
  mkdir /tmp/cw-agent
  (cd /tmp/cw-agent
  wget https://s3.amazonaws.com/amazoncloudwatch-agent/linux/amd64/latest/AmazonCloudWatchAgent.zip
  unzip AmazonCloudWatchAgent.zip
  rpm -U ./amazon-cloudwatch-agent.rpm
  rm *)
  echo_cloudwatch_agent_config | sudo tee "/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"
  /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
}

function add_to_ecs_cluster() {
  echo ECS_CLUSTER='${cluster_name}' > /etc/ecs/ecs.config
}

(umask 022;touch /setup.log)
set -x
export TERM="xterm-256color"
main &>/setup.log
