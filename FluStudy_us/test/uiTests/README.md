# uiTests

Appium-driven simulator tests to automate previously manual processes.

## One-time setup

Appium requires Carthage. Install with `sudo port selfupdate && sudo port install carthage`

From Xcode, change the default build location:

1. Xcode > File > Workspace Settings
2. Click advanced button under Derived Data
3. Select Custom (Relative to Derived Data)
4. Fill in
   Products: fluathome_us/Build/Products
   Intermediates: fluathome_us/Build/Intermediates.noindex
   Index Datastore: fluathome_us/Index/DataStore

For Android, set the envirnoment variable \$ANDROID_HOME to be your sdk folder `export ANDROID_HOME=/Users/your_name/Library/Android/sdk`

DB Setup:

1. Download Firebase-fluathome-us-staging.json from test-automation channel post on June 3.
2. Add this line to `FluApi/.env` and change "FIXTHIS" to your local userid (the path should match the file you downloaded):
   `FIREBASE_TRANSPORT_CREDENTIALS=/Users/FIXTHIS/Downloads/Firebase-fluathome-us-staging.json`
3. While you're here, make sure NONPII_DATABASE_URL and PII_DATABASE_URL point to your local postgres/postgis implementation, and that running `(. .env && psql $NONPII_DATABASE_URL)` successfully connects to your local db.
4. `npm install pm2 -g` if you don't have `pm2` installed

## Running the tests

The following set of instructions should launch the automated tests in the iPhone or Android emulator.

1. Pull latest master
2. From FluStudy_us `yarn install` and `yarn start-automation`
3. Build fluathome on iPhone 8 emulator from XCode or Pixel XL API 28 emulator from Android Studio
4. Start appium server with `yarn appium`
5. In FluApi, `pm2 start process.json --env automation`
6. From FluStudy_us `yarn test-ui-ios -t <name of test>` (for iOS emulator) or `yarn test-ui-android -t <name of test>` (for android emulator)
   - See test/uiTests/appium.test.js for the names of tests, e.g. "Non-demo mode test"
