// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Linking, StyleSheet, TouchableOpacity } from "react-native";
import { connect } from "react-redux";
import { BORDER_RADIUS, SECONDARY_COLOR, LARGE_TEXT } from "../../styles";
import { StoreState } from "../../../store";
import { followUpSurveyUrl } from "../../../resources/LinkConfig";
import ScreenText from "../ScreenText";
import { logFirebaseEvent, AppEvents } from "../../../util/tracker";

interface Props {
  barcode: string;
}

class SurveyLinkBlock extends React.PureComponent<Props> {
  _onPress = () => {
    logFirebaseEvent(AppEvents.LINK_PRESSED, { link: followUpSurveyUrl });
    Linking.openURL(`${followUpSurveyUrl}?r=${this.props.barcode}`);
  };

  render() {
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
    borderRadius: BORDER_RADIUS,
    margin: 0,
    padding: 0,
  },
  title: {
    fontSize: LARGE_TEXT,
  },
  linkLabel: {
    color: SECONDARY_COLOR,
    marginBottom: 0,
  },
});

export default connect((state: StoreState) => ({
  barcode: state.survey.kitBarcode ? state.survey.kitBarcode.code : "",
}))(SurveyLinkBlock);
