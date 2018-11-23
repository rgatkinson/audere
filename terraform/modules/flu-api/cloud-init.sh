#!/bin/bash
# Copyright (c) 2018 by Audere
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.
set -euo pipefail
set -x
umask 077

function main() {
  add_developer_accounts

  install_updates
  mount_creds
  adduser --gecos "Audere Api" --disabled-password api
  chown -R "api:api" /creds/{github,db}

  apt-get -y install git postgresql-client-common
  [[ "${mode}" != service ]] || init_nginx
  start_api
  [[ "${mode}" != migrate ]] || shutdown1
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

function add_developer_accounts() {
  add_ssh_account ram <<EOF
${ram_ssh_public_key}
EOF

  add_ssh_account mmarucheck <<EOF
${mmarucheck_ssh_public_key}
EOF
}

function add_ssh_account() {
  (
    readonly user="$1"
    readonly sshdir="/home/$user/.ssh"

    adduser --gecos "$user" --disabled-password "$user"
    mkdir -p "$sshdir"
    cat >"$sshdir/authorized_keys"
    chown --recursive "$user:$user" "$sshdir"
    chmod --recursive go-rwx "$sshdir"
    echo "$user ALL=(ALL) NOPASSWD:ALL" >"/etc/sudoers.d/50-$user"
  )
}

function mount_creds() {
  mkdir -p /creds
  for i in {1..10}; do
    if mount /dev/xvdf1 /creds; then
      break
    fi
    echo "Waiting for /dev/xvdf1"
    sleep 1
  done

  uuid=""
  for u in /dev/disk/by-uuid/*; do
    if [[ "$(readlink "$u")" =~ xvdf1 ]]; then
      uuid="$${u#/dev/disk/by-uuid/}"
      break
    fi
  done
  if [[ -n "$uuid" ]]; then
    printf "UUID=%s\t/creds\text4\tdefaults,nofail\t0\t2\n" "$uuid" >>/etc/fstab
  else
    echo 1>&2 "Could not find UUID for xvdf1"
    echo 1>&2 "  === lsblk ==="
    lsblk 1>&2
    echo 1>&2 "  === /dev/disk/by-uuid ==="
    ls 1>&2 -alF /dev/disk/by-uuid
    exit 1
  fi
}

function start_api() {
  (
    readonly API=/home/api
    (base64 -d | tar xj --directory "$API") <<EOF
${init_tar_bz2_base64}
EOF
    chown -R "api:api" "$API"
    sudo -H --login --user=api bash "$API/init/api-init" "${mode}"
    [[ "${mode}" != service ]] || pm2_startup
  )
}

function pm2_startup() {
  (
    export HOME=/home/api
    set +x; . "$HOME/.nvm/nvm.sh"; set -x
    $HOME/.yarn/bin/pm2 startup -u api --hp $API --service-name flu-api-pm2
  )
}

function init_nginx() {
  readonly VPC_CERT="/creds/vpc-cert"

  apt-get -y install nginx
  rm /etc/nginx/sites-enabled/default

  sudo tee "/etc/nginx/sites-enabled/${domain}" <<EOF
# Rate limiting
# On 64-bit systems, nginx stores 128 bytes per entry, so 1MB supports 8k clients.
limit_req_zone \$http_x_forwarded_for zone=${subdomain}:10m rate=5r/s;

server {
  server_name ${domain};

  listen [::]:443 ssl ipv6only=on;
  listen 443 ssl;

  ssl_certificate $VPC_CERT/vpc.crt;
  ssl_certificate_key $VPC_CERT/vpc.key;
  ssl_dhparam $VPC_CERT/vpc.dhparam;

  # Based on the .conf file Certbot generates for nginx
  # and the cipher list from "https://cipherli.st"
  ssl_session_cache shared:le_nginx_SSL:1m;
  ssl_session_timeout 1440m;
  ssl_protocols TLSv1.2;
  ssl_prefer_server_ciphers on;
  ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;

  location / {
    limit_req zone=${subdomain} burst=10 nodelay;

    # proxy_set_header X-Real-IP \$remote_addr;
    # proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    # proxy_set_header Host \$http_host;
    # proxy_set_header X-NginX-Proxy true;

    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \"upgrade\";

    proxy_pass ${service_url};
    proxy_redirect off;
  }
}
EOF

  # Check the config before restarting
  nginx -t
  sudo service nginx restart
}

function shutdown1() {
  echo "Migration script done, shutting down in 2 seconds."
  sleep 2
  systemctl poweroff
}

umask 022 # TODO remove
set -x # TODO remove
export TERM="xterm-256color"
main &>/setup.log
reboot
