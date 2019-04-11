To get going on this project:

1. Download and install Android Studio
2. In Android Studio, open ./build.gradle.  A bunch of things will start downloading/processing in
your build folder when this happens.
3. Install Android SDK 27 (Oreo) by opening Tools -> SDK Manager or from the starting window choose Configure -> SDK Manager at the bottom.  Check the SDK 27 (Oreo) box and
OK/accept the dialog.
4. Run `git update-index --assume-unchanged FluStudy/android/app/src/main/java/host/exp/exponent/generated/DetachBuildConstants.java`
    This file is updated by Android Studio whenever you build, with your IP address, so shouldn't be
    reflected into git.
5. File -> Sync Project with Gradle Files.  When a dialog pops up asking you to upgrade Gradle
Plugin and to support Android App Bundle, say "Don't remind me for this project."
You don't want to upgrade because ExpoKit is meant to run on a specific version of gradle.
This sync will pull down a bunch of projects (e.g. react-native-firebase, etc etc).
6. Select Gradle Scripts -> build.gradle (Project: android) in the Project left nav, then
Build -> Make Project.  Hopefully this happens with just a few warnings about gradle versions and
react-native-fbsdk.
7. Install a virtual device for your emulator.  Bring up the Android Virtual Device (AVD) Manager
(Tools -> AVD Manager) and add a System Image (e.g. perhaps an Oreo build on a Pixel).  Once it's
done downloading, select that system image and click Next then Finish.  You should now have at least
one virtual device in Android Studio.
8. Disable Instant Run, because some libraries don't work with it.
Preferences -> Build, Execution, Deployment -> Instant Run -> uncheck Enable Instant Run...
9. For now, only run `yarn start`, not `yarn start-localapi`, because we've not quite gotten the
emulator to talk to a local server yet (due to Axios not succeeding when hitting a local network).
10. Click Run, and when asked to choose a deployment target, choose the virtual device you created
previously.
11. The first time you run, you'll be asked to "Permit drawing over other apps."  Go ahead and do
so.  You might also be asked to update Google Play Services, which you should.

Note:  at the moment, the Android simulator isn't yet working with localapi... so you must
`yarn start` instead of `yarn start-localapi` if you want to run in the simulator.
