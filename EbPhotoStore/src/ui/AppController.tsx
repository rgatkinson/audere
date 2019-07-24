import React from "react";
import { Text, View } from "react-native";
import { connect } from "react-redux";
import { Screen, StoreState } from "../store";
import Login from "./Login";
import Patients from "./Patients";
import PatientDetails from "./PatientDetails";

interface Props {
  currentPatient?: number;
  screen: Screen;
}

class AppController extends React.Component<Props> {
  render() {
    switch (this.props.screen) {
      case Screen.Login:
        return <Login />;
      case Screen.Patients:
        return <Patients />;
      case Screen.PatientDetails:
        return <PatientDetails id={this.props.currentPatient} />;
    }
  }
}
export default connect((state: StoreState) => ({
  currentPatient: state.meta.currentPatient,
  screen: state.meta.screen
}))(AppController);
