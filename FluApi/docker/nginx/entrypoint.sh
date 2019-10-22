#!/bin/sh
# Copyright (c) 2019 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

set -euxo pipefail
umask 077

mkdir -p "/creds/vpc-cert"
echo "Copying certificates into credentials directory"
set +x
echo "-----BEGIN CERTIFICATE-----" >> "/creds/vpc-cert/vpc.crt"
echo $VPC_CERT >> "/creds/vpc-cert/vpc.crt"
echo "-----END CERTIFICATE-----" >> "/creds/vpc-cert/vpc.crt"
echo "-----BEGIN PRIVATE KEY-----" >> "/creds/vpc-cert/vpc.key"
echo $VPC_CERT_KEY >> "/creds/vpc-cert/vpc.key"
echo "-----END PRIVATE KEY-----" >> "/creds/vpc-cert/vpc.key"
echo "-----BEGIN DH PARAMETERS-----" >> "/creds/vpc-cert/vpc.dhparam"
echo $VPC_CERT_DHPARAM >> "/creds/vpc-cert/vpc.dhparam"
echo "-----END DH PARAMETERS-----" >> "/creds/vpc-cert/vpc.dhparam"
set -x

function echo_https_server() {
  local app_port="$1"
  local app_url="$2"
  local CERT_DIR="/creds/vpc-cert"

  cat <<EOF
server {
  server_name ${DOMAIN};

  listen [::]:$app_port ssl ipv6only=on;
  listen $app_port ssl;

  ssl_certificate $CERT_DIR/vpc.crt;
  ssl_certificate_key $CERT_DIR/vpc.key;
  ssl_dhparam $CERT_DIR/vpc.dhparam;

  # Based on the .conf file Certbot generates for nginx
  # and the cipher list from "https://cipherli.st"
  ssl_session_cache shared:le_nginx_SSL:1m;
  ssl_session_timeout 1440m;
  ssl_protocols TLSv1.2;
  ssl_prefer_server_ciphers on;
  ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;

  location ${SUBPATH:-/} {
    limit_req zone=${SUBDOMAIN} burst=10 nodelay;

    ${SUBPATH:+"rewrite ${SUBPATH}(.*) /\$1 break;"}

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

function echo_http_server() {
  local app_port="$1"
  local app_url="$2"

  cat <<EOF
server {
  server_name ${DOMAIN};

  listen $app_port;

  location ${SUBPATH:-/} {
    limit_req zone=${SUBDOMAIN} burst=10 nodelay;

    ${SUBPATH:+"rewrite ${SUBPATH}(.*) /\$1 break;"}

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
limit_req_zone \$http_x_forwarded_for zone=${SUBDOMAIN}:10m rate=5r/s;
EOF
  # SERVERS should look like "proto0:from0:to0 proto1:from1:to1 ..."
  # E.g. "https:443:3000 http:444:3200"
  for i in ${SERVERS}; do
    protocol="${i%%:*}"
    ports="${i#*:}"
    from="${ports%%:*}"
    to="${ports##*:}"

    "echo_${protocol}_server" "$from" "http://127.0.0.1:$to"
  done
}

function init_nginx() {
  rm /etc/nginx/conf.d/default.conf
  echo_nginx_config | tee "/etc/nginx/conf.d/${DOMAIN}.conf"
  # Check the config before restarting
  nginx -t
  nginx -g 'daemon off;'
}

init_nginx
