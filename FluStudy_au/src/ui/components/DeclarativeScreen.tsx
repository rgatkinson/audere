// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { ComponentType, RefObject } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { wrapScrollView } from "react-native-scroll-into-view";
import { WorkflowInfo } from "audere-lib/feverProtocol";
import { Action, StoreState, setWorkflow } from "../../store";
import { tracker } from "../../util/tracker";
import Chrome from "./Chrome";
import { GUTTER } from "../styles";

export interface DeclarativeScreenConfig {
  body: Component[];
  chromeProps?: object;
  footer?: Component[];
  funnelEvent?: string;
  key: string;
  workflowEvent?: string;
}

interface Component {
  tag: ComponentType<any>;
  props?: object;
  validate?: boolean;
}

interface DeclarativeProps {
  navigation: NavigationScreenProp<any, any>;
  workflow: WorkflowInfo;
  dispatch(action: Action): void;
}

const CustomScrollView = wrapScrollView(ScrollView);

export const generateDeclarativeScreen = (config: DeclarativeScreenConfig) => {
  class DeclarativeScreen extends React.Component<DeclarativeProps> {
    _toValidate: Map<string, RefObject<any>>;

    constructor(props: DeclarativeProps) {
      super(props);
      this._toValidate = new Map<string, RefObject<any>>();
      config.body.map((component, index) => {
        if (component.validate) {
          this._toValidate.set("body" + index, React.createRef<any>());
        }
      });
    }

    componentDidMount() {
      if (config.funnelEvent) {
        tracker.logEvent(config.funnelEvent);
      }
      if (config.workflowEvent) {
        const workflow = { ...this.props.workflow };
        workflow[config.workflowEvent] = new Date().toISOString();
        this.props.dispatch(setWorkflow(workflow));
      }
    }

    _generateComponents = (
      components: Component[],
      indexId: string,
      screenKey: string
    ) => {
      return components.map((component, index) => {
        const Tag = component.tag;
        return (
          <Tag
            {...component.props}
            customRef={this._toValidate.get(indexId + index)}
            key={indexId + index}
            namespace={screenKey}
            validate={this._validateComponents}
          />
        );
      });
    };

    _validateComponents = () => {
      return Array.from(this._toValidate.values()).reduce(
        (result, ref) => result && ref.current!.validate(),
        true
      );
    };

    render() {
      return (
        <Chrome {...config.chromeProps} navigation={this.props.navigation}>
          <View style={styles.scrollContainer}>
            <CustomScrollView
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.innerContainer}>
                {this._generateComponents(config.body, "body", config.key)}
              </View>
              <View style={styles.footerContainer}>
                {config.footer &&
                  this._generateComponents(config.footer, "footer", config.key)}
              </View>
            </CustomScrollView>
          </View>
        </Chrome>
      );
    }
  }
  return connect((state: StoreState) => {
    return {
      workflow: state.survey.workflow,
    };
  })(DeclarativeScreen);
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  footerContainer: {
    alignItems: "center",
    alignSelf: "stretch",
    marginHorizontal: GUTTER,
  },
  innerContainer: {
    marginHorizontal: GUTTER,
    flex: 1,
  },
  scrollContainer: {
    alignSelf: "stretch",
    flex: 1,
  },
});
