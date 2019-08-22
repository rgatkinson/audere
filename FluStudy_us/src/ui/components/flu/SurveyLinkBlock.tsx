// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { AppState, Linking, StyleSheet, TouchableOpacity } from "react-native";
import { connect } from "react-redux";
import { WorkflowInfo } from "audere-lib/coughProtocol";
import {
  GUTTER,
  BORDER_RADIUS,
  SECONDARY_COLOR,
  LARGE_TEXT,
} from "../../styles";
import { StoreState } from "../../../store";
import { followUpSurveyUrl } from "../../../resources/LinkConfig";
import ScreenText from "../ScreenText";
import { getRemoteConfig } from "../../../util/remoteConfig";

const MILLIS_IN_TWO_DAYS = 1000 * 60 * 60 * 24 * 2;

interface Props {
  barcode: string;
  workflow: WorkflowInfo;
}

interface State {
  shouldRender: boolean;
}

class SurveyLinkBlock extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { shouldRender: false };
  }

  _onPress = () => {
    Linking.openURL(`${followUpSurveyUrl}?r=${this.props.barcode}`);
  };

  componentDidMount() {
    AppState.addEventListener("change", this._handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === "active" && !!this.props.workflow.surveyCompletedAt) {
      const surveyCompletedAt = new Date(this.props.workflow.surveyCompletedAt);
      const now = new Date();
      if (now.getTime() - surveyCompletedAt.getTime() > MILLIS_IN_TWO_DAYS) {
        this.setState({ shouldRender: true });
      }
    }
  };

  render() {
    if (!this.props.workflow.surveyCompletedAt) {
      return null;
    }

    if (!this.state.shouldRender) {
      return null;
    }

    if (getRemoteConfig("skipSurveyNotification")) {
      return null;
    }

    const namespace = "SurveyLinkBlock";
    return (
      <TouchableOpacity style={styles.container} onPress={this._onPress}>
        <ScreenText
          label={"title"}
          namespace={namespace}
          center={true}
          style={styles.title}
        />
        <ScreenText label={"body"} namespace={namespace} />
        <ScreenText
          label={"link"}
          namespace={namespace}
          style={styles.linkLabel}
        />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#E5EEF8",
    borderRadius: BORDER_RADIUS,
    margin: GUTTER,
    padding: GUTTER,
    paddingBottom: 0,
  },
  title: {
    fontSize: LARGE_TEXT,
  },
  linkLabel: {
    color: SECONDARY_COLOR,
  },
});

export default connect((state: StoreState) => ({
  barcode: state.survey.kitBarcode ? state.survey.kitBarcode.code : "",
  workflow: state.survey.workflow,
}))(SurveyLinkBlock);
