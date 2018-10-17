#!/usr/bin/env bash
REPO_ROOT_DIR=$(git rev-parse --show-toplevel)
PROJECT_DIR=$REPO_ROOT_DIR/learn/ReactNativeTS/FluTrack
FILENAME=buildInfo.json
TODAY=$(date +%Y%m%d)
GITHASH=$(git log --pretty=format:'%h' -n 1)

cat > $PROJECT_DIR/$FILENAME <<EOF
  {
    "buildInfo": {
      "date": "$TODAY",
      "hash": "$GITHASH"
    }
  }
EOF
			  
