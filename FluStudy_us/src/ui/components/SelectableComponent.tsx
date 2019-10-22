// Copyright (c) 2018 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React from "react";
import { connect } from "react-redux";
import { StoreState } from "../../store";
import { Component } from "./Screen";

interface Props {
  components: Component[] | Component[][];
  componentSelectorProp: string;
  componentSelector?: number;
  keyBase: string;
  namespace: string;
  validate?: boolean;
  remoteConfigValues?: { [key: string]: string };
}

class SelectableComponent extends React.Component<Props> {
  shouldComponentUpdate(props: Props) {
    return props.componentSelector != this.props.componentSelector;
  }

  render() {
    const {
      components,
      keyBase,
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

    const segment = components[+componentSelector];
    if (!segment) {
      return null;
    }

    let componentsToRender: Component[] = [];
    if (Array.isArray(segment)) {
      componentsToRender = segment;
    } else {
      componentsToRender.push(segment);
    }

    return componentsToRender.map((component, index) => {
      return (
        component && (
          <component.tag
            {...component.props}
            key={keyBase + index}
            namespace={namespace}
            validate={validate}
            remoteConfigValues={remoteConfigValues}
          />
        )
      );
    });
  }
}

export default connect((state: StoreState, props: Props) => ({
  componentSelector: state.survey[props.componentSelectorProp],
}))(SelectableComponent);
