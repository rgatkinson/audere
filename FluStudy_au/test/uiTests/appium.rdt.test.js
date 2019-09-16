// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import wd from "wd";
import strings from "../../src/i18n/locales/en.json";
import { createSplitSql } from "../../../FluApi/src/util/sql";
import { defineCoughModels } from "../../../FluApi/src/models/db/cough";
import {
  multi_tap,
  scroll_to_element,
  get_element_location,
  full_scroll,
  half_scroll,
} from "./util/navigation";
import { app_setup_for_automation, display_rdt_stats } from "./util/tools";

const deviceInfo = require(process.env.TEST_UI_CONFIG);
const PLATFORM = deviceInfo.PLATFORM;
const screen_x = deviceInfo.SCREEN_X;
const screen_y = deviceInfo.SCREEN_Y;
const isSimulator = deviceInfo.SIMULATOR;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
const PORT = 4723;
const driver = wd.promiseChainRemote("localhost", PORT);

//test rdt reader
describe("RDT Tests", () => {
  let sql;
  let models;

  beforeAll(async done => {
    sql = createSplitSql();
    models = defineCoughModels(sql);
    done();
  });

  afterAll(async done => {
    await sql.close();
    done();
  });

  beforeEach(async () => {
    await driver.init(deviceInfo.config);
    await driver.setImplicitWaitTimeout(60000);
  });

  afterEach(async () => {
    await driver.quit();
  });

  test("RDT Reader should successfully scan or time out", async () => {
    expect(
      await driver.hasElementByAccessibilityId(strings.Welcome.title)
    ).toBe(true);
    await driver.setImplicitWaitTimeout(100000);
    await driver.sleep(1000); // let welcome animation finish
    const installationId = await app_setup_for_automation(
      driver,
      deviceInfo,
      true
    );
    expect(
      await driver.hasElementByAccessibilityId(strings.RDTInstructions.title)
    ).toBe(true);
    await driver.setImplicitWaitTimeout(10000);
    await scroll_to_element(
      driver,
      deviceInfo,
      strings.common.button.continue.toUpperCase()
    );
    await driver
      .elementByAccessibilityId(strings.common.button.continue.toUpperCase())
      .click();
    await rdt_screen(driver, models, installationId);
  });
});

async function rdt_screen(driver, models, installationId) {
  if (
    PLATFORM == "Android" &&
    (await driver.hasElement(
      "id",
      "com.android.packageinstaller:id/permission_allow_button"
    ))
  ) {
    await driver
      .element("id", "com.android.packageinstaller:id/permission_allow_button")
      .click();
  } else {
    if (
      await driver.hasElementByAccessibilityId(
        strings.common.button.ok.toUpperCase()
      )
    ) {
      await driver
        .elementByAccessibilityId(strings.common.button.ok.toUpperCase())
        .click();
    }
  }

  let manual_capture_required = true;
  startTime = new Date();
  secondsElapsed = 0;
  console.log("RDT Capture attempted");
  while (manual_capture_required && secondsElapsed <= 45 && !isSimulator) {
    if (
      await driver.hasElementByAccessibilityId(
        strings.TestStripConfirmation.title
      )
    ) {
      manual_capture_required = false;
    }
    currentTime = new Date();
    secondsElapsed = (currentTime - startTime) / 1000;
  }

  if (manual_capture_required) {
    console.log("RDT Capture FAILED");
    if (PLATFORM == "Android") {
      await driver.sleep(3000); //wait to make sure button can load
      await driver.element("id", "android:id/button1").click();
    } else {
      await driver.elementByAccessibilityId(strings.common.button.ok).click();
    }

    //prevents the tap from happening before the button appears
    await driver.sleep(2000);
    await new wd.TouchAction(driver)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.95 })
      .perform();
    await driver.sleep(5000);
  } else {
    console.log("RDT Capture Succeeded!");
    await display_rdt_stats(driver, models, installationId);
  }
}
