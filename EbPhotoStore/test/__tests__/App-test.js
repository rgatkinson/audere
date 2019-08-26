/**
 * @format
 */

import "react-native";
// Note: test renderer must be required after react-native.
import ShallowRenderer from "react-test-renderer/shallow";
import React from "react";
import App from "../../App";
import Login from "../../src/ui/Login";
import Patients from "../../src/ui/Patients";
import Details from "../../src/ui/Details";

const dummyPatients = [
  {
    id: 0,
    uuid: "string",
    patientInfo: "",
    notes: "",
    triageNotes: "",
    photoInfo: [],
    evdPositive: true,
    messageLastViewedAt: 1,
    messages: [],
    updatedAt: "04/21/2019",
  },
  {
    id: 1,
    uuid: "string",
    patientInfo: "",
    notes: "",
    triageNotes: "",
    photoInfo: [],
    evdPositive: true,
    messageLastViewedAt: 1,
    messages: [],
    updatedAt: "04/21/2019",
  },
  {
    id: 2,
    uuid: "string",
    patientInfo: "",
    notes: "",
    triageNotes: "",
    photoInfo: [],
    evdPositive: true,
    messageLastViewedAt: 1,
    messages: [],
    updatedAt: "04/21/2019",
  },
];

import configureStore from "redux-mock-store";
const initialState = {
  patients: dummyPatients,
  meta: {
    order: "",
    sortBy: "",
    demoMode: "false",
    healthWorkerInfo: {
      firstName: "J",
      lastName: "Doe",
      phone: "5555555",
      notes: "Some notes here",
      uid: "11111111",
    },
  },
};
const mockStore = configureStore();
let store;
beforeEach(() => {
  store = mockStore(initialState);
});

it("renders without crashing", () => {
  // Shallow Render because so much depends on nested components
  // Better to test individual screens + components with mocked data

  const r = new ShallowRenderer();
  r.render(<App />);

  r.render(<Login store={store} />);
  r.render(<Patients store={store} />);
  r.render(<Details store={store} />);
});
