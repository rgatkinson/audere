// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import React, { ComponentType } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { NavigationScreenProp } from "react-navigation";
import Chrome from "./Chrome";
import { GUTTER } from "../styles";

export interface DeclarativeScreenConfig {
  body: Component[];
  chromeProps?: object;
  footer?: Component[];
  key: string;
}

interface Component {
  tag: ComponentType<any>;
  props?: object;
}

interface DeclarativeProps {
  navigation: NavigationScreenProp<any, any>;
}

export const generateDeclarativeScreen = (config: DeclarativeScreenConfig) => {
  class DeclarativeScreen extends React.Component<DeclarativeProps> {
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
            key={indexId + index}
            namespace={screenKey}
          />
        );
      });
    };

    render() {
      return (
        <Chrome {...config.chromeProps} navigation={this.props.navigation}>
          <View style={styles.scrollContainer}>
            <ScrollView
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
            </ScrollView>
          </View>
        </Chrome>
      );
    }
  }
  return DeclarativeScreen;
};

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: GUTTER / 2,
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
