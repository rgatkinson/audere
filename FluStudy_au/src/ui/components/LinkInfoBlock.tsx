// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import {
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GUTTER,
  BORDER_WIDTH,
  BORDER_RADIUS,
  SECONDARY_COLOR,
  LARGE_TEXT,
  IMAGE_WIDTH,
  BUTTON_BORDER_RADIUS,
} from "../styles";
import ScreenText from "./ScreenText";

const ICON_WIDTH = 76;

interface Props {
  titleLabel: string;
  icons: string[];
  linkLabel: string;
  uri: string;
  namespace: string;
}

class LinkInfoBlock extends React.PureComponent<Props & WithNamespaces> {
  _onPress = () => {
    Linking.openURL(this.props.uri);
  };

  render() {
    const { namespace, t, titleLabel, icons, linkLabel, uri } = this.props;
    const iconImages =
      icons.length > 0
        ? icons.map(name => (
            <Image style={styles.iconImage} source={{ uri: name }} key={name} />
          ))
        : undefined;

    return (
      <TouchableOpacity style={styles.content} onPress={this._onPress}>
        <ScreenText
          label={titleLabel}
          namespace={namespace}
          bold={true}
          center={true}
          style={styles.title}
        />
        <View style={styles.icons}>{iconImages}</View>
        <ScreenText
          label={linkLabel}
          namespace={namespace}
          bold={true}
          style={styles.linkLabel}
        />
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  content: {
    borderWidth: BORDER_WIDTH * 2,
    borderColor: SECONDARY_COLOR,
    borderRadius: BORDER_RADIUS,
    margin: GUTTER,
    padding: GUTTER,
    paddingBottom: 0,
  },
  title: {
    fontSize: LARGE_TEXT,
  },
  icons: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: GUTTER,
  },
  iconImage: {
    width: ICON_WIDTH,
    height: ICON_WIDTH,
  },
  linkLabel: {
    color: SECONDARY_COLOR,
  },
});

export default withNamespaces()(LinkInfoBlock);
