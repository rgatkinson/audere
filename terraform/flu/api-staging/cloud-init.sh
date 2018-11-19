#!/bin/bash
set -euo pipefail
set -x # TODO remove
umask 077

function main() {
  add_developer_accounts

  install_updates
  mount_creds
  adduser --gecos "Audere Api" --disabled-password api
  chown -R "api:api" /creds/{github,env,pgpass} # TODO: move env,pgpass into /creds/db

  apt-get -y install git nginx postgresql-client-common
  init_nginx
  setup_api
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
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDfWK2rOOGNmf8+XCQwPw7SVfXJuwnGz/79HOpyQQmlE2ob2/uIiOF5CqHHLHOrIJlx7E21KvtcAPF4YhSyI/f+/nugmrI3rrKOuFpram9oWBZigxv7w4N56DjSoedS1y0tXJGBY9jCgWpM2m7lbEslKmZ+hGgDbcPBitk6CqGzY2F0lSEhXDs+KPbxQ2KrNISxfpLsj8En1Ti8MVlBHveIyLpIaqZnaJsBKxCiHvq76XMm26LqSiftqaK+tA+3NvNvDdrmn4XfHc7vY59mUznNUZXu5p/U+S7JX9g+jNXn62ms7Ew79qV9uFnYxIqWFzNOQwfdh2UDHL7ShSUcBIE/ ram@Rams-MacBook-Pro.local
EOF

  add_ssh_account mmarucheck <<EOF
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCxU0lwsFc6AQGHcqDgobA/8dLNHYkUaK+4VJhJ9BsPoo3BDT9S4weh+NPKe+HtcMvW5w8aRPe+7tN76BWXYAtxIY1tV3gB1Bd4ds2eGA6FvaY0Rg+sJXMlO4PBXIrBJ4PzOhix/jd373wNFyyHChx9ANlQ+1S9SH0jBwkN3zHIT7DMZYIiiETa6pEyI+mBp4PfLhLq/rakxG/knWYFc01pJGx7UWKhUOl0l5xrlyMdh6jWDmuVwL0qvbD35nl3N6Ot9HJxo5V1a0G4BdkBOw355cwEECVPXoipe0BiwBvT7EWQCvhuwKzylgVMyTTr6+ewDilGx9t9ta8uDcuI15wWim3BT2wWPKF995ypiwFyAWnO8XOX+/FJoJm5MvHB8jlqKch9zQuT1mDNTDvv4HZRIdU+zDasPWN+IJCei6eyX8z66tzWi3tO7URvvUnIRZPLgToD0efcMwFGtfh11QGwqxuB2clFLqoyIVRpy4nOdD7EUljjv5Ngm1C2ceiJAZbFagQaB9xyIBdxUMzOHRuNPgWyaX/YpwhZ0YUNjQh5oiE0WzBAk+IjAkHwJZc/mMECVZSIllTfC/aTryWwVm5QA76T7YYhjdsHwkCm5EjQLNHsMtm9LZnl3TpZ+X4F5kI1A+vpFe8vj1kOSd+ZxGQBQgWQ7zsNMMV/AXpe2Otn/Q== 2018-mmarucheck
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
}

function setup_api() {
  (
    readonly API=/home/api

    (base64 -d | tar xj --directory "$API") <<EOF
${init_tar_bz2_base64}
EOF
    chown -R "api:api" "$API"
    sudo -H --login --user=api bash "$API/init/api-init"
    export HOME=/home/api
    set +x
    . "$HOME/.api-rc"
    set -x
    $API/.yarn/bin/pm2 startup -u api --hp $API --service-name flu-api-pm2
  )
}

function init_nginx() {
  readonly VPC_CERT="/creds/vpc-cert"
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

umask 022 # TODO remove
set -x # TODO remove
export TERM="xterm-256color"
main &>/setup.log
