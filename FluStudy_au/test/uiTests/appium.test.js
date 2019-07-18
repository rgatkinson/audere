// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import wd from "wd";
import strings from "../../src/i18n/locales/en.json";
import { content } from "./fluathomeContent.js";
import { createSplitSql } from "../../../FluApi/src/util/sql";
import { defineCoughModels } from "../../../FluApi/src/models/db/cough";
import { Op } from "sequelize";
import axios from "axios";

console.log(
  "Using test file",
  process.env.TEST_UI_INPUT ? process.env.TEST_UI_INPUT : "default.js"
);
const { inputs } = process.env.TEST_UI_INPUT
  ? require(process.env.TEST_UI_INPUT)
  : require("./testInputs/default.js");
const deviceInfo = require(process.env.TEST_UI_CONFIG);
const PLATFORM = deviceInfo.PLATFORM;
const screen_x = deviceInfo.SCREEN_X;
const screen_y = deviceInfo.SCREEN_Y;
const fs = require("fs");

jasmine.DEFAULT_TIMEOUT_INTERVAL = 6000000;
const PORT = 4723;
const driver = wd.promiseChainRemote("localhost", PORT);

//Drive through app always picking chocies specified in input file
describe("Happy Path", () => {
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

  test("A user should be able to navigate through the entire app", async () => {
    await runThroughApp(models, true);
  });

  test("Non-demo mode test", async () => {
    await runThroughApp(models, false);
  });

  test("Run through app 20 times", async () => {
    for (let ii = 0; ii < 20; ii++) {
      await runThroughApp(models, true);
      await quadruple_tap(driver, screen_x * 0.5, screen_y * 0.07);
    }
  });
});

//goes through entire app
async function runThroughApp(models, isDemo) {
  expect(await driver.hasElementByAccessibilityId(strings.Welcome.title)).toBe(
    true
  );
  await driver.setImplicitWaitTimeout(10000);
  const installationId = await app_setup_for_automation(driver, isDemo);

  let files_to_write = {};
  let screen_num = 1;

  for (const screen_info of content) {
    if (!isDemo) {
      await driver.sleep(1000); //let screen finish loading
      let screenshot = await driver.takeScreenshot();
      files_to_write[`${screen_num}_${screen_info.title}`] = screenshot;
      screen_num++;
    }
    if (screen_info.type == "basic") {
      await basic_screen(driver, screen_info);
    } else if (screen_info.type == "input") {
      await input_screen(driver, screen_info);
    } else if (screen_info.type == "timer") {
      await timer_screen(driver, screen_info, isDemo);
    } else if (screen_info.type == "rdt") {
      await rdt_screen(driver, screen_info);
    }
  }
  if (!isDemo) {
    printScreenshots(files_to_write);
  }
  await verify_db_contents(driver, models, installationId);
}

//check for screen title and click button for next page
async function basic_screen(driver, screen_info) {
  expect(await driver.hasElementByAccessibilityId(screen_info.title)).toBe(
    true
  );
  if ("button" in screen_info) {
    await scroll_to_element(driver, screen_info.button);
    await driver.elementByAccessibilityId(screen_info.button).click();
  }
  if (
    "iosPopupOnContinue" in screen_info &&
    PLATFORM == "iOS" &&
    (await driver.hasElementByAccessibilityId(screen_info.iosPopupOnContinue))
  ) {
    await driver
      .elementByAccessibilityId(screen_info.iosPopupOnContinue)
      .click();
  }
}

//Check for title, enter default choices for questions, click button for next screen
async function input_screen(driver, screen_info) {
  expect(await driver.hasElementByAccessibilityId(screen_info.title)).toBe(
    true
  );
  for (let i = 0; i < screen_info.input.length; i++) {
    const question = screen_info.input[i];
    if (question.name in inputs) {
      let questionY = await scroll_to_element(driver, question.name);
      if (questionY > screen_y * 0.6) {
        await half_scroll(driver);
      }

      if (question.type == "text") {
        await driver
          .elementByAccessibilityId(question.name)
          .type(inputs[question.name]);
      } else if (question.type == "checkbox" && question.name in inputs) {
        for (const item of question.options) {
          if (inputs[question.name].includes(item)) {
            await scroll_to_element(driver, item);
            await driver.elementByAccessibilityId(item).click();
          }
        }
      } else if (question.type == "radio" && question.name in inputs) {
        let questionLocation = await get_element_location(
          driver,
          question.name
        );
        let buttons;
        if (PLATFORM == "iOS") {
          buttons = await driver.elementsByAccessibilityId(
            inputs[question.name]
          );
        } else {
          //remove trailing ' ?' for items that have ? help option as part of ios accessibilitiy id
          buttons = await driver.elementsByAccessibilityId(
            inputs[question.name].replace(/ \?$/, "")
          );
        }

        for (const button of buttons) {
          let buttonLocation = await button.getLocation();
          if (buttonLocation.y > questionLocation.y) {
            if (buttonLocation.y > screen_y) {
              half_scroll(driver);
            }
            await button.click();
            break;
          }
        }
      } else if (question.type == "buttonGrid" && question.name in inputs) {
        const nextQuestion =
          i + 1 != screen_info.input.length ? screen_info.input[i + 1] : null;
        if (PLATFORM == "iOS") {
          await ios_buttonGrid(driver, question, nextQuestion, screen_info);
        } else {
          await android_buttonGrid(driver, question, nextQuestion, screen_info);
        }
      } else if (question.type == "select" && question.name in inputs) {
        if (PLATFORM == "iOS") {
          await ios_select(driver, question);
        } else {
          await android_select(driver, question);
        }
      }
    }
  }

  if (await driver.isKeyboardShown()) {
    if (PLATFORM == "iOS") {
      await driver.elementByAccessibilityId(strings.common.button.done).click();
    } else {
      await driver.hideDeviceKeyboard();
    }
  }
  await scroll_to_element(driver, screen_info.button);
  await driver.elementByAccessibilityId(screen_info.button).click();
}

async function android_buttonGrid(driver, question, nextQuestion, screen_info) {
  let questionLocation = await get_element_location(driver, question.name);
  let totalButtons = Array.isArray(inputs[question.name])
    ? inputs[question.name].length
    : 1;
  let numClicked = 0;
  let lastClickedY = questionLocation.y;
  let somethingLeftToClick = true;
  let nextQuestionLocation = await get_element_location(
    driver,
    nextQuestion ? nextQuestion.name : screen_info.button
  );
  if (!nextQuestionLocation) {
    nextQuestionLocation = { x: screen_x, y: screen_y + 1 };
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
          buttonLocation.y < screen_y
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
      await half_scroll(driver);
      nextQuestionLocation = await get_element_location(
        driver,
        nextQuestion ? nextQuestion.name : screen_info.button
      );
      if (!nextQuestionLocation) {
        nextQuestionLocation = { x: screen_x, y: screen_y + 1 };
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

async function ios_buttonGrid(driver, question, nextQuestion, screen_info) {
  let questionLocation = await get_element_location(driver, question.name);
  let totalButtons = Array.isArray(inputs[question.name])
    ? inputs[question.name].length
    : 1;
  let numClicked = 0;
  let lastClickedY = questionLocation.y;
  let nextQuestionLocation = await get_element_location(
    driver,
    nextQuestion ? nextQuestion.name : screen_info.button
  );
  if (!nextQuestionLocation) {
    nextQuestionLocation = { x: screen_x, y: screen_y + 1 };
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
      if (buttonLocation.y > screen_y) {
        await full_scroll(driver);
        buttonLocation = await button.getLocation();
        nextQuestionLocation = await get_element_location(
          driver,
          nextQuestion ? nextQuestion.name : screen_info.button
        );
        if (!nextQuestionLocation) {
          nextQuestionLocation = { x: screen_x, y: screen_y + 1 };
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

async function android_select(driver, question) {
  await driver.elementByClassName("android.widget.TextView").click();
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
          x: Math.trunc(screen_x * 0.5),
          y: Math.trunc(screen_y * 0.3),
        })
        .wait(2000)
        .moveTo({
          x: Math.trunc(screen_x * 0.5),
          y: Math.trunc(screen_y * 0.7),
        })
        .release();
      await scroll.perform();
    }
  }
}

async function ios_select(driver, question) {
  await driver.elementByAccessibilityId(question.link).click();
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

//Answer camera permissions and click button to take a picture
async function rdt_screen(driver, screen_info) {
  if (
    PLATFORM == "Android" &&
    (await driver.hasElement(
      "id",
      "com.android.packageinstaller:id/permission_allow_button"
    ))
  ) {
    allowButton = await driver.element(
      "id",
      "com.android.packageinstaller:id/permission_allow_button"
    );
    await allowButton.click();
    //wait to make sure button can load
    await driver.sleep(3000);
    okButton = await driver.element("id", "android:id/button1");
    await okButton.click();
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
    await driver.elementByAccessibilityId(strings.common.button.ok).click();
  }

  //prevents the tap from happening before the button appears
  await driver.sleep(500);
  await new wd.TouchAction(driver)
    .tap({ x: screen_x * 0.5, y: screen_y * 0.95 })
    .perform();
}

//Answer push notifications question if necessary and bypass timer
async function timer_screen(driver, screen_info, isDemo) {
  expect(await driver.hasElementByAccessibilityId(screen_info.title)).toBe(
    true
  );
  if (isDemo) {
    //tap until timer is bypassed
    await triple_tap(driver, screen_x * 0.5, screen_y * 0.95);
    while (!(await driver.hasElementByAccessibilityId(screen_info.button))) {
      await triple_tap(driver, screen_x * 0.5, screen_y * 0.95);
    }
  } else {
    while (!(await driver.hasElementByAccessibilityId(screen_info.button))) {
      driver.sleep(1000);
    }
  }
  await driver.elementByAccessibilityId(screen_info.button).click();
}

async function verify_db_contents(driver, models, installationId) {
  await driver.sleep(3000); // Let firestore sync
  const response = await axios.get(
    "http://localhost:3200/api/import/coughDocuments"
  );
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }

  const dbRowsAndNum = await models.survey.findAndCountAll({
    where: {
      device: {
        installation: {
          [Op.eq]: installationId,
        },
      },
    },
    order: [["id", "ASC"]],
  });

  //gets most recent row with same installationId
  const dbRow = dbRowsAndNum["rows"][dbRowsAndNum["count"] - 1];

  //verify navigation events
  const expected = content.map(item => item.dbScreenName);
  const actual = dbRow.survey.events
    .slice(1) // db has version screen before app starts
    .map(item => item.refId);
  expect(actual).toEqual(expected);

  //verify user responses
  const inputScreens = content.filter(item => "input" in item);
  inputScreens.forEach(screen => {
    const questions = screen.input.filter(
      question => "dbLocation" in question && question.name in inputs
    );
    questions.forEach(question => {
      if (
        [
          strings.surveyTitle.symptomsStart,
          strings.surveyTitle.symptomsLast48,
          strings.surveyTitle.symptomsSeverity,
        ].includes(question.name)
      ) {
        const symptoms = inputs[strings.surveyTitle.whatSymptoms];
        for (let i = 0; i < symptoms.length; i++) {
          const questionDb = dbRow.survey.responses[0].item.find(
            item => item.text === `${question.name} ${symptoms[i]}`
          );
          const answerDb =
            questionDb.answerOptions[questionDb.answer[0].valueIndex].text;
          const answerApp = Array.isArray(inputs[question.name])
            ? inputs[question.name][i]
            : inputs[question.name];
          expect(questionDb.answer).toHaveLength(1);
          expect(answerApp).toEqual(answerDb);
        }
      } else if (
        question.dbLocation === "responses" &&
        inputs[question.name] != strings.surveyButton.preferNotToSay
      ) {
        const questionDb = dbRow.survey.responses[0].item.find(item =>
          item.text.startsWith(question.name)
        );
        if (Array.isArray(inputs[question.name])) {
          expect(questionDb.answer).toHaveLength(inputs[question.name].length);
          for (answer of questionDb.answer) {
            const answerDb = questionDb.answerOptions[answer.valueIndex].text;
            expect(inputs[question.name]).toContain(answerDb);
          }
        } else {
          const answerDb =
            questionDb.answerOptions[questionDb.answer[0].valueIndex].text;
          expect(questionDb.answer).toHaveLength(1);
          //remove trailing ' ?' for items that have ? help option as part of ios accessibilitiy id
          expect(inputs[question.name].replace(/ \?$/, "")).toEqual(answerDb);
        }
      } else if (question.dbLocation === "samples") {
        expect(dbRow.survey.samples[0].code).toEqual(inputs[question.name]);
      }
    });
  });
}

//Go to version menu, change to demo mode, return installation id
async function app_setup_for_automation(driver, isDemo) {
  expect(await driver.hasElementByAccessibilityId("flu@home")).toBe(true);
  await new wd.TouchAction(driver)
    .tap({ x: screen_x * 0.95, y: screen_y * 0.06 })
    .perform();
  expect(await driver.hasElementByAccessibilityId(strings.Version.title)).toBe(
    true
  );
  await driver.elementByAccessibilityId(strings.Version.title).click();
  expect(
    await driver.hasElementByAccessibilityId(strings.Version.description)
  ).toBe(true);
  if (isDemo) {
    await triple_tap(driver, screen_x * 0.5, screen_y * 0.13);
    expect(await driver.hasElementByAccessibilityId("Demo Mode")).toBe(true);
  }
  let installation;
  while (!installation) {
    await driver
      .elementByAccessibilityId(strings.buildInfo.copy.toUpperCase())
      .click();
    const versionInfo = Buffer.from(
      await driver.getClipboard(),
      "base64"
    ).toString();
    installation = /Installation:\*\* (.*)/.exec(versionInfo);
  }

  await new wd.TouchAction(driver)
    .tap({ x: screen_x * 0.05, y: screen_y * 0.06 })
    .perform();
  if (isDemo) {
    expect(await driver.hasElementByAccessibilityId("Demo Mode")).toBe(true);
  }
  return installation[1];
}

//Triple tap needed for getting into demo mode
async function triple_tap(driver, x_coord, y_coord) {
  if (PLATFORM == "iOS") {
    await new wd.TouchAction(driver)
      .tap({ x: x_coord, y: y_coord })
      .wait(15)
      .tap({ x: x_coord, y: y_coord })
      .wait(15)
      .tap({ x: x_coord, y: y_coord })
      .perform();
  } else {
    await new wd.TouchAction(driver)
      .wait(500)
      .tap({ x: x_coord, y: y_coord })
      .tap({ x: x_coord, y: y_coord })
      .tap({ x: x_coord, y: y_coord })
      .perform();
  }
}

//Quadruple tap for resetting app
async function quadruple_tap(driver, x_coord, y_coord) {
  if (PLATFORM == "iOS") {
    await new wd.TouchAction(driver)
      .tap({ x: x_coord, y: y_coord })
      .wait(15)
      .tap({ x: x_coord, y: y_coord })
      .wait(15)
      .tap({ x: x_coord, y: y_coord })
      .wait(15)
      .tap({ x: x_coord, y: y_coord })
      .perform();
  } else {
    await new wd.TouchAction(driver)
      .wait(500)
      .tap({ x: x_coord, y: y_coord })
      .tap({ x: x_coord, y: y_coord })
      .tap({ x: x_coord, y: y_coord })
      .tap({ x: x_coord, y: y_coord })
      .perform();
  }
}

//Scroll down the screen until the requested element is visible
//Return y-coordinate of new location of element
async function scroll_to_element(driver, element) {
  if (PLATFORM == "iOS") {
    let elementLocation = await get_element_location(driver, element);
    while (elementLocation.y > screen_y * 0.95) {
      await driver.execute("mobile: swipe", { direction: "up" });
      elementLocation = await get_element_location(driver, element);
    }
    return elementLocation.y;
  } else {
    await driver.setImplicitWaitTimeout(500);
    while (!(await driver.hasElementByAccessibilityId(element))) {
      await full_scroll(driver);
    }
    await driver.setImplicitWaitTimeout(10000);
    return (await get_element_location(driver, element)).y;
  }
}

//Return coordinates of element
async function get_element_location(driver, element) {
  if (PLATFORM == "iOS") {
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
async function full_scroll(driver) {
  if (PLATFORM == "iOS") {
    await driver.execute("mobile: scroll", { direction: "down" });
  } else {
    let scroll = new wd.TouchAction(driver)
      .press({ x: Math.trunc(screen_x * 0.99), y: Math.trunc(screen_y * 0.9) })
      .wait(2000)
      .moveTo({
        x: Math.trunc(screen_x * 0.99),
        y: Math.trunc(screen_y * 0.1),
      })
      .release();
    await scroll.perform();
  }
}

//Scroll through the approximately half the screen
async function half_scroll(driver) {
  if (PLATFORM == "iOS") {
    await driver.execute("mobile: dragFromToForDuration", {
      duration: 0.5,
      fromX: Math.trunc(screen_x * 0.99),
      fromY: Math.trunc(screen_y * 0.3),
      toX: Math.trunc(screen_x * 0.99),
      toY: Math.trunc(screen_y * 0.1),
    });
  } else {
    let scroll = new wd.TouchAction(driver)
      .press({ x: Math.trunc(screen_x * 0.99), y: Math.trunc(screen_y * 0.7) })
      .wait(2000)
      .moveTo({ x: Math.trunc(screen_x * 0.99), y: Math.trunc(screen_y * 0.3) })
      .release();
    await scroll.perform();
  }
}

async function printScreenshots(files_to_write) {
  const build = fs
    .readFileSync("./android/app/version.properties", "utf8")
    .split("=")[1];
  if (!fs.existsSync("./appScreenshots")) {
    fs.mkdirSync("./appScreenshots");
  }
  if (!fs.existsSync(`./appScreenshots/Build${build}`)) {
    fs.mkdirSync(`./appScreenshots/Build${build}`);
  }
  if (
    !fs.existsSync(
      `./appScreenshots/Build${build}/${deviceInfo.config.deviceName}`
    )
  ) {
    fs.mkdirSync(
      `./appScreenshots/Build${build}/${deviceInfo.config.deviceName}`
    );
  }
  for (const f in files_to_write) {
    fs.writeFile(
      `./appScreenshots/Build${build}/${deviceInfo.config.deviceName}/${f}.png`,
      files_to_write[f],
      { encoding: "base64" },
      function(err) {
        if (err) throw err;
      }
    );
  }
}
