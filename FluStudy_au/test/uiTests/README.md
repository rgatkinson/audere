# uiTests

Appium-driven simulator tests to automate previously manual processes.

## One-time setup

Appium requires Carthage. Install with `sudo port selfupdate && sudo port install carthage`

From Xcode, change the default build location:

1. Xcode > File > Workspace Settings
2. Click advanced button under Derived Data
3. Select Custom (Relative to Derived Data)
4. Fill in
   Products: fluathome_au/Build/Products
   Intermediates: fluathome_au/Build/Intermediates.noindex
   Index Datastore: fluathome_au/Index/DataStore

For Android, set the envirnoment variable $ANDROID_HOME to be your sdk folder `export ANDROID_HOME=/Users/your_name/Library/Android/sdk`

## Running the tests

The following set of instructions should launch the automated tests in the iPhone or Android emulator.

1. Pull latest master
2. From FluStudy_au `yarn install` and `yarn start`
3. Build fluathome on iPhone 8 emulator from XCode or Pixel XL API 28 emulator from Android Studio
4. Start appium server with `yarn appium`
5. From FluStudy_au `yarn test-ui-ios` (for iOS emulator) or `yarn test-ui-android` (for android emulator)
