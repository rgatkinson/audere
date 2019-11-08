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
import { GUTTER } from "../styles";
import { logFirebaseEvent } from "../../util/tracker";

// You can either provide namespace + titleLabel + bodyLabel if you want this
// component to load your strings, or just pass content if you already have
// the string loaded.  If you pass content, all text before the first \n will
// be considered title, and everything else will be the body.
interface Props {
  titleLabel?: string;
  bodyLabel?: string;
  content?: string;
  namespace?: string;
  appEvent?: string; // What event is generated when title is clicked
  textStyle?: StyleProp<TextStyle>;
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
    const { title } = this._getTitleAndBody();

    this.setState({ expanded: nowExpanded });
    if (this.props.appEvent) {
      logFirebaseEvent(this.props.appEvent, {
        nowExpanded,
        title,
      });
    }
  };

  _getTitleAndBody(): { title: string; body: string } {
    const { content, namespace, t } = this.props;
    if (!!content) {
      const contentT = t(namespace + ":" + content!);
      const titleEnd = contentT.indexOf("\n");

      return {
        title: contentT.substring(0, titleEnd),
        body: contentT.substring(titleEnd + 1),
      };
    } else {
      const { titleLabel, bodyLabel } = this.props;
      return {
        title: t(
          titleLabel!.includes(":") ? titleLabel : namespace + ":" + titleLabel
        ),
        body: t(
          bodyLabel!.includes(":") ? bodyLabel : namespace + ":" + bodyLabel
        ),
      };
    }
  }

  render() {
    const { textStyle } = this.props;
    const { title, body } = this._getTitleAndBody();
    const { expanded } = this.state;
    const marker = expanded ? "**\u25be** " : "**\u25b8** ";
    const expansion = expanded ? (
      <Text content={body} style={[styles.bodyText, textStyle && textStyle]} />
    ) : (
      undefined
    );

    return (
      <TouchableOpacity onPress={this._onPress} style={styles.main}>
        <View style={styles.content}>
          <Text
            content={marker}
            style={[styles.marker, textStyle && textStyle]}
          />
          <View>
            <Text content={title} style={textStyle} />
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
