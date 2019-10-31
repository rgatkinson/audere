// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { StyleProp, TextStyle } from "react-native";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import Text from "./Text";
import { GUTTER } from "../styles";
import { StoreState } from "../../store";

interface Props {
  bold?: boolean;
  center?: boolean;
  italic?: boolean;
  label: string | string[];
  namespace: string;
  style?: StyleProp<TextStyle>;
  conditionalTextFn?(): string | null;
  isDemo: boolean;
  demoOnly?: boolean;
  textVariablesFn?(): any;
}

interface State {
  textVariables: any;
}

function getScopedLabel(label: string, namespace: string): string {
  return label.includes(":") ? label : namespace + ":" + label;
}

class ScreenText extends React.Component<Props & WithNamespaces, State> {
  constructor(props: Props & WithNamespaces) {
    super(props);
    this.state = { textVariables: null };
  }

  shouldComponentUpdate(props: Props & WithNamespaces, state: State) {
    return (
      props.center != this.props.center ||
      props.label != this.props.label ||
      props.namespace != this.props.namespace ||
      props.italic != this.props.italic ||
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
      bold,
      center,
      conditionalTextFn,
      demoOnly,
      isDemo,
      italic,
      namespace,
      label,
      style,
      t,
    } = this.props;

    if (demoOnly && !isDemo) {
      return null;
    }

    const allTheLabels = label instanceof Array ? label : [label];
    const allTheLabelText = allTheLabels.map(l =>
      t(getScopedLabel(l, namespace), this.state.textVariables)
    );

    return (
      <Text
        bold={bold}
        center={center}
        content={
          !!conditionalTextFn
            ? t(`${namespace}:${conditionalTextFn()}`, this.state.textVariables)
            : allTheLabelText.join(" ")
        }
        italic={italic}
        style={[
          {
            alignSelf: "stretch",
            marginBottom: GUTTER,
          },
          style,
        ]}
      />
    );
  }
}

export default connect((state: StoreState) => ({
  isDemo: state.meta.isDemo,
}))(withNamespaces()(ScreenText));
