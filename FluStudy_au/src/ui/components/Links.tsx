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

interface LinkProps {
  center?: boolean;
  link: LinkConfig;
  onPress: (link: LinkConfig) => void;
}

class Link extends React.Component<LinkProps & WithNamespaces> {
  _onPress = () => {
    this.props.onPress(this.props.link);
  };

  render() {
    const { center, link, t } = this.props;
    return (
      <TouchableOpacity key={link.key} onPress={this._onPress}>
        <Text center={center} content={t(link.key)} style={styles.linkStyle} />
      </TouchableOpacity>
    );
  }
}
const LinkWithNS = withNamespaces("links")(Link);

interface Props {
  center?: boolean;
  links: string[];
}

class Links extends React.Component<Props & LinkConfigProps> {
  _links: LinkConfig[];

  constructor(props: Props & LinkConfigProps) {
    super(props);
    this._links = props.links
      .filter(linkId => linkConfig.has(linkId))
      .map(linkId => linkConfig.get(linkId)!);
  }

  _onPress = (link: LinkConfig) => {
    link.action(this.props);
  };

  render() {
    const { center } = this.props;
    return (
      <View style={styles.container}>
        {this._links.map(link => (
          <LinkWithNS center={center} key={link.key} link={link} onPress={this._onPress} />
        ))}
      </View>
    );
  }
}

export default LinkPropProvider(Links);

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
