#!/usr/bin/env bash
REPO_ROOT_DIR=$(git rev-parse --show-toplevel)
APP_DIR=$REPO_ROOT_DIR/learn/ReactNativeTS/FluTrack
SERVER_DIR=$REPO_ROOT_DIR/learn/NodeJSWebService
FILENAME=buildInfo.json
TODAY=$(date +%Y%m%d)
GITHASH=$(git log --pretty=format:'%h' -n 1)

cat > $APP_DIR/$FILENAME <<EOT
  {
    "buildInfo": {
      "date": "$TODAY",
      "hash": "$GITHASH"
    }
  }
EOT
			  
cat > $SERVER_DIR/$FILENAME <<EOT
  {
    "buildInfo": {
      "date": "$TODAY",
      "hash": "$GITHASH"
    }
  }
EOT
