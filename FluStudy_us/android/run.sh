#!/bin/bash

./gradlew ${1:-installDevMinSdkDevKernelDebug} --stacktrace && adb shell am start -n org.auderenow.fluathome_us/host.exp.exponent.MainActivity
