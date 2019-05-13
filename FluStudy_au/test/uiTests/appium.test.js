// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import wd from "wd";
import strings from "../../src/i18n/locales/en.json";
import { content } from "./fluathomeContent.js";

const deviceInfo = require(process.env.TEST_UI_CONFIG);
const PLATFORM = deviceInfo.PLATFORM;
const screen_x = deviceInfo.SCREEN_X;
const screen_y = deviceInfo.SCREEN_Y;

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
const PORT = 4723;
const driver = wd.promiseChainRemote("localhost", PORT);

//Drive through app always picking default chocies
describe("Happy Path", () => {
  beforeEach(async () => {
    await driver.init(deviceInfo.config);
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

    for (i = 0; i < content.length; i++) {
      const screen_info = content[i];
      if (screen_info.type == "basic") {
        await basic_screen(driver, screen_info);
      } else if (screen_info.type == "input") {
        await input_screen(driver, screen_info);
      } else if (screen_info.type == "camera") {
        await camera_screen(driver, screen_info);
      } else if (screen_info.type == "timer") {
        await timer_screen(driver, screen_info);
      } else if (screen_info.type == "rdt") {
        await rdt_screen(driver, screen_info);
      }
    }
  });
});

//check for screen title and click button for next page
async function basic_screen(driver, screen_info) {
  expect(await driver.hasElementByAccessibilityId(screen_info.title)).toBe(
    true
  );
  if ("button" in screen_info) {
    await scroll_to_element(driver, screen_info.button);
    await driver.elementByAccessibilityId(screen_info.button).click();
  }
}

//Check for title, enter default choices for questions, click button for next screen
async function input_screen(driver, screen_info) {
  expect(await driver.hasElementByAccessibilityId(screen_info.title)).toBe(
    true
  );
  for (const elt of screen_info.input) {
    if (elt.type == "text") {
      await driver.elementByAccessibilityId(elt.placeholder).type(elt.default);
    } else if (elt.type == "checkbox" && elt.default == "checked") {
      await driver.elementByAccessibilityId(elt.name).click();
    } else if (elt.type == "radio") {
      await scroll_to_element(driver, elt.name);
      let questionLocation = await get_element_location(driver, elt.name);
      let buttons = await driver.elementsByAccessibilityId(elt.default);
      for (const button of buttons) {
        let buttonLocation = await button.getLocation();

        //click the button underneath the question
        if (buttonLocation.y > questionLocation.y) {
          await button.click();
          break;
        }
      }
    }
  }
  if (await driver.isKeyboardShown()) {
    await driver.hideDeviceKeyboard();
  }
  await scroll_to_element(driver, screen_info.button);
  await driver.elementByAccessibilityId(screen_info.button).click();
}

//Answer camera permissions question and click link for manual barcode entry
async function camera_screen(driver, screen_info) {
  if (PLATFORM == "Android") {
    allowButton = await driver.element(
      "id",
      "com.android.packageinstaller:id/permission_deny_button"
    );
    await allowButton.click();
  } else {
    await driver
      .elementByAccessibilityId(strings.common.button.ok.toUpperCase())
      .click();
    expect(await driver.hasElementByAccessibilityId(screen_info.button)).toBe(
      true
    );
    await new wd.TouchAction(driver)
      .tap({ x: screen_x * 0.5, y: screen_y * 0.82 })
      .perform();
  }
}

//Answer camera permissions and click button to take a picture
async function rdt_screen(driver, screen_info) {
  if (PLATFORM == "Android") {
    allowButton = await driver.element(
      "id",
      "com.android.packageinstaller:id/permission_allow_button"
    );
    await allowButton.click();
  }
  expect(await driver.hasElementByAccessibilityId(screen_info.title)).toBe(
    true
  );
  if (PLATFORM == "iOS") {
    //prevents the tap from happening before the button appears
    await driver.sleep(500);
  }
  await new wd.TouchAction(driver)
    .tap({ x: screen_x * 0.5, y: screen_y * 0.92 })
    .perform();
}

//Answer push notifications question if necessary and bypass timer
async function timer_screen(driver, screen_info) {
  expect(await driver.hasElementByAccessibilityId(screen_info.title)).toBe(
    true
  );
  if (PLATFORM == "iOS") {
    await driver.elementByAccessibilityId(strings.common.button.no).click();
  }
  await driver.elementByAccessibilityId(screen_info.title).click();
  await driver.elementByAccessibilityId(screen_info.button).click();
}

//Go to version menu, change to demo mode, return to app
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

//Triple tap needed for getting into demo mode
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

//Scroll down the screen until the requested element is visible
async function scroll_to_element(driver, element) {
  if (PLATFORM == "iOS") {
    let elementLocation = await get_element_location(driver, element);
    while (elementLocation.y > screen_y * 0.95) {
      await driver.execute("mobile: swipe", { direction: "up" });
      elementLocation = await get_element_location(driver, element);
    }
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

async function get_element_location(driver, element) {
  if (PLATFORM == "iOS") {
    return await driver
      .element(
        "-ios predicate string",
        `name BEGINSWITH '${element.slice(0, 127)}'`
      )
      .getLocation();
  } else {
    return await driver.elementByAccessibilityId(element).getLocation();
  }
}
