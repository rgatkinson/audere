// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import "react-native";
import React from "react";
import App from "../App";
import { AppLoading, Font } from "expo";

import renderer from "react-test-renderer";

jest.mock("react-native-device-info", () => {
  return { isTablet: jest.fn(), isEmulator: jest.fn() };
});

jest.mock("redux-persist/integration/react", () => ({
  PersistGate: (props: any) => props.children,
}));

it("renders without crashing", () => {
  const rendered = renderer.create(<App />);
  expect(rendered).toBeTruthy();
  rendered.unmount();
});
