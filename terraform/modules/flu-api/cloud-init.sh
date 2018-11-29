#!/bin/bash
# Copyright (c) 2018 by Audere
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

${util_sh}

function main() {
  add_developer_accounts

  install_updates
  mount_creds
  adduser --gecos "Audere Api" --disabled-password api
  chown -R "api:api" /creds/{github,db}

  apt-get -y install git postgresql-client-common
  [[ "${mode}" != service ]] || init_nginx
  configure_api
}

function add_developer_accounts() {
  add_developer ram <<EOF
${ram_ssh_public_key}
EOF

  add_developer mmarucheck <<EOF
${mmarucheck_ssh_public_key}
EOF
}

function mount_creds() {
  local readonly dev="$(device_by_letter f)"
  local readonly part="$(wait_for_device "$dev"1 "$dev"p1)"
  mkdir -p /creds
  retry mount "$part" "/creds"
  uuid="$(partition_uuid "/dev/xvdf1")"
  printf "UUID=%s\t/creds\text4\tdefaults,nofail\t0\t2\n" "$uuid" >>/etc/fstab
}

function configure_api() {
  local readonly API=/home/api
  (base64 -d | tar xj --directory "$API") <<EOF
${init_tar_bz2_base64}
EOF
  chown -R "api:api" "$API"
  sudo -H --login --user=api bash "$API/init/api-init" "${mode}" "${commit}"
  [[ "${mode}" != service ]] || pm2_startup
}

function pm2_startup() {
  (
    export HOME=/home/api
    set +x; . "$HOME/.nvm/nvm.sh"; set -x
    $HOME/.yarn/bin/pm2 startup -u api --hp $API --service-name flu-api-pm2
  )
}

function init_nginx() {
  readonly local VPC_CERT="/creds/vpc-cert"
  readonly local service_url = "http://localhost:3000"

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

    proxy_pass $service_url;
    proxy_redirect off;
  }
}
EOF

  # Check the config before restarting
  nginx -t
  sudo service nginx restart
}

umask 022 # TODO remove
set -x # TODO remove
export TERM="xterm-256color"
main &>/setup.log

case "${mode}" in
  migrate) halt;;
  service) reboot;;
  *) fail "Unrecognized mode '${mode}'";;
esac
