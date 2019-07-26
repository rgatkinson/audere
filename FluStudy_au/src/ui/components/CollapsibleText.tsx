// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import { GUTTER } from "../styles";
import { logFirebaseEvent, AppEvents } from "../../util/tracker";

// You can either provide namespace + titleLabel + bodyLabel if you want this
// component to load your strings, or just pass content if you already have
// the string loaded.  If you pass content, all text before the first \n will
// be considered title, and everything else will be the body.
interface Props {
  titleLabel?: string;
  bodyLabel?: string;
  content?: string;
  namespace?: string;
  appEvent: string; // What event is generated when title is clicked
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
    logFirebaseEvent(this.props.appEvent, {
      nowExpanded,
      title,
    });
  };

  _getTitleAndBody(): { title: string; body: string } {
    if (!!this.props.content) {
      const content = this.props.content!;
      const titleEnd = content.indexOf("\n");

      return {
        title: content.substring(0, titleEnd),
        body: content.substring(titleEnd + 1),
      };
    } else {
      const { titleLabel, bodyLabel, namespace, t } = this.props;
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
    const { title, body } = this._getTitleAndBody();
    const { expanded } = this.state;
    const marker = expanded ? "[-]" : "[+]";
    const expansion = expanded ? (
      <Text content={body} style={styles.bodyText} />
    ) : (
      undefined
    );

    return (
      <TouchableOpacity onPress={this._onPress} style={styles.main}>
        <View style={styles.content}>
          <Text content={marker} style={styles.marker} />
          <View>
            <Text content={title} />
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
