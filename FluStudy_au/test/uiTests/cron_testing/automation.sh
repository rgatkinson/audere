#!/bin/bash
set -x

date=`date`
echo $date
git_hash=$(cat last_commit_hash.txt)
last_input_used=$(cat last_input_used.txt)

PATH="$HOME/.nvm/versions/node/v10.15.3/bin:/opt/local/bin:/opt/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "$HOME/audere/FluStudy_au"
git checkout master && GIT_SSH_COMMAND="ssh -i $HOME/.ssh/automation_rsa" git pull --rebase
# names=$(git log $git_hash.. --pretty=format:"%an")
rm -rf node_modules
yarn install
cd "$HOME/audere/FluStudy_au/ios"
rm -rf Pods
pod install
cd "$HOME/audere/FluStudy_au"
yarn start-automation &
YARN_START_PID=$!
cd "$HOME/audere/FluStudy_au/ios"
xcodebuild clean -workspace fluathome.xcworkspace -scheme "fluathome Debug"
XCODE_OUT=$(xcodebuild -workspace fluathome.xcworkspace -scheme "fluathome Debug" -destination "name=iPhone 8" 2>&1) 
if [[ $XCODE_OUT == *"Build Failed"* ]]; then
    echo 'Subject: Appium Automated Test Failure' > failure_email.txt
    echo 'Xcode build failure' >> failure_email.txt
    echo "$XCODE_OUT" >> failure_email.txt
    sendmail sam@auderenow.org < failure_email.txt
    kill $YARN_START_PID
    exit 1
    fi

cd "$HOME/audere/FluStudy_au/test/uiTests/testInputs"
input_files=(*)
num_input_files=${#input_files[@]}
next_input=$(((last_input_used + 1) % num_input_files))
export TEST_UI_INPUT="./testInputs/${input_files[next_input]}"

APPIUM_OUT=$(yarn test-ui-ios -t "A user should be able to navigate through the entire app" 2>&1)
cd "$HOME/audere/FluStudy_au/test/uiTests/cron_testing"
if [[ $APPIUM_OUT == *"failed"* ]]; then
    echo "Subject: Appium Automated Test Failure" > failure_email.txt
    echo "An error occured during the Appium test" >> failure_email.txt
    echo "" >> failure_email.txt
    echo "Details: $APPIUM_OUT" >> failure_email.txt
    sendmail sam@auderenow.org < failure_email.txt
    kill $YARN_START_PID
    exit 1
fi
kill $YARN_START_PID
git rev-parse HEAD > last_commit_hash.txt
echo $next_input > last_input_used.txt
