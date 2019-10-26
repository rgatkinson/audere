// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import wd from "wd";
import strings from "../../../src/i18n/locales/en.json";
import {
  multi_tap,
  scroll_to_element,
  get_element_location,
  full_scroll,
  half_scroll,
} from "./navigation";

//Pick answer for button choice question (android)
export async function android_buttonGrid(
  driver,
  question,
  nextQuestion,
  screen_info,
  inputs,
  deviceInfo
) {
  let questionLocation = await get_element_location(
    driver,
    deviceInfo,
    question.name
  );
  let totalButtons = Array.isArray(inputs[question.name])
    ? inputs[question.name].length
    : 1;
  let numClicked = 0;
  let lastClickedY = questionLocation.y;
  let somethingLeftToClick = true;
  let nextQuestionLocation = await get_element_location(
    driver,
    deviceInfo,
    nextQuestion ? nextQuestion.name : screen_info.button.name
  );
  if (!nextQuestionLocation) {
    nextQuestionLocation = {
      x: deviceInfo.SCREEN_X,
      y: deviceInfo.SCREEN_Y + 1,
    };
  }
  while (numClicked < totalButtons) {
    while (somethingLeftToClick && numClicked < totalButtons) {
      somethingLeftToClick = false;
      const buttons = await driver.elementsByAccessibilityId(
        Array.isArray(inputs[question.name])
          ? inputs[question.name][numClicked]
          : inputs[question.name]
      );
      for (const button of buttons) {
        let buttonLocation = await button.getLocation();
        if (
          buttonLocation.y < nextQuestionLocation.y &&
          buttonLocation.y > lastClickedY &&
          buttonLocation.y < deviceInfo.SCREEN_Y
        ) {
          await button.click();
          somethingLeftToClick = true;
          numClicked++;
          lastClickedY = buttonLocation.y;
          break;
        }
      }
    }
    if (numClicked < totalButtons) {
      somethingLeftToClick = true;
      await half_scroll(driver, deviceInfo);
      nextQuestionLocation = await get_element_location(
        driver,
        deviceInfo,
        nextQuestion ? nextQuestion.name : screen_info.button.name
      );
      if (!nextQuestionLocation) {
        nextQuestionLocation = {
          x: deviceInfo.SCREEN_X,
          y: deviceInfo.SCREEN_Y + 1,
        };
      }

      buttons = await driver.elementsByAccessibilityId(
        inputs[question.name][numClicked - 1]
      );
      for (const button of buttons) {
        if ((await button.getAttribute("focused")) == "true") {
          lastClickedY = (await button.getLocation()).y;
          break;
        }
      }
    }
  }
}

//Pick answer for button choice question (ios)
export async function ios_buttonGrid(
  driver,
  question,
  nextQuestion,
  screen_info,
  inputs,
  deviceInfo
) {
  let questionLocation = await get_element_location(
    driver,
    deviceInfo,
    question.name
  );
  let totalButtons = Array.isArray(inputs[question.name])
    ? inputs[question.name].length
    : 1;
  let numClicked = 0;
  let lastClickedY = questionLocation.y;
  let nextQuestionLocation = await get_element_location(
    driver,
    deviceInfo,
    nextQuestion ? nextQuestion.name : screen_info.button.name
  );
  if (!nextQuestionLocation) {
    nextQuestionLocation = {
      x: deviceInfo.SCREEN_X,
      y: deviceInfo.SCREEN_Y + 1,
    };
  }

  while (numClicked < totalButtons) {
    const buttons = await driver.elementsByAccessibilityId(
      Array.isArray(inputs[question.name])
        ? inputs[question.name][numClicked]
        : inputs[question.name]
    );
    var lastButton;
    for (const button of buttons) {
      let buttonLocation = await button.getLocation();
      if (buttonLocation.y > deviceInfo.SCREEN_Y) {
        await full_scroll(driver, deviceInfo);
        buttonLocation = await button.getLocation();
        nextQuestionLocation = await get_element_location(
          driver,
          deviceInfo,
          nextQuestion ? nextQuestion.name : screen_info.button.name
        );
        if (!nextQuestionLocation) {
          nextQuestionLocation = {
            x: deviceInfo.SCREEN_X,
            y: deviceInfo.SCREEN_Y + 1,
          };
        }
        lastClickedY = lastButton ? (await lastButton.getLocation()).y : 0;
      }
      if (
        buttonLocation.y < nextQuestionLocation.y &&
        buttonLocation.y > lastClickedY
      ) {
        await button.click();
        numClicked++;
        lastClickedY = buttonLocation.y;
        lastButton = button;
        break;
      }
    }
  }
}

//Pick answer for select menu question (android)
export async function android_select(driver, question, inputs, deviceInfo) {
  await driver.elementByClassName("android.widget.Spinner").click();
  let foundChoice = false;
  while (!foundChoice) {
    let dropdown_items = await driver.elementsByClassName(
      "android.widget.CheckedTextView"
    );
    for (const item of dropdown_items) {
      const text = await item.text();
      if (text === inputs[question.name]) {
        item.click();
        foundChoice = true;
        break;
      }
    }
    if (!foundChoice) {
      //scroll up to see more choices
      let scroll = new wd.TouchAction(driver)
        .press({
          x: Math.trunc(deviceInfo.SCREEN_X * 0.25),
          y: Math.trunc(deviceInfo.SCREEN_Y * 0.5),
        })
        .wait(2000)
        .moveTo({
          x: Math.trunc(deviceInfo.SCREEN_X * 0.25),
          y: Math.trunc(deviceInfo.SCREEN_Y * 0.9),
        })
        .release();
      await scroll.perform();
    }
  }
}

//Pick answer for select menu question (ios)
export async function ios_select(driver, question, inputs) {
  await driver.elementByAccessibilityId(question.link + " >").click();
  const pickerWheel = await driver.elementByClassName(
    "XCUIElementTypePickerWheel"
  );
  await driver.setImplicitWaitTimeout(100);
  while (!(await driver.hasElementByAccessibilityId(inputs[question.name]))) {
    await driver.execute("mobile: selectPickerWheelValue", {
      element: pickerWheel,
      order: "previous",
      offset: 0.1,
    });
  }
  await driver.elementByAccessibilityId(strings.common.button.done).click();
  await driver.setImplicitWaitTimeout(10000);
}

//Put text into a text entry box
export async function text_entry(driver, deviceInfo, question, inputs) {
  if (question.placeholder) {
    await driver
      .elementByAccessibilityId(question.placeholder)
      .type(inputs[question.placeholder]);
    await driver.elementByAccessibilityId("Done").click();
  } else {
    if (deviceInfo.PLATFORM == "iOS") {
      await driver
        .elementByClassName("XCUIElementTypeTextField")
        .type(inputs[question.name]);
    } else {
      await driver.elementByClassName("android.widget.EditText").click();
      await driver
        .elementByClassName("android.widget.EditText")
        .type(inputs[question.name]);
    }
    await driver.hideDeviceKeyboard();
  }
}

//Choose specified checkboxes for checkbox question
export async function choose_checkboxes(driver, deviceInfo, question, inputs) {
  for (const item of question.options) {
    if (inputs[question.name].includes(item)) {
      await scroll_to_element(driver, deviceInfo, item);
      await driver.elementByAccessibilityId(item).click();
    }
  }
}

//Choose specified choice for radio button question
export async function choose_radio(driver, deviceInfo, question, inputs) {
  let questionLocation = await get_element_location(
    driver,
    deviceInfo,
    question.name
  );
  let buttons = await driver.elementsByAccessibilityId(inputs[question.name]);

  for (const button of buttons) {
    let buttonLocation = await button.getLocation();
    if (buttonLocation.y > questionLocation.y) {
      while (buttonLocation.y > deviceInfo.SCREEN_Y) {
        half_scroll(driver, deviceInfo);
        buttonLocation = await button.getLocation();
      }
      await button.click();
      break;
    }
  }
}
