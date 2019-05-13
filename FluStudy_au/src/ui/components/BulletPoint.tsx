// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import { GUTTER } from "../styles";

interface Props {
  content: string;
}

export default class BulletPoint extends React.Component<Props> {
  render() {
    return (
      <View style={styles.container}>
        <Text content={"\u2022  "} />
        <Text content={this.props.content} style={{ flex: 1 }} />
      </View>
    );
  }
}

interface BulletProps {
  namespace: string;
}

class BulletPointsComponent extends React.Component<
  BulletProps & WithNamespaces
> {
  render() {
    const { namespace, t } = this.props;
    return (
      <Fragment>
        {t(namespace + ":bullets")
          .split("\n")
          .map((bullet: string, index: number) => {
            return <BulletPoint key={`bullet-${index}`} content={bullet} />;
          })}
      </Fragment>
    );
  }
}
export const BulletPoints = withNamespaces()(BulletPointsComponent);

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    flexDirection: "row",
    marginBottom: GUTTER,
  },
});
