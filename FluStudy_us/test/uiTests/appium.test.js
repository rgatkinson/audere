// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import wd from "wd";
import strings from "../../src/i18n/locales/en.json";

const os = require("os");
const path = require("path");

PLATFORM = "iOS";
// PLATFORM = "Android";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
const PORT = 4723;
let config = {};
let screen_x;
let screen_y;

if (PLATFORM == "iOS") {
  config = {
    platformName: "iOS",
    platformVersion: "12.2",
    deviceName: "iPhone 8",
    app: path.join(
      os.homedir(),
      "Library/Developer/Xcode/DerivedData/fluathome/Build/Products/Debug-iphonesimulator/fluathome.app"
    ),
  };
  screen_x = 375;
  screen_y = 665;
} else {
  config = {
    platformName: "Android",
    platformVersion: "9",
    deviceName: "Android Emulator",
    app: path.join(
      os.homedir(),
      "audere/FluStudy_us/android/app/build/outputs/apk/devKernel/debug/app-devKernel-x86-debug.apk"
    ),
    automationName: "UiAutomator2",
  };
  screen_x = 1435;
  screen_y = 2375;
}
const driver = wd.promiseChainRemote("localhost", PORT);
const CONTINUE = strings.common.button.continue.toUpperCase();

describe("Rejection Scenarios", () => {
  beforeEach(async () => {
    await driver.init(config);
    await driver.setImplicitWaitTimeout(10000);
  });

  afterEach(async () => {
    await driver.quit();
  });

  test("When user is under 18, they are rejected from the study", async () => {
    expect(
      await driver.hasElementByAccessibilityId(strings.welcomeScreen.welcome)
    ).toBe(true);
    await change_to_demo_mode(driver);
    await welcome_to_age(driver);
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyButton.under18)
    ).toBe(true);
    await driver.elementByAccessibilityId(strings.surveyButton.under18).click();
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.ageIneligibleScreen.ineligible
      )
    ).toBe(true);
  });

  test("When user has only symptom of cough, they are rejected from the study", async () => {
    expect(
      await driver.hasElementByAccessibilityId(strings.welcomeScreen.welcome)
    ).toBe(true);
    await change_to_demo_mode(driver);
    await welcome_to_age(driver);
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyButton["18to24"])
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.surveyButton["18to24"])
      .click();
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyTitle.symptomTitle)
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyDescription.cough)
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.surveyDescription.cough)
      .click();
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.symptomsIneligibleScreen.ineligible
      )
    ).toBe(true);
  });
});

describe("Happy Path", () => {
  beforeEach(async () => {
    await driver.init(config);
    await driver.setImplicitWaitTimeout(10000);
  });

  afterEach(async () => {
    await driver.quit();
  });

  test("A user should be able to navigate through the entire app", async () => {
    expect(
      await driver.hasElementByAccessibilityId(strings.welcomeScreen.welcome)
    ).toBe(true);
    await change_to_demo_mode(driver);
    await welcome_to_age(driver);
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyButton["25to34"])
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.surveyButton["25to34"])
      .click();
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyTitle.symptomTitle)
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyDescription.cough)
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(
        strings.surveyDescription.feelingFeverish
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.surveyDescription.cough)
      .click();
    await driver
      .elementByAccessibilityId(strings.surveyDescription.feelingFeverish)
      .click();
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.preConsentScreen.title)
    ).toBe(true);
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.consentScreen.consent)
    ).toBe(true);
    await scroll_to_element(driver, strings.consentScreen.accept.toUpperCase());
    expect(
      await driver.hasElementByAccessibilityId(
        strings.consentScreen.accept.toUpperCase()
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.consentScreen.accept.toUpperCase())
      .click();
    expect(
      await driver.hasElementByAccessibilityId(strings.addressScreen.title)
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(strings.addressInput.firstName)
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.addressInput.firstName)
      .click();
    await driver
      .elementByAccessibilityId(strings.addressInput.firstName)
      .type("Emily");
    expect(
      await driver.hasElementByAccessibilityId(strings.addressInput.lastName)
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.addressInput.lastName)
      .type("Smith");
    expect(
      await driver.hasElementByAccessibilityId(
        strings.addressInput.streetAddress
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.addressInput.streetAddress)
      .type("123 Sesame St.");
    expect(
      await driver.hasElementByAccessibilityId(strings.addressInput.city)
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.addressInput.city)
      .type("Seattle");
    expect(
      await driver.hasElementByAccessibilityId(strings.addressInput.state)
    ).toBe(true);
    await driver.elementByAccessibilityId(strings.addressInput.state).click();
    await driver.elementByAccessibilityId(strings.common.button.done).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.addressInput.zipcode)
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.addressInput.zipcode)
      .type("98103");
    if (PLATFORM == "iOS") {
      await driver.elementByAccessibilityId(strings.common.button.done).click();
    } else {
      await driver.hideDeviceKeyboard();
    }
    expect(
      await driver.hasElementByAccessibilityId(
        strings.common.placeholder.emailEx
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.common.placeholder.emailEx)
      .type("emily@auderenow.org");
    await driver.hideDeviceKeyboard();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.common.button.submit.toUpperCase()
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.common.button.submit.toUpperCase())
      .click();
    expect(
      await driver.hasElementByAccessibilityId(strings.kitOrderedScreen.title)
    ).toBe(true);
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.thankYouScreeningScreen.title
      )
    ).toBe(true);
    await quad_tap_banner(driver);
    expect(
      await driver.hasElementByAccessibilityId(
        strings.welcomeBackScreen.welcomeBack
      )
    ).toBe(true);
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.whatsNextScreen.whatsNext
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.scanInstructionsScreen.scanQrCode
      )
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(
        strings.scanInstructionsScreen.inputManually
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.scanInstructionsScreen.inputManually)
      .click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.manualEntryScreen.enterKit
      )
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(
        strings.manualEntryScreen.placeholder
      )
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(
        strings.manualEntryScreen.secondPlaceholder
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.manualEntryScreen.placeholder)
      .type("aaaaaaaa");
    await driver
      .elementByAccessibilityId(strings.manualEntryScreen.secondPlaceholder)
      .type("aaaaaaaa");
    if (PLATFORM == "iOS") {
      await driver.elementByAccessibilityId(strings.common.button.done).click();
    } else {
      await driver.hideDeviceKeyboard();
    }
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.manualConfirmationScreen.codeSent
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.testInstructionsScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.swabScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.swabPrepScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.openSwabScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.mucusScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.swabInTubeScreen.title)
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(
        strings.swabInTubeScreen.startTimer.toUpperCase()
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(
        strings.swabInTubeScreen.startTimer.toUpperCase()
      )
      .click();
    expect(
      await driver.hasElementByAccessibilityId(strings.firstTimerScreen.title)
    ).toBe(true);
    if (PLATFORM == "iOS") {
      expect(
        await driver.hasElementByAccessibilityId(strings.common.button.no)
      ).toBe(true);
      await driver.elementByAccessibilityId(strings.common.button.no).click();
    }
    await driver
      .elementByAccessibilityId(strings.firstTimerScreen.title)
      .click();
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.removeSwabFromTubeScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.openTestStripScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.stripInTubeScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyScreen.title)
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyOption.cough)
    ).toBe(true);
    await driver.elementByAccessibilityId(strings.surveyOption.cough).click();
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyScreen.title)
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyButton["1day"])
    ).toBe(true);
    await driver.elementByAccessibilityId(strings.surveyButton["1day"]).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyButton.no)
    ).toBe(true);
    await driver.elementByAccessibilityId(strings.surveyButton.no).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyButton.mild)
    ).toBe(true);
    await driver.elementByAccessibilityId(strings.surveyButton.mild).click();
    await scroll_to_element(driver, CONTINUE);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.surveyScreen.generalExposure
      )
    ).toBe(true);
    await scroll_to_element(driver, CONTINUE);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.surveyScreen.generalHealth
      )
    ).toBe(true);
    await scroll_to_element(driver, CONTINUE);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.surveyButton.no)
    ).toBe(true);
    if (PLATFORM == "iOS") {
      let noButton = await driver.elementsByAccessibilityId(
        strings.surveyButton.no
      );
      await noButton[4].click();
    } else {
      await new wd.TouchAction(driver).wait(1000).perform(); //wait for scroll to finish
      expect(
        await driver.hasElementByAccessibilityId(strings.surveyButton.no)
      ).toBe(true);
      await driver.elementByAccessibilityId(strings.surveyButton.no).click();
    }
    await scroll_to_element(driver, CONTINUE);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.thankYouSurveyScreen.title
      )
    ).toBe(true);
    if (PLATFORM == "iOS") {
      expect(
        await driver.hasElementByAccessibilityId(strings.common.button.no)
      ).toBe(true);
      await driver.elementByAccessibilityId(strings.common.button.no).click();
    }
    await driver
      .elementByAccessibilityId(strings.thankYouSurveyScreen.title)
      .click();
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.testStripReadyScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.finishTubeScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.lookAtStripScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.testStripSurveyScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    if (PLATFORM == "iOS") {
      //camera not available in android simulator
      expect(
        await driver.hasElementByAccessibilityId(
          strings.pictureInstructionsScreen.title
        )
      ).toBe(true);
      expect(
        await driver.hasElementByAccessibilityId(
          strings.pictureInstructionsScreen.skip
        )
      ).toBe(true);
      await scroll_to_element(driver, strings.pictureInstructionsScreen.skip);
      await driver
        .elementByAccessibilityId(strings.pictureInstructionsScreen.skip)
        .click();
    }
    expect(
      await driver.hasElementByAccessibilityId(
        strings.cleanFirstTestScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.cleanFirstTest2Screen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.firstTestFeedbackScreen.title
      )
    ).toBe(true);
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.beginSecondTestScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.prepSecondTestScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.mucusSecondScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.swabInTubeSecondScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.cleanSecondTestScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.secondTestFeedbackScreen.title
      )
    ).toBe(true);
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.packingScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.stickersScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.secondBagScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.tapeBoxScreen.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.shipBoxScreen.title)
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(
        strings.shipBoxScreen.iWillDropOff.toUpperCase()
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(
        strings.shipBoxScreen.iWillDropOff.toUpperCase()
      )
      .click();
    expect(
      await driver.hasElementByAccessibilityId(strings.emailOptInScreen.title)
    ).toBe(true);
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.thanksScreen.title)
    ).toBe(true);
  });
});

async function welcome_to_age(driver) {
  expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
  await driver.elementByAccessibilityId(CONTINUE).click();
  expect(await driver.hasElementByAccessibilityId(strings.whyScreen.why)).toBe(
    true
  );
  expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
  await driver.elementByAccessibilityId(CONTINUE).click();
  expect(
    await driver.hasElementByAccessibilityId(strings.whatScreen.what)
  ).toBe(true);
  await scroll_to_element(driver, CONTINUE);
  expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
  await driver.elementByAccessibilityId(CONTINUE).click();
  expect(
    await driver.hasElementByAccessibilityId(strings.surveyTitle.ageTitle)
  ).toBe(true);
}

async function change_to_demo_mode(driver) {
  expect(await driver.hasElementByAccessibilityId("flu@home")).toBe(true);
  await new wd.TouchAction(driver)
    .tap({ x: screen_x * 0.95, y: screen_y * 0.06 })
    .perform();
  expect(await driver.hasElementByAccessibilityId(strings.Version.title)).toBe(
    true
  );
  await driver.elementByAccessibilityId(strings.Version.title).click();
  expect(
    await driver.hasElementByAccessibilityId(strings.common.menu.help)
  ).toBe(true);
  await demo_triple_tap(driver);
  expect(await driver.hasElementByAccessibilityId("Demo Mode")).toBe(true);
  await new wd.TouchAction(driver)
    .tap({ x: screen_x * 0.05, y: screen_y * 0.06 })
    .perform();
}

async function quad_tap_banner(driver) {
  if (PLATFORM == "iOS") {
    await new wd.TouchAction(driver)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.06 })
      .wait(20)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.06 })
      .wait(20)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.06 })
      .wait(20)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.06 })
      .perform();
  } else {
    await new wd.TouchAction(driver)
      .wait(500)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.06 })
      .tap({ x: screen_x * 0.5, y: screen_y * 0.06 })
      .tap({ x: screen_x * 0.5, y: screen_y * 0.06 })
      .tap({ x: screen_x * 0.5, y: screen_y * 0.06 })
      .perform();
  }
}

async function demo_triple_tap(driver) {
  if (PLATFORM == "iOS") {
    await new wd.TouchAction(driver)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.13 })
      .wait(15)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.13 })
      .wait(15)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.13 })
      .perform();
  } else {
    await new wd.TouchAction(driver)
      .wait(500)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.13 })
      .tap({ x: screen_x * 0.5, y: screen_y * 0.13 })
      .tap({ x: screen_x * 0.5, y: screen_y * 0.13 })
      .perform();
  }
}

async function swipe_up(driver) {
  if (PLATFORM == "iOS") {
    await driver.execute("mobile: swipe", { direction: "up" });
  } else {
    await new wd.TouchAction(driver)
      .press({ x: screen_x * 0.5, y: screen_y * 0.9 })
      .wait(2000)
      .moveTo({ x: screen_x * 0.5, y: screen_y * 0.1 })
      .release()
      .perform();
  }
}

async function scroll_to_element(driver, element) {
  if (PLATFORM == "iOS") {
    await driver.execute("mobile: scroll", { name: element });
  } else {
    await driver.setImplicitWaitTimeout(100);
    let scroll = new wd.TouchAction(driver)
      .press({ x: screen_x * 0.5, y: screen_y * 0.9 })
      .wait(2000)
      .moveTo({ x: screen_x * 0.5, y: screen_y * 0.1 })
      .release();
    await scroll.perform();
    while (!(await driver.hasElementByAccessibilityId(element))) {
      await scroll.perform();
    }
    await driver.setImplicitWaitTimeout(10000);
  }
}
