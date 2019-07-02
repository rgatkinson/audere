// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import ScreenText from "./ScreenText";
import { GUTTER } from "../styles";
import { logFirebaseEvent, AppEvents } from "../../util/tracker";

interface Props {
  titleLabel: string;
  bodyLabel: string;
  namespace: string;
}

interface State {
  expanded: boolean;
}

class CollapsibleText extends React.Component<Props & WithNamespaces> {
  state: State = {
    expanded: false,
  };

  _onPress = () => {
    const nowExpanded = !this.state.expanded;

    this.setState({ expanded: nowExpanded });
    logFirebaseEvent(AppEvents.FAQ_PRESSED, {
      nowExpanded,
      question: this.props.titleLabel,
    });
  };

  render() {
    const { namespace, titleLabel, bodyLabel, t } = this.props;
    const { expanded } = this.state;
    const marker = expanded ? "[-]" : "[+]";
    const expansion = expanded ? (
      <Text
        content={t(
          bodyLabel.includes(":") ? bodyLabel : namespace + ":" + bodyLabel
        )}
        style={styles.bodyText}
      />
    ) : (
      undefined
    );

    return (
      <TouchableOpacity onPress={this._onPress} style={styles.main}>
        <View style={styles.content}>
          <Text content={marker} style={styles.marker} />
          <View>
            <Text
              content={t(
                titleLabel.includes(":")
                  ? titleLabel
                  : namespace + ":" + titleLabel
              )}
            />
            {expansion}
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  main: {
    marginRight: GUTTER * 2,
    marginBottom: GUTTER,
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  marker: {
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  bodyText: {
    marginTop: GUTTER / 2,
  },
});

export default withNamespaces()(CollapsibleText);
