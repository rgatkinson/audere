(On Ubuntu 18.04+, you may save a little time by following https://stackoverflow.com/a/45749003 before you start)

To get going on this project:

1.
Download and install Android Studio

2.
Install Android SDK 28 (Pie) by opening Tools -> SDK Manager or from the starting window choose Configure -> SDK Manager at the bottom.
Check the SDK 28 (Pie) box and OK/accept the dialog.

3.
In Android Studio, select "Open an existing Android Studio project", then open FluStudy_us/android/build.gradle.
A bunch of things will start downloading/processing in your build folder when this happens.

4.
Run `yarn start` from the FluStudy_us folder.

5.
File -> Sync Project with Gradle Files (or Android Studio may start this automatically -- in Event Log you would see "Gradle sync started").
When a dialog pops up asking you to upgrade Gradle Plugin and to support Android App Bundle, say "Don't remind me for this project."
You don't want to upgrade because ExpoKit is meant to run on a specific version of gradle.
This sync will pull down a bunch of projects (e.g. react-native-firebase, etc etc).

6. 
From LastPass Shared-Engineering folder, find Chills Staging google-services.json and save this as FluStudy_us/android/app/google-services.json

7.
Select Gradle Scripts -> build.gradle (Project: android) in the Project left nav, then Build -> Make Project.
Hopefully this happens with just a few warnings about gradle versions and react-native-fbsdk.

8.
Install a virtual device for your emulator. Bring up the Android Virtual Device (AVD) Manager (Tools -> AVD Manager) and add a System Image (e.g. perhaps an Oreo build on a Pixel).
Once it's done downloading, select that system image and click Next then Finish.
You should now have at least one virtual device in Android Studio.

(On Ubuntu 18.04+, if you didn't already, you may need to give yourself access to /dev/kvm via https://stackoverflow.com/a/45749003)

9.
Disable Instant Run, because some libraries don't work with it.
Preferences -> Build, Execution, Deployment -> Instant Run -> uncheck Enable Instant Run...

(On Ubuntu, this is under File -> Settings... -> Build, Execution, Deployment -> Instant Run)

10.
Click Run, and when asked to choose a deployment target, choose the virtual device you created previously.

11.
The first time you run, you'll be asked to "Permit drawing over other apps." Go ahead and do so.
You might also be asked to update Google Play Services, which you should.
