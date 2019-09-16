// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import wd from "wd";

//Tap a specific spot on the screen multiple times
export async function multi_tap(
  driver,
  deviceInfo,
  x_coord,
  y_coord,
  num_taps
) {
  let taps = new wd.TouchAction(driver);
  if (deviceInfo.PLATFORM == "iOS") {
    for (let i = 0; i < num_taps; i++) {
      taps.tap({ x: x_coord, y: y_coord });
      taps.wait(15);
    }
  } else {
    taps.wait(500);
    for (let i = 0; i < num_taps; i++) {
      taps.tap({ x: x_coord, y: y_coord });
      taps.wait(5);
    }
  }
  await taps.perform();
}

//Scroll down the screen until the requested element is visible
//Return y-coordinate of new location of element
export async function scroll_to_element(driver, deviceInfo, element) {
  if (deviceInfo.PLATFORM == "iOS") {
    let elementLocation = await get_element_location(
      driver,
      deviceInfo,
      element
    );
    while (elementLocation.y > deviceInfo.SCREEN_Y * 0.95) {
      await driver.execute("mobile: swipe", { direction: "up" });
      elementLocation = await get_element_location(driver, deviceInfo, element);
    }
    return elementLocation.y;
  } else {
    await driver.setImplicitWaitTimeout(500);
    while (!(await driver.hasElementByAccessibilityId(element))) {
      await full_scroll(driver, deviceInfo);
    }
    await driver.setImplicitWaitTimeout(10000);
    return (await get_element_location(driver, deviceInfo, element)).y;
  }
}

//Return coordinates of element
export async function get_element_location(driver, deviceInfo, element) {
  if (deviceInfo.PLATFORM == "iOS") {
    await driver.setImplicitWaitTimeout(500);
    const found = await driver.hasElement(
      "-ios predicate string",
      `name BEGINSWITH '${element.slice(0, 127)}'`
    );
    await driver.setImplicitWaitTimeout(10000);
    if (found) {
      return await driver
        .element(
          "-ios predicate string",
          `name BEGINSWITH '${element.slice(0, 127)}'`
        )
        .getLocation();
    }
  } else {
    if (await driver.hasElementByAccessibilityId(element)) {
      return await driver.elementByAccessibilityId(element).getLocation();
    }
  }
}

//Scroll through the whole page
export async function full_scroll(driver, deviceInfo) {
  if (deviceInfo.PLATFORM == "iOS") {
    await driver.execute("mobile: scroll", { direction: "down" });
  } else {
    let scroll = new wd.TouchAction(driver)
      .press({
        x: Math.trunc(deviceInfo.SCREEN_X * 0.99),
        y: Math.trunc(deviceInfo.SCREEN_Y * 0.9),
      })
      .wait(2000)
      .moveTo({
        x: Math.trunc(deviceInfo.SCREEN_X * 0.99),
        y: Math.trunc(deviceInfo.SCREEN_Y * 0.1),
      })
      .release();
    await scroll.perform();
  }
}

//Scroll through the approximately half the screen
export async function half_scroll(driver, deviceInfo) {
  if (deviceInfo.PLATFORM == "iOS") {
    await driver.execute("mobile: dragFromToForDuration", {
      duration: 0.5,
      fromX: Math.trunc(deviceInfo.SCREEN_X * 0.99),
      fromY: Math.trunc(deviceInfo.SCREEN_Y * 0.3),
      toX: Math.trunc(deviceInfo.SCREEN_X * 0.99),
      toY: Math.trunc(deviceInfo.SCREEN_Y * 0.1),
    });
  } else {
    let scroll = new wd.TouchAction(driver)
      .press({
        x: Math.trunc(deviceInfo.SCREEN_X * 0.99),
        y: Math.trunc(deviceInfo.SCREEN_Y * 0.7),
      })
      .wait(2000)
      .moveTo({
        x: Math.trunc(deviceInfo.SCREEN_X * 0.99),
        y: Math.trunc(deviceInfo.SCREEN_Y * 0.3),
      })
      .release();
    await scroll.perform();
  }
}
