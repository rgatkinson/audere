// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { Fragment } from "react";
import { Image, StyleProp, StyleSheet, TextStyle, View } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import Text from "./Text";
import Number from "./Number";
import { REGULAR_TEXT, GUTTER, CUSTOM_BULLET_OFFSET } from "../styles";

interface Props {
  content: string;
  customBulletUri?: string;
  num?: number;
  textStyle?: StyleProp<TextStyle>;
}

export class BulletPoint extends React.PureComponent<Props> {
  render() {
    const { customBulletUri, content, num, textStyle } = this.props;
    const bulletUri = customBulletUri || "bullet";
    return (
      <View style={styles.container}>
        {num != null ? (
          <Number num={num} />
        ) : (
          <Image source={{ uri: bulletUri }} style={styles.bulletImage} />
        )}
        <Text
          style={[styles.bulletText, textStyle && textStyle]}
          content={content}
        />
      </View>
    );
  }
}

interface BulletProps {
  customBulletUri?: string;
  label?: string;
  namespace: string;
  num?: number;
  remoteConfigValues?: { [key: string]: string };
  textStyle?: StyleProp<TextStyle>;
  textVariablesFn?(): any;
}

interface BulletState {
  textVariables: any;
}

class BulletPointsComponent extends React.Component<
  BulletProps & WithNamespaces,
  BulletState
> {
  constructor(props: BulletProps & WithNamespaces) {
    super(props);
    this.state = { textVariables: null };
  }

  shouldComponentUpdate(
    props: BulletProps & WithNamespaces,
    state: BulletState
  ) {
    return (
      props.num != this.props.num ||
      props.customBulletUri != this.props.customBulletUri ||
      props.label != this.props.label ||
      props.namespace != this.props.namespace ||
      state.textVariables != this.state.textVariables
    );
  }

  async componentDidMount() {
    const { textVariablesFn } = this.props;
    let textVariables;

    if (!!textVariablesFn) {
      textVariables = await textVariablesFn();
      this.setState({ textVariables });
    }
  }

  render() {
    const {
      customBulletUri,
      label,
      namespace,
      num,
      remoteConfigValues,
      t,
      textStyle,
    } = this.props;

    return (
      <Fragment>
        <View>
          {t(namespace + (!!label ? `:${label}` : ":bullets"), {
            ...remoteConfigValues,
            ...this.state.textVariables,
          })
            .split("\n")
            .map((bullet: string, index: number) => {
              return (
                <BulletPoint
                  key={`bullet-${index}`}
                  content={bullet}
                  customBulletUri={customBulletUri}
                  num={num}
                  textStyle={textStyle}
                />
              );
            })}
        </View>
      </Fragment>
    );
  }
}
export default withNamespaces()(BulletPointsComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  bulletImage: {
    height: REGULAR_TEXT,
    width: REGULAR_TEXT,
    marginRight: GUTTER / 2,
    marginTop: CUSTOM_BULLET_OFFSET,
  },
  bulletText: {
    flex: 1,
    marginBottom: GUTTER,
  },
});
