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

describe("Happy Path", () => {
  beforeEach(async () => {
    await driver.init(config);
    await driver.setImplicitWaitTimeout(10000);
  });

  afterEach(async () => {
    await driver.quit();
  });

  test("A user should be able to navigate through the entire app", async () => {
    expect(await driver.hasElementByAccessibilityId("Welcome")).toBe(true);
    await change_to_demo_mode(driver);
    await welcome_to_age(driver);
    expect(await driver.hasElementByAccessibilityId("25 to 34")).toBe(true);
    await driver.elementByAccessibilityId("25 to 34").click();
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Describe your symptoms")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("Cough")).toBe(true);
    expect(await driver.hasElementByAccessibilityId("Fever")).toBe(true);
    await driver.elementByAccessibilityId("Cough").click();
    await driver.elementByAccessibilityId("Fever").click();
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Consent to join the study")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.execute("mobile: swipe", { direction: "up" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Consent form")).toBe(true);
    expect(await driver.hasElementByAccessibilityId("I CONSENT")).toBe(true);
    for (i = 0; i < 7; i++) {
      await driver.execute("mobile: swipe", { direction: "up" });
    }
    await driver.elementByAccessibilityId("I CONSENT").click();
    expect(await driver.hasElementByAccessibilityId("Email and Address")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("First Name")).toBe(true);
    expect(await driver.hasElementByAccessibilityId("Last Name")).toBe(true);
    expect(await driver.hasElementByAccessibilityId("Street Address")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("City")).toBe(true);
    expect(await driver.hasElementByAccessibilityId("State")).toBe(true);
    expect(await driver.hasElementByAccessibilityId("Zip Code")).toBe(true);
    expect(await driver.hasElementByAccessibilityId("e.g. joe@gmail.com")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("SUBMIT")).toBe(true);
    await driver.elementByAccessibilityId("First Name").click();
    await driver.elementByAccessibilityId("First Name").type("Emily");
    await driver.elementByAccessibilityId("Last Name").type("Smith");
    await driver
      .elementByAccessibilityId("Street Address")
      .type("123 Sesame St.");
    await driver.elementByAccessibilityId("City").type("Seattle");
    await driver.elementByAccessibilityId("State").click();
    await driver.elementByAccessibilityId("Done").click();
    await driver.elementByAccessibilityId("Zip Code").type("98103");
    await driver.elementByAccessibilityId("Done").click();
    await driver
      .elementByAccessibilityId("e.g. joe@gmail.com")
      .type("emily@auderenow.org");
    await driver.hideDeviceKeyboard();
    await driver.elementByAccessibilityId("SUBMIT").click();
    expect(
      await driver.hasElementByAccessibilityId("Your kit was ordered.")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.execute("mobile: swipe", { direction: "up" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Thanks for participating!")
    ).toBe(true);
    let goToPart2 = new wd.TouchAction(driver);
    goToPart2.tap({ x: 180, y: 40 });
    goToPart2.wait(20);
    goToPart2.tap({ x: 180, y: 40 });
    goToPart2.wait(20);
    goToPart2.tap({ x: 180, y: 40 });
    goToPart2.wait(20);
    goToPart2.tap({ x: 180, y: 40 });
    await goToPart2.perform();
    expect(await driver.hasElementByAccessibilityId("How the test works")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.execute("mobile: swipe", { direction: "up" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Preparing for the test")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Scan the barcode")).toBe(
      true
    );
    expect(
      await driver.hasElementByAccessibilityId("Enter barcode manually")
    ).toBe(true);
    await driver.elementByAccessibilityId("Enter barcode manually").click();
    expect(
      await driver.hasElementByAccessibilityId("Enter barcode manually")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("Enter barcode")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("Confirm barcode")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("Enter barcode").type("aaaaaaaa");
    await driver.elementByAccessibilityId("Confirm barcode").type("aaaaaaaa");
    await driver.elementByAccessibilityId("Done").click();
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Your code was accepted")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("How the test works")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Begin the first test")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Prepare tube")).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Open nasal swab")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Collect sample from nose")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Put swab in tube")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("START TIMER")).toBe(true);
    await driver.elementByAccessibilityId("START TIMER").click();
    expect(await driver.hasElementByAccessibilityId("Did you know?")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("No")).toBe(true);
    await driver.elementByAccessibilityId("No").click();
    await driver.elementByAccessibilityId("Did you know?").click();
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Remove swab from tube")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Open test strip")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Put test strip in tube")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Symptom Survey")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("Cough")).toBe(true);
    await driver.elementByAccessibilityId("Cough").click();
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.execute("mobile: swipe", { direction: "up" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Symptom Survey")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("1 day")).toBe(true);
    await driver.elementByAccessibilityId("1 day").click();
    expect(await driver.hasElementByAccessibilityId("No")).toBe(true);
    await driver.elementByAccessibilityId("No").click();
    expect(await driver.hasElementByAccessibilityId("Mild")).toBe(true);
    await driver.elementByAccessibilityId("Mild").click();
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.execute("mobile: scroll", { name: "CONTINUE" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("General Exposure")).toBe(
      true
    );
    await driver.execute("mobile: scroll", { name: "CONTINUE" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("General Health")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.execute("mobile: scroll", { name: "CONTINUE" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("No")).toBe(true);
    let noButton = await driver.elementsByAccessibilityId("No");
    noButton[4].click();
    await driver.execute("mobile: scroll", { name: "CONTINUE" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Thank you!")).toBe(true);
    expect(await driver.hasElementByAccessibilityId("No")).toBe(true);
    await driver.elementByAccessibilityId("No").click();
    await driver.elementByAccessibilityId("Thank you!").click();
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Remove test strip")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Finish with the tube")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Look at the test strip")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("What do you see?")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Take a photo of the strip")
    ).toBe(true);
    expect(
      await driver.hasElementByAccessibilityId(
        "Unable to take a picture? Skip this step"
      )
    ).toBe(true);
    await driver.execute("mobile: scroll", {
      name: "Unable to take a picture? Skip this step",
    });
    await driver
      .elementByAccessibilityId("Unable to take a picture? Skip this step")
      .click();
    expect(
      await driver.hasElementByAccessibilityId("Seal up the test strip")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Put test strip in bag #2")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId(
        "Nice job with the first test! One more to go."
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.execute("mobile: swipe", { direction: "up" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Begin the second test")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Prepare for the test")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Collect sample from nose")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Put swab in tube")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Clean up the second test")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId(
        "Nice job with the second (and final) test!"
      )
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.execute("mobile: swipe", { direction: "up" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Packing things up")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Put stickers on the box")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(
      await driver.hasElementByAccessibilityId("Put bag  in the box")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Tape up the box")).toBe(
      true
    );
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Shipping your box")).toBe(
      true
    );
    expect(
      await driver.hasElementByAccessibilityId("I HAVE A DROP-OFF LOCATION")
    ).toBe(true);
    await driver.elementByAccessibilityId("I HAVE A DROP-OFF LOCATION").click();
    expect(
      await driver.hasElementByAccessibilityId("Opt-in for messages")
    ).toBe(true);
    expect(await driver.hasElementByAccessibilityId("CONTINUE")).toBe(true);
    await driver.execute("mobile: swipe", { direction: "up" });
    await driver.elementByAccessibilityId("CONTINUE").click();
    expect(await driver.hasElementByAccessibilityId("Thank you!")).toBe(true);
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
  tapBanner.wait(15);
  tapBanner.tap({ x: 150, y: 90 });
  tapBanner.wait(15);
  tapBanner.tap({ x: 150, y: 90 });
  await tapBanner.perform();
  expect(await driver.hasElementByAccessibilityId("Demo Mode")).toBe(true);
  await driver.execute("mobile: tap", { x: 25, y: 40 });
}
