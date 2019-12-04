// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import {
  Linking,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { withNavigation, NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Action } from "../../store";
import Button from "./Button";
import { textActions } from "../../resources/TextConfig";
import { logFirebaseEvent, AppEvents } from "../../util/tracker";
import { GUTTER } from "../styles";

interface Props {
  label: string;
  navigation: NavigationScreenProp<any, any>;
  namespace: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  dispatch(action: Action): void;
  textVariablesFn?(): any;
}

interface State {
  textVariables: any;
}

class LinkButton extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = { textVariables: undefined };
  }

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return (
      this.props.label !== this.props.label ||
      props.namespace !== this.props.namespace ||
      this.state.textVariables !== state.textVariables
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

  computeLinkParams = () => {
    const { label, namespace, t } = this.props;
    const { textVariables } = this.state;
    const content = label.includes(":")
      ? t(label, textVariables)
      : t(namespace + ":" + label, textVariables);
    const linkRegex = /\[(.+?)\]\((.+?)\)/;
    const result = content.match(linkRegex);
    if (result && result.length == 3) {
      return {
        title: result[1],
        link: result[2],
      };
    }
    return null;
  };

  _onPress = () => {
    const linkParams = this.computeLinkParams();
    const link = linkParams!.link;
    logFirebaseEvent(AppEvents.LINK_PRESSED, { link: linkParams!.title });
    const separatorPos = link.indexOf(":");
    let url = link;
    if (separatorPos > 0) {
      url = link.substr(0, separatorPos);
    }
    if (textActions.hasOwnProperty(url)) {
      (textActions as any)[url](
        link.title,
        this.props.navigation,
        separatorPos > 0 ? link.substr(separatorPos + 1) : undefined
      );
    } else {
      Linking.openURL(link.url);
    }
  };

  render() {
    const { style, textStyle } = this.props;
    const linkParams = this.computeLinkParams();
    const label = linkParams && linkParams.title;
    return (
      <Button
        enabled={!!linkParams}
        label={label}
        primary={true}
        style={[style, styles.linkButton]}
        textStyle={textStyle}
        onPress={this._onPress}
      />
    );
  }
}

const styles = StyleSheet.create({
  linkButton: {
    marginBottom: GUTTER,
  },
});

export default connect()(withNavigation(withNamespaces()(LinkButton)));
