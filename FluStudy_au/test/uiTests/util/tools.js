// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import wd from "wd";
import strings from "../../../src/i18n/locales/en.json";
import { multi_tap } from "./navigation";
import { Op } from "sequelize";
import axios from "axios";

//Go to version menu, change to demo mode (if specified), return installation id
export async function app_setup_for_automation(driver, deviceInfo, isDemo) {
  expect(await driver.hasElementByAccessibilityId("flu@home")).toBe(true);
  await new wd.TouchAction(driver)
    .tap({ x: deviceInfo.SCREEN_X * 0.95, y: deviceInfo.SCREEN_Y * 0.06 })
    .perform();
  expect(await driver.hasElementByAccessibilityId(strings.Version.title)).toBe(
    true
  );
  await driver.elementByAccessibilityId(strings.Version.title).click();
  expect(
    await driver.hasElementByAccessibilityId(strings.Version.description)
  ).toBe(true);
  if (isDemo) {
    await multi_tap(
      driver,
      deviceInfo,
      deviceInfo.SCREEN_X * 0.5,
      deviceInfo.SCREEN_Y * 0.13,
      3
    );
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
    .tap({ x: deviceInfo.SCREEN_X * 0.05, y: deviceInfo.SCREEN_Y * 0.06 })
    .perform();
  if (isDemo) {
    expect(await driver.hasElementByAccessibilityId("Demo Mode")).toBe(true);
  }
  return installation[1];
}

//Display stats from previous RDT capture
export async function display_rdt_stats(driver, models, installationId) {
  await driver.sleep(5000); // Let firestore sync
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
  if ("rdtReaderResult" in dbRow.survey.rdtInfo) {
    console.log(dbRow.survey.rdtInfo);
  }
}
