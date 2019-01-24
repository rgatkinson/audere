#!/bin/bash

./gradlew ${1:-installDevMinSdkDevKernelDebug} --stacktrace && adb shell am start -n org.auderenow.flutrack/host.exp.exponent.MainActivity
