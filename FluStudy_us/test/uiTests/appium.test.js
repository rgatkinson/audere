// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import wd from "wd";
import strings from "../../src/i18n/locales/en.json";
import { PassThrough } from "stream";

const os = require("os");
const path = require("path");

// PLATFORM = "iOS";
PLATFORM = "Android";

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
      "Library/Developer/Xcode/DerivedData/fluathome_us/Build/Products/Debug-iphonesimulator/fluathome.app"
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
      await driver.hasElementByAccessibilityId(strings.Welcome.title)
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
      await driver.hasElementByAccessibilityId(strings.AgeIneligible.title)
    ).toBe(true);
  });

  test("When user has only symptom of cough, they are rejected from the study", async () => {
    expect(
      await driver.hasElementByAccessibilityId(strings.Welcome.title)
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
      await driver.hasElementByAccessibilityId(strings.SymptomsIneligible.title)
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
      await driver.hasElementByAccessibilityId(strings.Welcome.title)
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
      await driver.hasElementByAccessibilityId(strings.PreConsent.title)
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
    await driver.hideDeviceKeyboard();
    await new wd.TouchAction(driver)
      .tap({ x: screen_x * 0.12, y: screen_y * 0.59 })
      .wait(1000)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.5 })
      .perform();
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
      await driver.hasElementByAccessibilityId(strings.KitOrdered.title)
    ).toBe(true);
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.ThankYouScreening.title)
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
      await driver.hasElementByAccessibilityId(strings.WhatsNext.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(
        strings.scanInstructionsScreen.scanQrCode
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    if (PLATFORM == "iOS") {
      expect(await driver.hasElementByAccessibilityId("OK")).toBe(true);
      await driver.elementByAccessibilityId("OK").click();
      expect(
        await driver.hasElementByAccessibilityId(
          strings.scanScreen.enterManually
        )
      ).toBe(true);
      await new wd.TouchAction(driver)
        .tap({ x: screen_x * 0.5, y: screen_y * 0.82 })
        .perform();
    } else {
      denyButton = await driver.element(
        "id",
        "com.android.packageinstaller:id/permission_deny_button"
      );
      await denyButton.click();
    }
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
      await driver.hasElementByAccessibilityId(strings.ManualConfirmation.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.TestInstructions.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(await driver.hasElementByAccessibilityId(strings.Swab.title)).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.SwabPrep.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.OpenSwab.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(await driver.hasElementByAccessibilityId(strings.Mucus.title)).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.SwabInTube.title)
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(
        strings.SwabInTube.buttonLabel.toUpperCase()
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.SwabInTube.buttonLabel.toUpperCase())
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
      await driver.hasElementByAccessibilityId(strings.RemoveSwabFromTube.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.OpenTestStrip.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.StripInTube.title)
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
      await driver.hasElementByAccessibilityId(strings.GeneralHealth.title)
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
      await driver.hasElementByAccessibilityId(strings.TestStripReady.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.FinishTube.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.LookAtStrip.title)
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
    expect(
      await driver.hasElementByAccessibilityId(strings.RDTInstructions.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    if (PLATFORM == "iOS") {
      expect(
        await driver.hasElementByAccessibilityId(strings.RDTReader.title)
      ).toBe(true);
      await new wd.TouchAction(driver)
        .tap({ x: screen_x * 0.5, y: screen_y * 0.92 })
        .perform();
    } else {
      allowButton = await driver.element(
        "id",
        "com.android.packageinstaller:id/permission_allow_button"
      );
      await allowButton.click();
      expect(
        await driver.hasElementByAccessibilityId(strings.RDTReader.title)
      ).toBe(true);
      await new wd.TouchAction(driver)
        .tap({ x: screen_x * 0.5, y: screen_y * 0.92 })
        .perform();
    }
    expect(
      await driver.hasElementByAccessibilityId(
        strings.testStripConfirmationScreen.title
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.CleanFirstTest.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.CleanFirstTest2.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.FirstTestFeedback.title)
    ).toBe(true);
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.BeginSecondTest.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.PrepSecondTest.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.MucusSecond.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.SwabInTubeSecond.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.CleanSecondTest.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.SecondTestFeedback.title)
    ).toBe(true);
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.Packing.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.Stickers.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.SecondBag.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.TapeBox.title)
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(
      await driver.hasElementByAccessibilityId(strings.ShipBox.title)
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(
        strings.ShipBox.iWillDropOff.toUpperCase()
      )
    ).toBe(true);
    await driver
      .elementByAccessibilityId(strings.ShipBox.iWillDropOff.toUpperCase())
      .click();
    expect(
      await driver.hasElementByAccessibilityId(strings.emailOptInScreen.title)
    ).toBe(true);
    await swipe_up(driver);
    expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
    await driver.elementByAccessibilityId(CONTINUE).click();
    expect(await driver.hasElementByAccessibilityId(strings.Thanks.title)).toBe(
      true
    );
  });
});

async function welcome_to_age(driver) {
  expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
  await driver.elementByAccessibilityId(CONTINUE).click();
  expect(
    await driver.hasElementByAccessibilityId(strings.whyScreen.title)
  ).toBe(true);
  expect(await driver.hasElementByAccessibilityId(CONTINUE)).toBe(true);
  await driver.elementByAccessibilityId(CONTINUE).click();
  expect(await driver.hasElementByAccessibilityId(strings.What.title)).toBe(
    true
  );
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
