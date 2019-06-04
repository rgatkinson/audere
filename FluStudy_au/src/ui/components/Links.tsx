// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import { GUTTER, SECONDARY_COLOR } from "../styles";
import {
  linkConfig,
  LinkConfig,
  LinkConfigProps,
  LinkPropProvider,
} from "../../resources/LinkConfig";

interface Props {
  center?: boolean;
  links: string[];
}

class Links extends React.Component<Props & LinkConfigProps & WithNamespaces> {
  _links: LinkConfig[];

  constructor(props: Props & LinkConfigProps & WithNamespaces) {
    super(props);
    this._links = props.links
      .filter(linkId => linkConfig.has(linkId))
      .map(linkId => linkConfig.get(linkId)!);
  }

  render() {
    const { t } = this.props;
    return (
      <View style={styles.container}>
        {this._links.map(link => (
          <TouchableOpacity
            key={link.key}
            onPress={() => link.action(this.props)}
          >
            <Text
              center={this.props.center}
              content={t(link.key)}
              style={styles.linkStyle}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  }
}

export default LinkPropProvider(withNamespaces("links")(Links));

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: GUTTER,
    marginHorizontal: GUTTER,
  },
  linkStyle: {
    color: SECONDARY_COLOR,
    marginBottom: GUTTER / 2,
  },
});
