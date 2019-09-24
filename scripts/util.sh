# Copyright (c) 2018 by Audere
#
# Use of this source code is governed by an MIT-style license that
# can be found in the LICENSE file distributed with this file.

set -euo pipefail

REPO_ROOT_DIR="$(git rev-parse --show-toplevel)"
if [ -e "$REPO_ROOT_DIR/scripts/.env" ]; then
  set -o allexport
  source $REPO_ROOT_DIR/scripts/.env
  set +o allexport
fi

function aws-wait-for-instance-state() {
  local instance="$1"
  local state="$2"
  itag="$(aws-instance-by-id "$instance" | jqraw '.Tags[] | select(.Key == "Name") | .Value')"
  previous=""
  current="$(aws-instance-state-by-id "$instance")"
  if [[ "$current" != "$state" ]]; then
    echo "Waiting for '$itag' ($instance) to be '$state'"
    while [[ "$current" != "$state" ]]; do
      if [[ "$current" == "$previous" ]]; then
        printf "."
      else
        [[ "$previous" != "" ]] && printf "]\n"
        printf "  currently '$current' [."
      fi
      sleep 1
      previous="$current"
      current="$(aws-instance-state-by-id "$instance")"
    done
    echo "]"
  fi
}

function aws-instance-state-by-id() {
  local id="$1"
  aws-instance-by-id "$id" | jqraw '.State.Name'
}

function aws-instance-by-id() {
  local id="$1"
  jq-unique \
    "instances by id '$id'" \
    "$(aws ec2 describe-instances --instance-ids "$@" | jq '[.Reservations[].Instances[]]')"
}

function aws-instance-id() {
  local name="$1"
  aws-nonterminated-instance "$name" | jqraw ".InstanceId"
}

function aws-nonterminated-instance() {
  local name="$1"
  jq-unique \
    "instances found" \
    "$(aws-instance-list "running,stopped,stopping,pending" "$name")"
}

# [$1]: comma-separated list of instance states, default="running"
# [$2]: value for tag "Name"
function aws-instance-list() {
  case "$#" in
    0|1)
      aws ec2 describe-instances \
        --filters "Name=instance-state-name,Values=${1:-running}"
      ;;
    2)
      aws ec2 describe-instances \
        --filters \
        "Name=instance-state-name,Values=$1" \
        "Name=tag:Name,Values=$2"
      ;;
    *)
      echo2 "Error, expected 2 or fewer arguments, got $#."
      false
      ;;
  esac \
    | jq '[.Reservations[].Instances[]]'
}

function jq-unique() {
  local desc="$1"
  local json="${2:-}"
  case "$(echo "$json" | jq length)" in
    0) echo2 "Error: no $desc" && false;;
    1) echo "$json" | jq '.[0]';;
    *) echo2 "Error: multiple $desc" && echo "$json" | jq 1>&2 && false;;
  esac
}

function jqraw() {
  jq --raw-output "$@"
}

function echo2() {
  echo 1>&2 "$*"
}

function notify-slack() {
  if [[ -z "${SLACK_WEBHOOK:-}" ]]; then
    echo "Set SLACK_WEBHOOK in scripts/.env to send slack notifications"
  else
    curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"$1\"}" $SLACK_WEBHOOK &> /dev/null
  fi
  echo $1
}
