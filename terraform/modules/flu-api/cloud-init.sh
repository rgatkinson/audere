#!/bin/bash
# Copyright (c) 2018 by Audere
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

${util_sh}

function main() {
  install_updates

  apt-get -y install unzip

  install_cloudwatch_agent
  mount_creds
  adduser --gecos "Audere Api" --disabled-password api
  chown -R "api:api" /creds/{github,db}

  apt-get -y install git jq postgresql-client-common python libpq-dev build-essential

  add_developer_accounts

  [[ "${mode}" != service ]] || init_nginx
  configure_api
}

function add_developer_accounts() {
  for u in $(echo_ssh_keys | jq -r 'keys[]'); do
    echo_ssh_keys | jq -r ".$u" | add_developer "$u"
  done
}

function echo_ssh_keys() {
  cat <<'EOF'
${ssh_public_key_map}
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
  sudo -H --login --user=api bash "$API/init/api-init" "${mode}" "${commit}" "${environment}"
  [[ "${mode}" != service ]] || pm2_startup
}

function pm2_startup() {
  (
    export HOME=/home/api
    set +x; . "$HOME/.nvm/nvm.sh"; set -x
    $HOME/.yarn/bin/pm2 startup -u api --hp $API --service-name flu-api-pm2
  )
}

function echo_nginx_server() {
  local app_port="$1"
  local app_url="$2"
  local VPC_CERT="/creds/vpc-cert"

  cat <<EOF
server {
  server_name ${domain};

  listen [::]:$app_port ssl ipv6only=on;
  listen $app_port ssl;

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

    proxy_pass $app_url;
    proxy_redirect off;

    client_max_body_size 20M;
  }
}
EOF
}

function echo_nginx_config() {
  cat <<EOF
# Rate limiting
# On 64-bit systems, nginx stores 128 bytes per entry, so 1MB supports 8k clients.
limit_req_zone \$http_x_forwarded_for zone=${subdomain}:10m rate=5r/s;
EOF
  echo_nginx_server "443" "http://localhost:3000"
  echo_nginx_server "444" "http://localhost:3200"
}

function init_nginx() {
  apt-get -y install nginx
  rm /etc/nginx/sites-enabled/default
  echo_nginx_config |  sudo tee "/etc/nginx/sites-enabled/${domain}"
  # Check the config before restarting
  nginx -t
  sudo service nginx restart
}

function echo_cloudwatch_agent_config() {
  cat <<EOF
${cloudwatch_config_json}
EOF
}

function install_cloudwatch_agent() {
  mkdir /tmp/cw-agent
  (cd /tmp/cw-agent
  wget https://s3.amazonaws.com/amazoncloudwatch-agent/linux/amd64/latest/AmazonCloudWatchAgent.zip
  unzip AmazonCloudWatchAgent.zip
  dpkg -i amazon-cloudwatch-agent.deb
  rm *)
  echo_cloudwatch_agent_config | sudo tee "/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json"
  /opt/aws/amazon-cloudwatch-agent/bin/config-translator \
    --input /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json\
    --output /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.toml
  systemctl enable amazon-cloudwatch-agent
}

(umask 022;touch /setup.log)
set -x
export TERM="xterm-256color"
main &>/setup.log

case "${mode}" in
  migrate) halt;;
  service) reboot;;
  *) fail "Unrecognized mode '${mode}'";;
esac
