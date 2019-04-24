import wd from "wd";

const os = require("os");
const path = require("path");

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
const PORT = 4723;
const config = {
  platformName: "iOS",
  platformVersion: "12.2",
  deviceName: "iPhone 8",
  app: path.join(
    os.homedir(),
    "Library/Developer/Xcode/DerivedData/fluathome/Build/Products/Debug-iphonesimulator/fluathome.app"
  ),
};
const driver = wd.promiseChainRemote("localhost", PORT);

describe("Rejection Scenarios", () => {
  beforeEach(async () => {
    await driver.init(config);
    await driver.setImplicitWaitTimeout(10000);
  });

  afterEach(async () => {
    await driver.quit();
  });

  test("When user is under 18, they are rejected from the study", async () => {
    expect(await driver.hasElementByAccessibilityId("Welcome")).toBe(true);
    await change_to_demo_mode(driver);
    await welcome_to_age(driver);
    expect(await driver.hasElementByAccessibilityId("17 and under")).toBe(true);
    await driver.elementByAccessibilityId("17 and under").click();
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Thanks for your interest")
    ).toBe(true);
  });

  test("When user has only symptom of cough, they are rejected from the study", async () => {
    expect(await driver.hasElementByAccessibilityId("Welcome")).toBe(true);
    await change_to_demo_mode(driver);
    await welcome_to_age(driver);
    expect(await driver.hasElementByAccessibilityId("18 to 24")).toBe(true);
    await driver.elementByAccessibilityId("18 to 24").click();
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Describe your symptoms")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("Cough")).toBe(true);
    await driver.elementByAccessibilityId("Cough").click();
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Thanks for your interest")
    ).toBe(true);
  });
});

async function welcome_to_age(driver) {
  expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
  await driver.elementByAccessibilityId("CONTINUE").click();
  expect(await driver.hasElementByAccessibilityId("Why this study?")).toBe(
    true
  );
  expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
  await driver.elementByAccessibilityId("CONTINUE").click();
  expect(await driver.hasElementByAccessibilityId("Getting started")).toBe(
    true
  );
  await driver.execute("mobile: scroll", { name: "CONTINUE" });
  expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
  await driver.elementByAccessibilityId("CONTINUE").click();
  expect(await driver.hasElementByAccessibilityId("How old are you?")).toBe(
    true
  );
}

async function change_to_demo_mode(driver) {
  await driver.execute("mobile: tap", { x: 350, y: 40 });
  expect(await driver.hasElementByAccessibilityId("General Questions")).toBe(
    true
  );
  await driver.elementByAccessibilityId("General Questions").click();
  let tapBanner = new wd.TouchAction(driver);
  tapBanner.tap({ x: 150, y: 90 });
  tapBanner.wait(10);
  tapBanner.tap({ x: 150, y: 90 });
  tapBanner.wait(10);
  tapBanner.tap({ x: 150, y: 90 });
  tapBanner.perform();
  await driver.execute("mobile: tap", { x: 25, y: 40 });
}
