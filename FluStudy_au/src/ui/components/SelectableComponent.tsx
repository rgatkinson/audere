// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { WithNamespaces, withNamespaces } from "react-i18next";
import { connect } from "react-redux";
import { StoreState } from "../../store";
import { Component } from "./Screen";

interface Props {
  components: Component[];
  componentSelectorProp: string;
  componentSelector?: number;
  key: string;
  namespace: string;
  validate?: boolean;
  remoteConfigValues?: { [key: string]: string };
}

class SelectableComponent extends React.Component<Props & WithNamespaces> {
  render() {
    const {
      components,
      key,
      namespace,
      validate,
      remoteConfigValues,
    } = this.props;
    let componentSelector = this.props.componentSelector;
    if (componentSelector === undefined) {
      componentSelector = 0;
    }
    if (componentSelector == -1) {
      return null;
    }

    const component = components[+componentSelector];
    if (!component) {
      return null;
    }

    const Tag = component.tag;
    return (
      <Tag
        {...component.props}
        key={key}
        namespace={namespace}
        validate={validate}
        remoteConfigValues={remoteConfigValues}
      />
    );
  }
}

export default connect((state: StoreState, props: Props & WithNamespaces) => ({
  componentSelector: state.survey[props.componentSelectorProp],
}))(withNamespaces()(SelectableComponent));
